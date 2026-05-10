"""
Iteration 34 - TV progress mark-all / unmark-all cycle + non-regression on
core user endpoints (history, favorites, recommendations).

Show used: 1399 (Game of Thrones - 8 seasons, ended) for predictable structure.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

SHOW_ID = "1399"  # Game of Thrones


# ---------------- helpers ----------------

@pytest.fixture(scope="module")
def session_user():
    """Register a fresh user (avoids login-throttle / shared state) and
    return a logged-in requests.Session with bearer token."""
    s = requests.Session()
    suffix = uuid.uuid4().hex[:10]
    email = f"test_iter34_{suffix}@gmail.com"
    password = "TestPass!2026Strong"
    username = f"iter34_{suffix}"
    r = s.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": password, "username": username},
        timeout=30,
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token
    s.headers.update({"Authorization": f"Bearer {token}"})
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- TV progress mark/unmark cycle ----------------

class TestTVProgressCycle:
    def test_1_initial_state_is_empty(self, session_user):
        r = session_user.get(f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("watched_episodes") == {}
        assert data.get("continue_watching") in (None, {})

    def test_2_mark_all_watched_creates_progress_and_history(self, session_user):
        r = session_user.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/mark-all-watched",
            json={"show_name": "Game of Thrones", "poster_path": "/test.jpg"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("total_episodes", 0) > 50, body  # GoT has >70 eps

        # tv-progress shows nested watched_episodes structure
        r2 = session_user.get(f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}", timeout=20)
        assert r2.status_code == 200
        we = r2.json()["watched_episodes"]
        assert isinstance(we, dict) and len(we) >= 1
        # season keys are strings, episodes too, all true
        any_season_key = next(iter(we.keys()))
        assert isinstance(any_season_key, str)
        any_ep_dict = we[any_season_key]
        assert isinstance(any_ep_dict, dict) and len(any_ep_dict) > 0
        first_ep_key = next(iter(any_ep_dict.keys()))
        assert isinstance(first_ep_key, str)
        assert any_ep_dict[first_ep_key] is True

        # watch_history has the show
        h = session_user.get(f"{BASE_URL}/api/user/history", timeout=20).json()["history"]
        tv_entries = [x for x in h if x.get("content_type") == "tv" and str(x.get("content_id")) == SHOW_ID]
        assert len(tv_entries) == 1, f"Expected 1 tv entry, got {len(tv_entries)}"

        # episodes are added to watch_history with content_type 'episode'
        ep_entries = [x for x in h if x.get("content_type") == "episode"
                      and str(x.get("content_id", "")).startswith(SHOW_ID)]
        assert len(ep_entries) > 50, f"Expected >50 episode entries, got {len(ep_entries)}"

    def test_3_unmark_all_watched_clears_progress_and_history(self, session_user):
        r = session_user.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/unmark-all-watched",
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "episodes_cleared" in body
        assert body["episodes_cleared"] > 0

        # tv-progress should be empty again
        r2 = session_user.get(f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}", timeout=20)
        assert r2.status_code == 200
        assert r2.json()["watched_episodes"] == {}

        # watch_history should no longer contain show or its episodes
        h = session_user.get(f"{BASE_URL}/api/user/history", timeout=20).json()["history"]
        tv_entries = [x for x in h if x.get("content_type") == "tv" and str(x.get("content_id")) == SHOW_ID]
        assert tv_entries == [], f"tv entry not removed: {tv_entries}"
        ep_entries = [x for x in h if x.get("content_type") == "episode"
                      and str(x.get("content_id", "")).startswith(SHOW_ID)]
        assert ep_entries == [], f"episode entries not removed: {len(ep_entries)} remaining"

    def test_4_single_episode_mark_creates_progress(self, session_user):
        # After unmark in test_3, posting a single episode should re-create progress
        r = session_user.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/episode",
            json={"season": 1, "episode": 1, "watched": True},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("watched") is True

        r2 = session_user.get(f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}", timeout=20)
        assert r2.status_code == 200
        we = r2.json()["watched_episodes"]
        # Nested format expected by frontend SeasonDetailPage
        assert "1" in we, f"season '1' missing: {we}"
        assert we["1"].get("1") is True, f"episode '1' missing/false: {we}"
        # last_watched should advance to next episode
        cw = r2.json().get("continue_watching")
        assert cw is not None
        assert cw.get("season") == 1 and cw.get("episode") == 2

    def test_5_unmark_episode_sets_false(self, session_user):
        r = session_user.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/episode",
            json={"season": 1, "episode": 1, "watched": False},
            timeout=20,
        )
        assert r.status_code == 200
        r2 = session_user.get(f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}", timeout=20).json()
        assert r2["watched_episodes"]["1"]["1"] is False

    def test_6_unmark_all_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/unmark-all-watched", timeout=20
        )
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_7_cleanup(self, session_user):
        # final cleanup
        session_user.post(
            f"{BASE_URL}/api/user/tv-progress/{SHOW_ID}/unmark-all-watched", timeout=20
        )


# ---------------- non-regression on core endpoints ----------------

class TestNonRegression:
    def test_history_endpoint_ok(self, session_user):
        r = session_user.get(f"{BASE_URL}/api/user/history", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json().get("history"), list)

    def test_favorites_endpoint_ok(self, session_user):
        r = session_user.get(f"{BASE_URL}/api/user/favorites", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json().get("favorites"), list)

    def test_recommendations_endpoint_ok(self, session_user):
        r = session_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60)
        # Must not be 5xx; 200 expected. Some recos endpoints accept query params.
        assert r.status_code == 200, f"recos broken: {r.status_code} {r.text[:200]}"

    def test_favorite_toggle_round_trip(self, session_user):
        payload = {
            "content_id": "1399",
            "content_type": "tv",
            "title": "TEST_GoT",
            "poster_path": "/x.jpg",
        }
        # Add
        r1 = session_user.post(f"{BASE_URL}/api/user/favorites", json=payload, timeout=20)
        assert r1.status_code == 200
        assert r1.json().get("is_favorite") is True
        # Remove (toggle)
        r2 = session_user.post(f"{BASE_URL}/api/user/favorites", json=payload, timeout=20)
        assert r2.status_code == 200
        assert r2.json().get("is_favorite") is False
