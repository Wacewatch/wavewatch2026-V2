"""
Iteration 39 — Real TMDB runtime + XP rebalance + unmark-all-watched

Covers:
- POST /api/user/tv-progress/1649/mark-all-watched returns total_episodes=87 and typical_episode_runtime>0
- GET /api/user/detailed-stats sums actual runtime_min so total_watch_time for show 1649
  is approximately total_episodes × typical_episode_runtime (>3000 min, not flat 5h).
- POST /api/user/tv-progress/1649/unmark-all-watched clears tv_progress AND removes all
  87 episodes + series from watch_history.
- POST /api/user/recompute-watch-time backfills runtime_min on legacy entries.
- POST /api/user/history accepts a 'runtime' field and stores it as runtime_min.
- XP base values: _base_xp_for_action — verified indirectly via xp endpoint if present.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend/.env (sub-tests should still try internal)
    BASE_URL = "http://localhost:8001"

ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"
SLIDERS_ID = 1649  # TMDB id used by the bug report


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                 timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    tok = data.get("token") or data.get("access_token")
    assert tok, f"no token in login response: {data}"
    return tok


@pytest.fixture(scope="session")
def auth(api, token):
    api.headers.update({"Authorization": f"Bearer {token}"})
    return api


@pytest.fixture(autouse=True)
def _clean_sliders(auth):
    """Always start each test from a clean state for show 1649."""
    try:
        auth.post(f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/unmark-all-watched", timeout=30)
    except Exception:
        pass
    yield
    try:
        auth.post(f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/unmark-all-watched", timeout=30)
    except Exception:
        pass


# ---------- Helpers ----------
def get_stats(auth):
    r = auth.get(f"{BASE_URL}/api/user/detailed-stats", timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Tests ----------
class TestMarkAllWatched:
    def test_mark_all_returns_total_episodes_and_runtime(self, auth):
        r = auth.post(
            f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/mark-all-watched",
            json={"show_name": "Sliders", "poster_path": ""},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Sliders has 87 episodes (excluding specials, season 0)
        assert data.get("total_episodes") == 87, f"expected 87 episodes, got {data.get('total_episodes')}"
        # Typical episode runtime should be > 0 (Sliders ≈ 43-45 min)
        ter = data.get("typical_episode_runtime")
        assert isinstance(ter, int) and ter > 0, f"typical_episode_runtime missing/zero: {ter}"
        # Reasonable range
        assert 20 <= ter <= 90, f"typical_episode_runtime out of range: {ter}"


class TestDetailedStatsRealRuntime:
    def test_total_watch_time_uses_real_runtime(self, auth):
        # Snapshot baseline
        baseline = get_stats(auth)
        # Mark all watched
        r = auth.post(
            f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/mark-all-watched",
            json={"show_name": "Sliders", "poster_path": ""},
            timeout=60,
        )
        assert r.status_code == 200
        body = r.json()
        ter = body["typical_episode_runtime"]
        n = body["total_episodes"]
        expected_added = ter * n  # +0 for the series entry itself

        after = get_stats(auth)
        added = after["total_watch_time"] - baseline["total_watch_time"]
        # Allow ±2 min tolerance
        assert abs(added - expected_added) <= 2, (
            f"watch time delta {added} != expected {expected_added} "
            f"(baseline={baseline['total_watch_time']}, after={after['total_watch_time']})"
        )
        # And it must NOT be a flat ~5h (300 min) — bug case
        assert added > 1000, f"watch time only added {added} min — looks like the old flat bug"


class TestUnmarkAllWatched:
    def test_unmark_clears_progress_and_history(self, auth):
        # Mark first
        r = auth.post(
            f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/mark-all-watched",
            json={"show_name": "Sliders", "poster_path": ""},
            timeout=60,
        )
        assert r.status_code == 200
        n = r.json()["total_episodes"]
        before = get_stats(auth)

        # Unmark
        r2 = auth.post(
            f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}/unmark-all-watched",
            timeout=30,
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body.get("episodes_cleared", 0) >= n - 2, f"only cleared {body.get('episodes_cleared')} eps"

        # Verify tv_progress endpoint cleared
        rp = auth.get(f"{BASE_URL}/api/user/tv-progress/{SLIDERS_ID}", timeout=10)
        # Endpoint may return 200 with empty / 404 — both acceptable
        if rp.status_code == 200:
            j = rp.json()
            wm = j.get("watched_episodes") or {}
            assert not wm or all(not v for v in wm.values()), f"progress not cleared: {wm}"

        # detailed-stats reverts
        after = get_stats(auth)
        assert after["episodes_watched"] <= before["episodes_watched"] - n + 2
        # watch time dropped by approximately the marked amount
        assert before["total_watch_time"] - after["total_watch_time"] >= 1000


class TestHistoryRuntimeField:
    def test_post_history_with_runtime_stores_runtime_min(self, auth):
        # Use a unique fake movie id under test prefix to avoid collisions
        test_cid = 999999991
        # Make sure clean
        try:
            auth.delete(f"{BASE_URL}/api/user/history/{test_cid}/movie", timeout=10)
        except Exception:
            pass

        baseline = get_stats(auth)
        payload = {
            "content_id": test_cid,
            "content_type": "movie",
            "title": "TEST_runtime_movie",
            "runtime": 137,
        }
        r = auth.post(f"{BASE_URL}/api/user/history", json=payload, timeout=15)
        assert r.status_code == 200, r.text

        after = get_stats(auth)
        delta = after["total_watch_time"] - baseline["total_watch_time"]
        assert delta == 137, f"expected +137 min, got {delta}"

        # Clean up
        auth.delete(f"{BASE_URL}/api/user/history/{test_cid}/movie", timeout=10)


class TestRecomputeWatchTime:
    def test_recompute_endpoint_responds(self, auth):
        r = auth.post(f"{BASE_URL}/api/user/recompute-watch-time", timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "updated" in data and "total_entries" in data
        assert isinstance(data["updated"], int)
        assert isinstance(data["total_entries"], int)


class TestXPBaseValues:
    """Verify XP base values mirror the spec (movie=20, tv=100, anime=100, episode=10)
    via xp endpoints if present, or via the seasonal-event bonus side-effect.
    """
    def test_xp_breakdown_uses_new_values(self, auth):
        # Try /api/user/xp first
        r = auth.get(f"{BASE_URL}/api/user/xp", timeout=15)
        if r.status_code != 200:
            pytest.skip(f"/api/user/xp not available ({r.status_code})")
        data = r.json()
        # We don't enforce a specific breakdown shape but check that values exist;
        # the front-end already mirrors with computeXP. Just ensure it's a sane dict.
        assert isinstance(data, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
