"""Iteration 40 — Watch streak + actor subscriptions + recommendations.

Tests cover:
- Streak: GET /api/user/streak, auto-increment via POST /api/user/history (movie),
  same-day no double-count, milestone (3 days) via backdated DB doc.
- Actor subscriptions: subscribe/check/list + check-actor-releases trigger.
- Recommendations endpoint still works.
- Existing series subscription + check-new-episodes endpoints still work.
"""
import os
import datetime as dt
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"

assert BASE_URL, "REACT_APP_BACKEND_URL not set"


# -------- Fixtures --------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    }, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:300]}"
    token = r.json().get("access_token") or r.json().get("token")
    assert token, f"no token in: {r.json()}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def admin_user_id(session):
    r = session.get(f"{BASE_URL}/api/auth/me", timeout=10)
    assert r.status_code == 200
    j = r.json()
    return j.get("_id") or j.get("id")


# Direct Mongo helper for setup/teardown of streak doc
def _mongo():
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    assert mongo_url and db_name, "MONGO_URL/DB_NAME not set"
    return MongoClient(mongo_url)[db_name]


# Load backend env for mongo
def setup_module(_):
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")


# -------- Streak --------
class TestStreak:
    def test_a_reset_streak_doc(self, admin_user_id):
        db = _mongo()
        db.user_streaks.delete_many({"user_id": admin_user_id})
        # Pre-condition: GET returns 0
        # (use session in next test)

    def test_b_streak_zero_initial(self, session, admin_user_id):
        r = session.get(f"{BASE_URL}/api/user/streak", timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ["current_streak", "longest_streak", "milestones",
                  "next_milestone", "is_active_today", "broken"]:
            assert k in j, f"missing key {k} in {j}"
        assert j["current_streak"] == 0
        assert j["is_active_today"] is False

    def test_c_post_history_movie_increments(self, session):
        # Use a unique content_id to avoid clashing previous history
        payload = {"content_type": "movie", "content_id": 550,
                   "title": "Fight Club", "runtime": 139}
        r = session.post(f"{BASE_URL}/api/user/history", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        r2 = session.get(f"{BASE_URL}/api/user/streak", timeout=10)
        j = r2.json()
        assert j["current_streak"] == 1, f"expected 1, got {j}"
        assert j["is_active_today"] is True
        assert j["longest_streak"] >= 1
        assert j["total_active_days"] >= 1

    def test_d_same_day_repeat_no_increment(self, session):
        payload = {"content_type": "movie", "content_id": 550,
                   "title": "Fight Club", "runtime": 139}
        r = session.post(f"{BASE_URL}/api/user/history", json=payload, timeout=15)
        assert r.status_code in (200, 201)
        # Even a different movie same day should not double-count
        r2 = session.post(f"{BASE_URL}/api/user/history", json={
            "content_type": "movie", "content_id": 680, "title": "Pulp Fiction", "runtime": 154
        }, timeout=15)
        assert r2.status_code in (200, 201)
        r3 = session.get(f"{BASE_URL}/api/user/streak", timeout=10)
        j = r3.json()
        assert j["current_streak"] == 1, f"streak should stay 1, got {j['current_streak']}"

    def test_e_milestone_3_days(self, session, admin_user_id):
        """Backdate streak doc to 2 days ago with current=2, then trigger another POST."""
        db = _mongo()
        two_days_ago = (dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=1)).isoformat()
        started = (dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=2)).isoformat()
        db.user_streaks.update_one(
            {"user_id": admin_user_id},
            {"$set": {
                "current_streak": 2,
                "longest_streak": 2,
                "last_watch_date": two_days_ago,
                "streak_started_at": started,
                "total_active_days": 2,
            }},
            upsert=True,
        )
        # Clear prior notifications/xp for this milestone
        db.xp_bonuses.delete_many({"user_id": admin_user_id, "event_slug": "streak_3"})
        db.notifications.delete_many({"user_id": admin_user_id, "type": "streak"})

        payload = {"content_type": "movie", "content_id": 27205,
                   "title": "Inception", "runtime": 148}
        r = session.post(f"{BASE_URL}/api/user/history", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text

        r2 = session.get(f"{BASE_URL}/api/user/streak", timeout=10)
        j = r2.json()
        assert j["current_streak"] == 3, f"expected 3 after backdated +1, got {j}"

        # Verify milestone XP bonus was created
        bonus = db.xp_bonuses.find_one({"user_id": admin_user_id, "event_slug": "streak_3"})
        assert bonus is not None, "streak_3 xp_bonus not created"
        assert bonus.get("bonus_xp") == 15

        # Verify notification was created
        notif = db.notifications.find_one({"user_id": admin_user_id, "type": "streak"})
        assert notif is not None, "streak notification not created"


# -------- Actor Subscriptions --------
class TestActorSubscriptions:
    ACTOR_ID = 287  # Brad Pitt
    ACTOR_NAME = "Brad Pitt"

    def test_a_initial_check(self, session, admin_user_id):
        # ensure clean
        db = _mongo()
        db.actor_subscriptions.delete_many({"user_id": admin_user_id, "actor_id": self.ACTOR_ID})
        r = session.get(f"{BASE_URL}/api/notifications/check-actor/{self.ACTOR_ID}", timeout=10)
        assert r.status_code == 200
        assert r.json().get("subscribed") is False

    def test_b_subscribe_returns_true(self, session):
        r = session.post(f"{BASE_URL}/api/notifications/subscribe-actor", json={
            "actor_id": self.ACTOR_ID, "actor_name": self.ACTOR_NAME
        }, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json().get("subscribed") is True

    def test_c_check_now_true(self, session):
        r = session.get(f"{BASE_URL}/api/notifications/check-actor/{self.ACTOR_ID}", timeout=10)
        assert r.json().get("subscribed") is True

    def test_d_list_subscribed(self, session):
        r = session.get(f"{BASE_URL}/api/notifications/subscribed-actors", timeout=10)
        assert r.status_code == 200
        subs = r.json().get("subscriptions", [])
        assert any(s.get("actor_id") == self.ACTOR_ID for s in subs)

    def test_e_toggle_unsubscribe(self, session):
        r = session.post(f"{BASE_URL}/api/notifications/subscribe-actor", json={
            "actor_id": self.ACTOR_ID, "actor_name": self.ACTOR_NAME
        }, timeout=15)
        assert r.status_code == 200
        assert r.json().get("subscribed") is False

    def test_f_check_actor_releases_trigger(self, session):
        # Re-subscribe so endpoint has data
        session.post(f"{BASE_URL}/api/notifications/subscribe-actor", json={
            "actor_id": self.ACTOR_ID, "actor_name": self.ACTOR_NAME
        }, timeout=15)
        r = session.post(f"{BASE_URL}/api/notifications/check-actor-releases", timeout=60)
        assert r.status_code == 200, r.text
        assert "notified" in r.json()


# -------- Recommendations --------
class TestRecommendations:
    def test_recommendations_endpoint(self, session):
        r = session.get(f"{BASE_URL}/api/user/recommendations", timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "recommendations" in j
        assert "source" in j
        assert j["source"] in ("personalised", "trending")
        assert isinstance(j["recommendations"], list)


# -------- Existing series subscriptions still work --------
class TestSeriesSubscriptions:
    def test_subscribe_series(self, session):
        r = session.post(f"{BASE_URL}/api/notifications/subscribe-series", json={
            "series_id": 1399, "series_name": "Game of Thrones"
        }, timeout=20)
        assert r.status_code in (200, 201), r.text

    def test_check_new_episodes(self, session):
        r = session.post(f"{BASE_URL}/api/notifications/check-new-episodes", timeout=60)
        assert r.status_code == 200, r.text
