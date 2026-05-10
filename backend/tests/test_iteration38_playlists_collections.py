"""
Iteration 38 backend tests.

Covers:
- /api/playlists/public/enhanced — sort_by variants & response shape (no staff pinning)
- /api/tmdb/collections/popular — popularity / name / size sorts, search, pagination
- Existing endpoints: /api/playlists/public/stats, /api/tmdb/collection/{id},
  /api/tmdb/collections/search

Notes:
- Mongo `playlists` collection may be empty in this preview env; we therefore
  only assert HTTP 200 + correct response shape for playlists endpoints.
- First call to /api/tmdb/collections/popular after server restart can take
  up to ~90s while the in-memory cache is built. We use a generous timeout.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to frontend/.env when running pytest without env propagation
    try:
        with open("/app/frontend/.env") as _f:
            for _ln in _f:
                if _ln.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = _ln.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
BASE_URL = BASE_URL.rstrip("/")

# Cache prebuilt by lifespan, but allow generous wait for the first call.
LONG_TIMEOUT = 120
SHORT_TIMEOUT = 30

SORTS = ["recent", "oldest", "likes", "dislikes", "size", "name", "random"]


# -------------------- /api/playlists/public/enhanced --------------------
class TestPublicPlaylistsEnhanced:
    @pytest.mark.parametrize("sort_by", SORTS)
    def test_sort_by_variants_return_200(self, sort_by):
        r = requests.get(
            f"{BASE_URL}/api/playlists/public/enhanced",
            params={"sort_by": sort_by, "limit": 10},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, f"sort_by={sort_by} -> {r.status_code} {r.text[:200]}"
        body = r.json()
        # response is a list OR an object with items
        items = body if isinstance(body, list) else body.get("items") or body.get("results") or []
        assert isinstance(items, list)
        if sort_by == "random":
            assert len(items) <= 10

    def test_response_shape(self):
        r = requests.get(
            f"{BASE_URL}/api/playlists/public/enhanced",
            params={"sort_by": "recent", "limit": 5},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("items") or body.get("results") or []
        # OK if empty (preview env has 0 playlists)
        for p in items:
            for key in ["_id", "name", "items", "items_count", "likes_count",
                        "dislikes_count"]:
                assert key in p, f"missing key '{key}' in playlist: {list(p.keys())}"
            # user_info OR creator (one should be present)
            assert ("user_info" in p) or ("creator" in p), \
                f"missing user_info/creator in playlist: {list(p.keys())}"

    def test_no_staff_pinning_when_data_present(self):
        """If playlists exist, verify staff are NOT unconditionally pinned at top
        when sort_by=oldest. If DB is empty, this just confirms 200."""
        r = requests.get(
            f"{BASE_URL}/api/playlists/public/enhanced",
            params={"sort_by": "oldest", "limit": 20},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("items") or body.get("results") or []
        if len(items) >= 2:
            # First-vs-last created_at should reflect oldest-first ordering
            firsts = [p.get("created_at") for p in items if p.get("created_at")]
            if len(firsts) >= 2:
                assert firsts[0] <= firsts[-1], "oldest sort not applied"


# -------------------- /api/playlists/public/stats --------------------
class TestPublicPlaylistsStats:
    def test_stats_endpoint(self):
        r = requests.get(f"{BASE_URL}/api/playlists/public/stats", timeout=SHORT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert isinstance(data, dict)


# -------------------- /api/tmdb/collections/popular --------------------
class TestPopularCollections:
    def test_popularity_default(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/popular",
            params={"page": 1, "limit": 24, "sort_by": "popularity"},
            timeout=LONG_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        for k in ["results", "page", "limit", "total", "total_pages"]:
            assert k in data
        assert data["page"] == 1
        assert data["limit"] == 24
        assert isinstance(data["results"], list)
        # Target >= 100 unique collections (per spec). Allow >24 as a softer hard floor.
        assert data["total"] > 24, f"only {data['total']} collections returned"
        # Per-item shape
        for c in data["results"][:5]:
            for k in ["id", "name", "poster_path", "popularity", "movies_count"]:
                assert k in c, f"missing {k} in collection: {list(c.keys())}"
        # popularity desc
        pops = [c.get("popularity", 0) for c in data["results"]]
        assert pops == sorted(pops, reverse=True), "popularity not sorted desc"

    def test_target_at_least_100(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/popular",
            params={"page": 1, "limit": 24, "sort_by": "popularity"},
            timeout=LONG_TIMEOUT,
        )
        assert r.status_code == 200
        data = r.json()
        # Soft assertion: spec targets >=100. Report but don't fail under <100 if >24.
        assert data["total"] >= 100, (
            f"Expected >=100 collections, got {data['total']}. Index may still be warming."
        )

    def test_pagination_and_name_sort(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/popular",
            params={"page": 2, "limit": 24, "sort_by": "name"},
            timeout=LONG_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["page"] == 2
        assert data["total_pages"] > 1
        names = [(c.get("name") or "").lower() for c in data["results"]]
        assert names == sorted(names), "names not alphabetical"

    def test_search_marvel(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/popular",
            params={"q": "marvel", "page": 1, "limit": 24},
            timeout=LONG_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert isinstance(data.get("results"), list)
        assert data["total"] >= 1, "search 'marvel' returned 0 results"

    def test_sort_by_size(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/popular",
            params={"page": 1, "limit": 24, "sort_by": "size"},
            timeout=LONG_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        counts = [c.get("movies_count", 0) for c in data["results"]]
        assert counts == sorted(counts, reverse=True), "size not sorted desc"


# -------------------- Existing endpoints -------------------- 
class TestExistingEndpoints:
    def test_tmdb_collection_by_id(self):
        # 10 = Star Wars Collection (stable TMDB id)
        r = requests.get(f"{BASE_URL}/api/tmdb/collection/10", timeout=SHORT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data.get("id") == 10
        assert "name" in data

    def test_tmdb_collections_search(self):
        r = requests.get(
            f"{BASE_URL}/api/tmdb/collections/search",
            params={"q": "marvel"},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        # Should be list-like or dict with results
        results = data if isinstance(data, list) else data.get("results") or []
        assert isinstance(results, list)
        assert len(results) >= 1
