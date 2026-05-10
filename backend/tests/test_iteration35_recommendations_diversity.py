"""
Iteration 35 - GET /api/user/recommendations diversity test.

Verifies:
  1. 3 consecutive calls return enough variation (overlap < 50% on at least
     one pair) for both:
       (a) personalised user (with likes/favorites/history seeds)
       (b) brand-new user (trending source)
  2. source field == 'personalised' if seeds exist, else 'trending'
  3. Quality: each item has poster_path; for personalised, vote_count >= 20
  4. Exclusions: no item already in user's favorites/dislikes/watch-history
  5. Non-regression: /api/user/history, /api/user/favorites,
     /api/user/tv-progress/{id}/unmark-all-watched still work.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"


def _register():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:10]
    email = f"test_iter35_{suffix}@gmail.com"
    r = s.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "TestPass!2026Strong",
              "username": f"iter35_{suffix}"},
        timeout=30,
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    s.headers.update({"Authorization": f"Bearer {r.json()['token']}"})
    return s, email


@pytest.fixture(scope="module")
def new_user():
    """Brand new user => no seeds => trending source."""
    s, _ = _register()
    return s


@pytest.fixture(scope="module")
def seeded_user():
    """User with likes/favorites/history => personalised source."""
    s, _ = _register()
    # add a few likes (popular movies & tv from TMDB)
    seeds = [
        {"content_id": "550",   "content_type": "movie"},   # Fight Club
        {"content_id": "13",    "content_type": "movie"},   # Forrest Gump
        {"content_id": "1399",  "content_type": "tv"},      # Game of Thrones
        {"content_id": "1396",  "content_type": "tv"},      # Breaking Bad
    ]
    for sd in seeds:
        r = s.post(f"{BASE_URL}/api/user/ratings",
                   json={**sd, "rating": "like"}, timeout=15)
        assert r.status_code == 200, r.text
    # add a favorite (will be excluded from recos)
    r = s.post(
        f"{BASE_URL}/api/user/favorites",
        json={"content_id": "157336", "content_type": "movie",
              "title": "Interstellar", "poster_path": "/x.jpg"},
        timeout=15,
    )
    assert r.status_code == 200
    return s


def _ids(payload):
    """Return list of (media_type, id) tuples from a recommendations payload."""
    return [
        (it.get("media_type"), it.get("id"))
        for it in payload.get("recommendations", [])
        if it.get("id")
    ]


def _overlap_ratio(a, b):
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    inter = sa & sb
    # ratio relative to the smaller list to be strict
    return len(inter) / float(min(len(sa), len(sb)))


# ---------------- Personalised user diversity ----------------

class TestPersonalisedRecommendations:
    def test_source_is_personalised_and_quality(self, seeded_user):
        r = seeded_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "personalised", data.get("source")
        recos = data.get("recommendations", [])
        assert len(recos) > 0, "no recos returned for seeded user"
        # quality checks
        for it in recos:
            assert it.get("poster_path"), f"missing poster_path: {it.get('id')}"
        # vote_count >= 20 should hold for the seeds-derived items (most of them).
        # We tolerate a small minority coming from genre-discover top-up which
        # the implementation also gates on vote_count >= 300, so the rule must hold.
        low_vote = [it for it in recos if (it.get("vote_count") or 0) < 20]
        assert len(low_vote) == 0, (
            f"{len(low_vote)} items have vote_count < 20: "
            f"{[(i.get('id'), i.get('vote_count')) for i in low_vote][:5]}"
        )

    def test_excludes_favorites_and_likes(self, seeded_user):
        # Items the user explicitly likes/favorites must not reappear in recos.
        r = seeded_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60)
        recos = r.json().get("recommendations", [])
        ids = {(it.get("media_type"), int(it.get("id"))) for it in recos}
        # excluded: favorites Interstellar(movie 157336) + likes
        excluded = {
            ("movie", 550), ("movie", 13), ("tv", 1399), ("tv", 1396),
            ("movie", 157336),
        }
        assert ids.isdisjoint(excluded), (
            f"excluded items leaked into recos: {ids & excluded}"
        )

    def test_three_calls_have_variation(self, seeded_user):
        r1 = seeded_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        r2 = seeded_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        r3 = seeded_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        ids1, ids2, ids3 = _ids(r1), _ids(r2), _ids(r3)
        assert len(ids1) > 0 and len(ids2) > 0 and len(ids3) > 0
        ov12 = _overlap_ratio(ids1, ids2)
        ov13 = _overlap_ratio(ids1, ids3)
        ov23 = _overlap_ratio(ids2, ids3)
        # At least one pair must overlap < 50%.
        min_overlap = min(ov12, ov13, ov23)
        assert min_overlap < 0.5, (
            f"Insufficient variation across 3 calls: "
            f"overlaps 1-2={ov12:.2f} 1-3={ov13:.2f} 2-3={ov23:.2f}"
        )
        # Also make sure responses are not strictly identical
        assert not (ids1 == ids2 == ids3), "All 3 calls returned identical lists"


# ---------------- New user (trending) diversity ----------------

class TestTrendingRecommendations:
    def test_source_is_trending_for_new_user(self, new_user):
        r = new_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "trending", data.get("source")
        recos = data.get("recommendations", [])
        assert len(recos) > 0
        # media_type must be normalised to movie or tv
        for it in recos:
            assert it.get("media_type") in ("movie", "tv"), it

    def test_three_calls_have_variation_trending(self, new_user):
        r1 = new_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        r2 = new_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        r3 = new_user.get(f"{BASE_URL}/api/user/recommendations", timeout=60).json()
        ids1, ids2, ids3 = _ids(r1), _ids(r2), _ids(r3)
        assert len(ids1) > 0 and len(ids2) > 0 and len(ids3) > 0
        min_ov = min(
            _overlap_ratio(ids1, ids2),
            _overlap_ratio(ids1, ids3),
            _overlap_ratio(ids2, ids3),
        )
        assert min_ov < 0.5, (
            f"Trending recos not varying enough: min overlap={min_ov:.2f}"
        )


# ---------------- Non-regression on user endpoints ----------------

class TestNonRegression:
    def test_history_ok(self, seeded_user):
        r = seeded_user.get(f"{BASE_URL}/api/user/history", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json().get("history"), list)

    def test_favorites_ok(self, seeded_user):
        r = seeded_user.get(f"{BASE_URL}/api/user/favorites", timeout=20)
        assert r.status_code == 200
        favs = r.json().get("favorites")
        assert isinstance(favs, list)
        # Interstellar added in fixture should be there
        ids = [str(f.get("content_id")) for f in favs]
        assert "157336" in ids

    def test_tv_progress_unmark_all_endpoint_exists(self, seeded_user):
        # Endpoint should respond 200 even if there's nothing to clear
        r = seeded_user.post(
            f"{BASE_URL}/api/user/tv-progress/9999999/unmark-all-watched",
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "episodes_cleared" in body
