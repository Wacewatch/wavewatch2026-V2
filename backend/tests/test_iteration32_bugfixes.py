"""Backend tests for WaveWatch iteration 32 bug fixes.

Coverage:
- Register rate-limit relaxed (30/24h) + activity_events log
- activate-code logs code_redeem to activity_events
- /api/user/history logs play to activity_events
- mark-all-watched writes to watch_history & is reflected in detailed-stats
- detailed-stats total_watch_time formula
- platform-reviews excludes seed_user_*
- /api/admin/activities returns enriched activities
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://smart-content-engine-4.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"


# ---------------- helpers ----------------
def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    data = r.json()
    return data["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _register_unique():
    """Register a fresh unique test user. Returns (token, email, username)."""
    suffix = uuid.uuid4().hex[:10]
    email = f"test_{suffix}@wavewatch.dev"
    username = f"test_{suffix}"
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "username": username, "password": "TestPass2026!"},
        timeout=15,
    )
    assert r.status_code == 200, f"register failed {r.status_code} {r.text}"
    data = r.json()
    return data["token"], email, username


# ---------------- fixtures ----------------
@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="module")
def fresh_user():
    return _register_unique()


# ---------------- 1) platform-reviews must exclude seed demo ----------------
class TestPlatformReviewsNoSeed:
    def test_no_seed_user_reviews(self):
        r = requests.get(f"{BASE_URL}/api/platform-reviews", timeout=15)
        assert r.status_code == 200
        data = r.json()
        reviews = data.get("reviews", [])
        assert isinstance(reviews, list)
        bad = [rv for rv in reviews if str(rv.get("user_id", "")).startswith("seed_user_")]
        assert bad == [], f"Found seed_user_ reviews: {len(bad)}"


# ---------------- 2) Register: rate limit relaxed & activity event ----------------
class TestRegisterAndActivity:
    def test_register_then_activity_logged(self, admin_token, fresh_user):
        token, email, username = fresh_user
        # token returned implies success; now check activity feed contains a register entry
        r = requests.get(f"{BASE_URL}/api/admin/activities", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        items = r.json().get("activities", [])
        assert isinstance(items, list)
        match = [
            it for it in items
            if it.get("type") == "register" and it.get("email") == email
        ]
        assert match, f"No register activity for {email} in {len(items)} items"
        evt = match[0]
        assert evt.get("username") == username
        assert evt.get("ip"), "ip field missing on register activity"
        # backward-compat alias should exist
        assert "admin_username" in evt and "action" in evt

    def test_register_rate_limit_threshold_30_not_5(self):
        """We don't want to hit 30, but verify quickly that 6 consecutive registers don't trip
        the old 5/h limit (relaxed to 30/24h)."""
        ok = 0
        for _ in range(6):
            suffix = uuid.uuid4().hex[:10]
            r = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": f"rl_{suffix}@wavewatch.dev",
                    "username": f"rl_{suffix}",
                    "password": "TestPass2026!",
                },
                timeout=15,
            )
            if r.status_code == 200:
                ok += 1
            elif r.status_code == 429:
                pytest.fail(f"Rate-limit hit at register #{ok+1} (expected >=6)")
            else:
                pytest.fail(f"Unexpected status {r.status_code}: {r.text}")
        assert ok == 6


# ---------------- 3) activate-code logs activity ----------------
class TestActivateCodeActivity:
    def test_admin_generates_code_and_user_activates(self, admin_token, fresh_user):
        user_token, _, username = fresh_user
        # Generate a VIP code via admin
        r = requests.post(
            f"{BASE_URL}/api/admin/vip-codes",
            headers=_auth(admin_token),
            json={"type": "vip", "duration_days": 7, "quantity": 1},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        code = r.json().get("code")
        assert code, "no code returned"

        # User activates it
        r = requests.post(
            f"{BASE_URL}/api/user/activate-code",
            headers=_auth(user_token),
            json={"code": code},
            timeout=15,
        )
        assert r.status_code == 200, r.text

        # Verify admin feed has a code_redeem entry
        r = requests.get(f"{BASE_URL}/api/admin/activities", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json().get("activities", [])
        match = [
            it for it in items
            if it.get("type") == "code_redeem"
            and it.get("code") == code
            and it.get("username") == username
        ]
        assert match, f"No code_redeem activity for code {code}"
        evt = match[0]
        assert evt.get("code_type") == "vip"
        assert evt.get("duration_days") == 7


# ---------------- 4) /api/user/history logs play ----------------
class TestPlayActivity:
    def test_history_post_logs_play(self, admin_token, fresh_user):
        token, _, username = fresh_user
        unique_id = 90000000 + int(time.time()) % 1000000  # avoid collision
        title = f"TEST_Movie_{uuid.uuid4().hex[:6]}"
        r = requests.post(
            f"{BASE_URL}/api/user/history",
            headers=_auth(token),
            json={
                "content_id": unique_id,
                "content_type": "movie",
                "title": title,
                "poster_path": "/x.jpg",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text

        r = requests.get(f"{BASE_URL}/api/admin/activities", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json().get("activities", [])
        match = [
            it for it in items
            if it.get("type") == "play" and it.get("title") == title
        ]
        assert match, f"No play activity for {title}"
        evt = match[0]
        assert evt.get("content_type") == "movie"
        assert evt.get("username") == username


# ---------------- 5) mark-all-watched + detailed-stats ----------------
class TestMarkAllWatchedStats:
    def test_breaking_bad_mark_all_and_stats(self):
        # Use a fresh user so stats are deterministic
        token, _, _ = _register_unique()

        # Initial stats should be zero
        r = requests.get(f"{BASE_URL}/api/user/detailed-stats", headers=_auth(token), timeout=15)
        assert r.status_code == 200
        s0 = r.json()
        assert s0.get("episodes_watched", 0) == 0
        assert s0.get("movies_watched", 0) == 0

        # Mark all of Breaking Bad (id=1396) as watched
        r = requests.post(
            f"{BASE_URL}/api/user/tv-progress/1396/mark-all-watched",
            headers=_auth(token),
            json={"show_name": "Breaking Bad", "poster_path": "/bb.jpg"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        total_eps = body.get("total_episodes")
        assert isinstance(total_eps, int) and total_eps > 0, f"no total_episodes: {body}"

        # Stats should now reflect episodes_watched == total_episodes
        r = requests.get(f"{BASE_URL}/api/user/detailed-stats", headers=_auth(token), timeout=15)
        assert r.status_code == 200
        s1 = r.json()
        assert s1["episodes_watched"] == total_eps, (
            f"episodes_watched={s1['episodes_watched']} != total_eps={total_eps}"
        )
        # shows_watched must be >=1 (the series itself written to watch_history)
        assert s1["shows_watched"] >= 1
        # total_watch_time formula: movies*110 + episodes*42 (no double when episodes>0)
        expected = s1["movies_watched"] * 110 + s1["episodes_watched"] * 42
        assert s1["total_watch_time"] == expected, (
            f"total_watch_time={s1['total_watch_time']} != expected={expected}"
        )

    def test_detailed_stats_movies_only_formula(self):
        token, _, _ = _register_unique()
        # Add 2 movies
        for i in range(2):
            cid = 80000000 + i + int(time.time()) % 100000
            r = requests.post(
                f"{BASE_URL}/api/user/history",
                headers=_auth(token),
                json={
                    "content_id": cid,
                    "content_type": "movie",
                    "title": f"TEST_M_{i}",
                    "poster_path": "/x.jpg",
                },
                timeout=15,
            )
            assert r.status_code == 200, r.text
        r = requests.get(f"{BASE_URL}/api/user/detailed-stats", headers=_auth(token), timeout=15)
        assert r.status_code == 200
        s = r.json()
        assert s["movies_watched"] == 2
        assert s["episodes_watched"] == 0
        # No episodes -> formula: movies*110 + shows*45 (shows=0 here)
        assert s["total_watch_time"] == 2 * 110


# ---------------- 6) admin/activities enriched format ----------------
class TestAdminActivitiesFormat:
    def test_admin_activities_admin_only(self):
        # Without auth -> 401/403
        r = requests.get(f"{BASE_URL}/api/admin/activities", timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_admin_activities_shape(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/activities", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "activities" in body
        items = body["activities"]
        assert isinstance(items, list) and len(items) > 0
        sample = items[0]
        # Every activity must carry these enriched/back-compat keys
        for k in ("type", "username", "details", "created_at", "admin_username", "action"):
            assert k in sample, f"missing key {k} in activity {sample}"

        # We must observe at least one register/code_redeem/play in the feed
        types = {it.get("type") for it in items}
        assert types & {"register", "code_redeem", "play", "admin_action"}, types
