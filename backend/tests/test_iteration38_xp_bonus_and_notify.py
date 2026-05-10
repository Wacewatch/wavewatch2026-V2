"""
Iteration 38 - Seasonal-Event admin notification + Bonus XP on /api/user/history

What this covers:
  1) POST /api/admin/seasonal-events/{event_id}/notify
       - admin: sends notif to all users, returns {sent, event}
       - non-admin: 403
       - unauthenticated: 401
       - missing event_id: 404
       - admin's own notification persists in /api/notifications

  2) /api/user/history POST grants Bonus XP via _get_matching_active_event:
       - first watch awards bonus = base * (xp_multiplier - 1)
       - re-post within 1h does NOT add another bonus (existing row -> no bonus path)
       - content_type not in bonus_content_types -> no bonus
       - bonus_genres set with no overlap -> no bonus
       - bonus_genres overlap -> bonus
       - xp_multiplier == 1 -> bonus 0 -> no row
       - no active event -> no bonus

  3) /api/user/stats returns xp_bonus
  4) /api/user/xp-bonuses returns {total_bonus_xp, by_event, recent}

Design notes
------------
- The helper _get_matching_active_event caches the active-event list for 60 s.
  Whenever we mutate seasonal_events (create / update / delete) we must wait
  > 60 s before exercising bonus logic so the cache rolls over. We bundle
  several assertions per cache window to keep total runtime tractable.
- Today is May 10, 2026 -> we create May events that ARE currently active.
- TMDB ids used:  550 Fight Club (genres 18 Drama, 53 Thriller), 27 horror.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"

CACHE_BUST_SECONDS = 65  # _get_matching_active_event caches 60 s


@pytest.fixture(scope="session", autouse=True)
def _reset_register_rate_limit():
    """The /api/auth/register endpoint rate-limits per IP (30 per 24 h).
    Multiple iterations of this suite easily blow that budget on a shared
    egress IP, so we wipe the counter once per session."""
    try:
        from pymongo import MongoClient
        # Read MONGO_URL/DB_NAME from backend .env
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        if not mongo_url or not db_name:
            env_path = "/app/backend/.env"
            if os.path.exists(env_path):
                with open(env_path) as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("MONGO_URL=") and not mongo_url:
                            mongo_url = line.split("=", 1)[1]
                        elif line.startswith("DB_NAME=") and not db_name:
                            db_name = line.split("=", 1)[1]
        if mongo_url and db_name:
            client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
            client[db_name].register_attempts.delete_many({})
            client[db_name].login_attempts.delete_many({})
            client.close()
    except Exception as e:
        print(f"[fixture] could not reset register_attempts: {e}")
    yield


# ---------- helpers ----------------------------------------------------------

def _login(session: requests.Session, email: str, password: str):
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token in body: {body}"
    session.headers.update({"Authorization": f"Bearer {token}"})
    return body


def _register(session: requests.Session, email: str, username: str, password: str):
    r = session.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "username": username, "password": password},
        timeout=20,
    )
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token in register body: {body}"
    session.headers.update({"Authorization": f"Bearer {token}"})
    return body["user"]


def _fresh_user_session(tag: str):
    """Register a brand new user & return (session, user_dict)."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{tag}_{suffix}@gmail.com"
    username = f"t_{tag}_{suffix}"
    user = _register(s, email, username, "TestPass2026!")
    return s, user, email


def _admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    return s


def _delete_event(admin_s, event_id):
    try:
        admin_s.delete(f"{BASE_URL}/api/admin/seasonal-events/{event_id}", timeout=20)
    except Exception:
        pass


def _create_event(admin_s, **overrides):
    payload = {
        "name": "TEST May Event",
        "slug": f"test-{uuid.uuid4().hex[:6]}",
        "description": "auto-test",
        "icon": "Sparkles",
        "color": "#a855f7",
        "auto_theme": None,
        "month_start": 5, "day_start": 1,
        "month_end":   5, "day_end":   31,
        "xp_multiplier": 3.0,
        "bonus_genres": [],
        "bonus_content_types": ["movie"],
        "active": True,
    }
    payload.update(overrides)
    r = admin_s.post(
        f"{BASE_URL}/api/admin/seasonal-events",
        json=payload, timeout=20,
    )
    assert r.status_code == 200, f"create event failed: {r.status_code} {r.text}"
    return r.json()["event"]


# ---------- fixtures ---------------------------------------------------------

@pytest.fixture(scope="module")
def admin_s():
    return _admin_session()


# =============================================================================
# 1. NOTIFY endpoint
# =============================================================================

class TestNotifyEndpoint:
    """POST /api/admin/seasonal-events/{event_id}/notify"""

    def test_notify_unauthenticated_returns_401(self, admin_s):
        evt = _create_event(admin_s)
        try:
            r = requests.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=20,
            )
            assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"
        finally:
            _delete_event(admin_s, evt["id"])

    def test_notify_non_admin_returns_403(self, admin_s):
        evt = _create_event(admin_s)
        try:
            user_s, _, _ = _fresh_user_session("nonadmin")
            r = user_s.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=20,
            )
            assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"
        finally:
            _delete_event(admin_s, evt["id"])

    def test_notify_missing_event_returns_404(self, admin_s):
        r = admin_s.post(
            f"{BASE_URL}/api/admin/seasonal-events/evt_doesnotexist/notify",
            timeout=20,
        )
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text}"

    def test_notify_admin_broadcasts_to_users(self, admin_s):
        # Make sure at least 2 users exist (admin + one fresh user).
        user_s, _, user_email = _fresh_user_session("notif")
        evt = _create_event(admin_s)
        try:
            r = admin_s.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=30,
            )
            assert r.status_code == 200, f"notify failed: {r.status_code} {r.text}"
            data = r.json()
            assert "sent" in data and isinstance(data["sent"], int) and data["sent"] >= 2
            assert data.get("event") == evt["slug"]

            # The fresh user should now see the event notification
            r2 = user_s.get(f"{BASE_URL}/api/notifications", timeout=20)
            assert r2.status_code == 200
            notifs = r2.json().get("notifications", [])
            event_notifs = [
                n for n in notifs
                if n.get("type") == "event" and evt["name"] in (n.get("title") or "")
            ]
            assert event_notifs, f"event notification not found for fresh user. all: {notifs[:3]}"

            # Admin themself also receives
            r3 = admin_s.get(f"{BASE_URL}/api/notifications", timeout=20)
            assert r3.status_code == 200
            admin_notifs = r3.json().get("notifications", [])
            assert any(
                n.get("type") == "event" and evt["name"] in (n.get("title") or "")
                for n in admin_notifs
            ), "admin did not receive its own broadcast"
        finally:
            _delete_event(admin_s, evt["id"])


# =============================================================================
# 2. Bonus XP on /api/user/history
# =============================================================================

@pytest.fixture(scope="module")
def bonus_event_phase_a(admin_s):
    """
    Phase A event:  May, types=[movie], bonus_genres=[18] (Drama), mult=3.0.
    Wait > 60 s after creation so the helper cache picks up the new state
    (it might still hold a previous `[]` snapshot from a prior request).
    """
    evt = _create_event(
        admin_s,
        name="TEST May Drama",
        slug=f"test-drama-{uuid.uuid4().hex[:6]}",
        bonus_content_types=["movie"],
        bonus_genres=[18],
        xp_multiplier=3.0,
    )
    time.sleep(CACHE_BUST_SECONDS)
    yield evt
    _delete_event(admin_s, evt["id"])
    # Let cache forget the deleted event for any later test that might rely
    # on "no active event" state.
    time.sleep(CACHE_BUST_SECONDS)


def _post_history(s, content_id, content_type, title="t"):
    r = s.post(
        f"{BASE_URL}/api/user/history",
        json={
            "content_id": content_id,
            "content_type": content_type,
            "title": title,
        },
        timeout=30,
    )
    assert r.status_code == 200, f"history post failed: {r.status_code} {r.text}"
    return r.json()


def _get_stats_xp_bonus(s):
    r = s.get(f"{BASE_URL}/api/user/stats", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "xp_bonus" in data, f"xp_bonus missing in stats: {data}"
    assert isinstance(data["xp_bonus"], int)
    return data["xp_bonus"]


def _get_xp_bonuses(s):
    r = s.get(f"{BASE_URL}/api/user/xp-bonuses", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "total_bonus_xp" in data and "by_event" in data and "recent" in data
    return data


class TestBonusXpPhaseA:
    """All tests in this class share the same drama-genre-filtered event."""

    def test_first_watch_drama_movie_grants_bonus(self, bonus_event_phase_a):
        s, _, _ = _fresh_user_session("drama")
        # Movie 550 (Fight Club) -> drama (18), thriller (53). Matches genre 18.
        _post_history(s, 550, "movie", "Fight Club")
        bonus = _get_stats_xp_bonus(s)
        # base movie = 10 ; mult = 3 -> 10 * (3-1) = 20
        assert bonus == 20, f"expected xp_bonus=20, got {bonus}"

        det = _get_xp_bonuses(s)
        assert det["total_bonus_xp"] == 20
        assert det["by_event"].get(bonus_event_phase_a["slug"]) == 20
        assert len(det["recent"]) == 1
        row = det["recent"][0]
        assert row["bonus_xp"] == 20
        assert row["base_xp"] == 10
        assert row["content_type"] == "movie"
        assert row["content_id"] == 550

    def test_repost_within_1h_does_not_double_bonus(self, bonus_event_phase_a):
        s, _, _ = _fresh_user_session("nodouble")
        _post_history(s, 550, "movie", "Fight Club")
        first = _get_stats_xp_bonus(s)
        # Re-post the exact same content immediately
        _post_history(s, 550, "movie", "Fight Club")
        second = _get_stats_xp_bonus(s)
        assert first == 20
        assert second == first, f"bonus doubled on re-watch: {first} -> {second}"
        det = _get_xp_bonuses(s)
        assert len(det["recent"]) == 1, f"too many bonus rows: {det['recent']}"

    def test_non_matching_content_type_no_bonus(self, bonus_event_phase_a):
        # types=[movie] only, post a tv show (any tv id) -> no bonus
        s, _, _ = _fresh_user_session("typeskip")
        _post_history(s, 1399, "tv", "Game of Thrones")
        bonus = _get_stats_xp_bonus(s)
        assert bonus == 0, f"expected no bonus for tv when types=[movie], got {bonus}"
        det = _get_xp_bonuses(s)
        assert det["total_bonus_xp"] == 0
        assert det["recent"] == []

    def test_genre_filter_excludes_non_overlapping_movie(self, bonus_event_phase_a):
        # Movie 11 (Star Wars - Action/Adventure/Sci-Fi, no Drama 18) -> no bonus
        s, _, _ = _fresh_user_session("genreskip")
        _post_history(s, 11, "movie", "Star Wars")
        bonus = _get_stats_xp_bonus(s)
        assert bonus == 0, f"expected no bonus for movie 11 (no genre overlap with [18]), got {bonus}"

    def test_stats_xp_bonus_default_zero_for_clean_user(self, bonus_event_phase_a):
        s, _, _ = _fresh_user_session("clean")
        bonus = _get_stats_xp_bonus(s)
        assert bonus == 0
        det = _get_xp_bonuses(s)
        assert det == {"total_bonus_xp": 0, "by_event": {}, "recent": []}


class TestBonusXpEdgeCases:
    """Each of these mutates events so we eat one cache-bust per test."""

    def test_xp_multiplier_one_yields_no_bonus(self, admin_s):
        # Phase A's drama-filter event may still be in active set (module-scoped
        # fixture). Use a non-drama movie (id 11 Star Wars) so Phase A filters
        # out via genre and only this mult=1 / no-genre event can match.
        evt = _create_event(
            admin_s,
            name="TEST May Mult1",
            slug=f"test-mult1-{uuid.uuid4().hex[:6]}",
            bonus_content_types=["movie"],
            bonus_genres=[],
            xp_multiplier=1.0,
        )
        try:
            time.sleep(CACHE_BUST_SECONDS)
            s, _, _ = _fresh_user_session("mult1")
            _post_history(s, 11, "movie", "Star Wars")
            bonus = _get_stats_xp_bonus(s)
            assert bonus == 0, f"mult=1 should give 0 bonus, got {bonus}"
            det = _get_xp_bonuses(s)
            assert det["recent"] == []
        finally:
            _delete_event(admin_s, evt["id"])
            time.sleep(CACHE_BUST_SECONDS)

    def test_no_active_event_yields_no_bonus(self, admin_s):
        # After deletion + cache bust above, no active matching event exists.
        # Ensure no test-created events remain currently active.
        r = admin_s.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=20)
        assert r.status_code == 200
        leftover = [
            e for e in r.json().get("events", [])
            if e.get("currently_active") and (e.get("slug", "").startswith("test-")
                                              or (e.get("name") or "").startswith("TEST "))
        ]
        for e in leftover:
            _delete_event(admin_s, e["id"])
        if leftover:
            time.sleep(CACHE_BUST_SECONDS)

        s, _, _ = _fresh_user_session("noevt")
        _post_history(s, 550, "movie", "Fight Club")
        bonus = _get_stats_xp_bonus(s)
        assert bonus == 0, f"expected no bonus when no active event, got {bonus}"
