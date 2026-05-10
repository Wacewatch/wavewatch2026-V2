"""
Iteration 38 — Fast variant (no TMDB / no bonus_genres dependency).

Per main agent's note: ignore bonus_genres filter testing (slow TMDB call).
We only exercise the bonus_content_types matching path so the cache lookup
and bonus award don't need an outbound network call.

Covers:
  1) POST /api/admin/seasonal-events/{event_id}/notify
       - admin success → 200, returns {sent, event}; users receive notif
       - non-admin → 403
       - unauthenticated → 401
       - missing event_id → 404

  2) Bonus XP via POST /api/user/history
       - first watch (movie 550, mult=3) → +20 bonus
       - re-post within 1h → no double bonus
       - content_type not in bonus_content_types → no bonus
       - xp_multiplier=1 → no bonus
       - no active event → no bonus

  3) GET /api/user/stats → contains xp_bonus
  4) GET /api/user/xp-bonuses → {total_bonus_xp, by_event, recent}

Today is May 10, 2026 → events with month_start/end=5 are active.
The matcher caches active events for 60s; we wait > 60s after each create/
delete so the cache rolls over.
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

CACHE_BUST = 65  # _get_matching_active_event caches 60s


# ---------- session-scoped: clear rate limits ----------

@pytest.fixture(scope="session", autouse=True)
def _reset_rate_limits():
    try:
        from pymongo import MongoClient
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
            c = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
            c[db_name].register_attempts.delete_many({})
            c[db_name].login_attempts.delete_many({})
            c.close()
    except Exception as e:
        print(f"[fixture] rate-limit reset failed: {e}")
    yield


# ---------- helpers ----------

def _login(s, email, password):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token: {body}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return body


def _register(s, email, username, password):
    r = s.post(f"{BASE_URL}/api/auth/register",
               json={"email": email, "username": username, "password": password},
               timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token: {body}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return body["user"]


def _fresh_user(tag):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suf = uuid.uuid4().hex[:8]
    u = _register(s, f"test_{tag}_{suf}@gmail.com", f"t_{tag}_{suf}", "TestPass2026!")
    return s, u


def _admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    return s


def _delete_evt(admin_s, eid):
    try:
        admin_s.delete(f"{BASE_URL}/api/admin/seasonal-events/{eid}", timeout=15)
    except Exception:
        pass


def _create_evt(admin_s, **overrides):
    payload = {
        "name": "TEST May Event",
        "slug": f"test-{uuid.uuid4().hex[:6]}",
        "description": "auto-test",
        "icon": "Sparkles",
        "color": "#a855f7",
        "auto_theme": None,
        "month_start": 5, "day_start": 1,
        "month_end": 5, "day_end": 31,
        "xp_multiplier": 3.0,
        "bonus_genres": [],          # NO genres → no TMDB call
        "bonus_content_types": ["movie"],
        "active": True,
    }
    payload.update(overrides)
    r = admin_s.post(f"{BASE_URL}/api/admin/seasonal-events",
                     json=payload, timeout=20)
    assert r.status_code == 200, f"create event: {r.status_code} {r.text}"
    return r.json()["event"]


def _purge_test_events(admin_s):
    r = admin_s.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=20)
    if r.status_code != 200:
        return 0
    evts = r.json().get("events", [])
    n = 0
    for e in evts:
        slug = e.get("slug", "") or ""
        name = e.get("name", "") or ""
        if slug.startswith("test-") or name.startswith("TEST "):
            _delete_evt(admin_s, e.get("id"))
            n += 1
    return n


def _post_history(s, content_id, content_type, title="t"):
    r = s.post(f"{BASE_URL}/api/user/history",
               json={"content_id": content_id,
                     "content_type": content_type,
                     "title": title}, timeout=30)
    assert r.status_code == 200, f"history post: {r.status_code} {r.text}"
    return r.json()


def _stats_xp_bonus(s):
    r = s.get(f"{BASE_URL}/api/user/stats", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "xp_bonus" in data, f"xp_bonus missing in stats: {data}"
    assert isinstance(data["xp_bonus"], int)
    return data["xp_bonus"]


def _xp_bonuses(s):
    r = s.get(f"{BASE_URL}/api/user/xp-bonuses", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) >= {"total_bonus_xp", "by_event", "recent"}, data
    return data


# ---------- module-level admin session ----------

@pytest.fixture(scope="module")
def admin_s():
    s = _admin()
    # Make sure no leftover TEST_ events from previous runs
    if _purge_test_events(s):
        time.sleep(CACHE_BUST)
    return s


# =============================================================================
# 1. NOTIFY endpoint
# =============================================================================

class TestNotify:
    def test_unauth_returns_401(self, admin_s):
        evt = _create_evt(admin_s)
        try:
            r = requests.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=20)
            assert r.status_code == 401, f"got {r.status_code}: {r.text}"
        finally:
            _delete_evt(admin_s, evt["id"])

    def test_non_admin_returns_403(self, admin_s):
        evt = _create_evt(admin_s)
        try:
            us, _ = _fresh_user("nonadmin")
            r = us.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=20)
            assert r.status_code == 403, f"got {r.status_code}: {r.text}"
        finally:
            _delete_evt(admin_s, evt["id"])

    def test_missing_event_returns_404(self, admin_s):
        r = admin_s.post(
            f"{BASE_URL}/api/admin/seasonal-events/evt_doesnotexist/notify",
            timeout=20)
        assert r.status_code == 404, f"got {r.status_code}: {r.text}"

    def test_admin_broadcast_success(self, admin_s):
        # at least one fresh user so sent >= 2
        us, _ = _fresh_user("notif")
        evt = _create_evt(admin_s)
        try:
            r = admin_s.post(
                f"{BASE_URL}/api/admin/seasonal-events/{evt['id']}/notify",
                timeout=30)
            assert r.status_code == 200, f"notify: {r.status_code} {r.text}"
            data = r.json()
            assert isinstance(data.get("sent"), int) and data["sent"] >= 2, data
            assert data.get("event") == evt["slug"], data

            # fresh user sees the event notification
            r2 = us.get(f"{BASE_URL}/api/notifications", timeout=20)
            assert r2.status_code == 200
            notifs = r2.json().get("notifications", [])
            ev_notifs = [
                n for n in notifs
                if n.get("type") == "event"
                and evt["name"] in (n.get("title") or "")
            ]
            assert ev_notifs, f"event notif not found for fresh user: {notifs[:3]}"
        finally:
            _delete_evt(admin_s, evt["id"])


# =============================================================================
# 2. Bonus XP — fast path (no genres, content_type only)
# =============================================================================

@pytest.fixture(scope="module")
def bonus_event(admin_s):
    """A single May event, content_type=movie, mult=3, no genres."""
    evt = _create_evt(
        admin_s,
        name="TEST May Movie x3",
        slug=f"test-mx3-{uuid.uuid4().hex[:6]}",
        bonus_content_types=["movie"],
        bonus_genres=[],
        xp_multiplier=3.0,
    )
    time.sleep(CACHE_BUST)
    yield evt
    _delete_evt(admin_s, evt["id"])
    time.sleep(CACHE_BUST)


class TestBonusXp:
    def test_first_movie_grants_20_bonus(self, bonus_event):
        s, _ = _fresh_user("first")
        _post_history(s, 550, "movie", "Fight Club")
        # base movie = 10, mult = 3 → bonus = 10 * (3-1) = 20
        assert _stats_xp_bonus(s) == 20

        det = _xp_bonuses(s)
        assert det["total_bonus_xp"] == 20
        assert det["by_event"].get(bonus_event["slug"]) == 20
        assert len(det["recent"]) == 1
        row = det["recent"][0]
        assert row["bonus_xp"] == 20
        assert row["base_xp"] == 10
        assert row["content_type"] == "movie"
        assert row["content_id"] == 550

    def test_repost_within_1h_no_double(self, bonus_event):
        s, _ = _fresh_user("nodouble")
        _post_history(s, 550, "movie", "Fight Club")
        first = _stats_xp_bonus(s)
        _post_history(s, 550, "movie", "Fight Club")
        second = _stats_xp_bonus(s)
        assert first == 20
        assert second == first, f"bonus doubled: {first} -> {second}"
        det = _xp_bonuses(s)
        assert len(det["recent"]) == 1, f"too many rows: {det['recent']}"

    def test_tv_content_type_skipped(self, bonus_event):
        # event types=[movie] only → tv not eligible
        s, _ = _fresh_user("tvskip")
        _post_history(s, 1399, "tv", "Game of Thrones")
        assert _stats_xp_bonus(s) == 0
        det = _xp_bonuses(s)
        assert det["total_bonus_xp"] == 0
        assert det["recent"] == []

    def test_clean_user_defaults(self, bonus_event):
        s, _ = _fresh_user("clean")
        assert _stats_xp_bonus(s) == 0
        det = _xp_bonuses(s)
        assert det == {"total_bonus_xp": 0, "by_event": {}, "recent": []}


# =============================================================================
# 3. Edge cases that mutate events (each pays one cache-bust)
# =============================================================================

class TestBonusEdgeCases:
    def test_xp_multiplier_one_no_bonus(self, admin_s):
        # Need to ensure no other matching active event is around.
        # We rely on bonus_event teardown having waited CACHE_BUST already
        # only if it ran; but since this is class-scoped we must purge.
        purged = _purge_test_events(admin_s)
        evt = _create_evt(
            admin_s,
            name="TEST May Mult1",
            slug=f"test-m1-{uuid.uuid4().hex[:6]}",
            bonus_content_types=["movie"],
            bonus_genres=[],
            xp_multiplier=1.0,
        )
        try:
            time.sleep(CACHE_BUST)
            s, _ = _fresh_user("mult1")
            _post_history(s, 550, "movie", "Fight Club")
            assert _stats_xp_bonus(s) == 0
            det = _xp_bonuses(s)
            assert det["recent"] == []
        finally:
            _delete_evt(admin_s, evt["id"])
            time.sleep(CACHE_BUST)
        _ = purged  # silence unused

    def test_no_active_event_no_bonus(self, admin_s):
        # Make sure no test events remain active.
        if _purge_test_events(admin_s):
            time.sleep(CACHE_BUST)
        s, _ = _fresh_user("noevt")
        _post_history(s, 550, "movie", "Fight Club")
        assert _stats_xp_bonus(s) == 0
