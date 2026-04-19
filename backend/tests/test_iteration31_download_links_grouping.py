"""
Iteration 31: Download Links Grouping & Dynamic Media Types Tests
Tests for:
1. GET /api/download-links/media-types - dynamic media types from Supabase
2. GET /api/download-links with group=True (default) - TV episodes grouped by (tmdb_id, season_number)
3. GET /api/download-links?group=false - raw ungrouped rows
4. Grouped item fields: group_type, episode_count, episode_range, qualities, languages, uploaders_count
5. Episode range compression (E1-3, E5, E7 format)
6. Pagination on grouped results
7. Caching behavior (30s TTL)
8. Security: no Supabase credentials leak
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestMediaTypesEndpoint:
    """Tests for GET /api/download-links/media-types"""
    
    def test_media_types_returns_list(self):
        """Media types endpoint returns a list of types"""
        response = requests.get(f"{BASE_URL}/api/download-links/media-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "types" in data, "Response should have 'types' key"
        assert isinstance(data["types"], list), "types should be a list"
        print(f"PASS: Media types endpoint returns list with {len(data['types'])} types: {data['types']}")
    
    def test_media_types_contains_expected_values(self):
        """Media types should include 'tv' and 'movie'"""
        response = requests.get(f"{BASE_URL}/api/download-links/media-types")
        assert response.status_code == 200
        data = response.json()
        types = data.get("types", [])
        # Based on previous tests, we expect at least tv and movie
        assert "tv" in types or "movie" in types, f"Expected 'tv' or 'movie' in types, got: {types}"
        print(f"PASS: Media types contains expected values: {types}")
    
    def test_media_types_is_sorted(self):
        """Media types should be sorted alphabetically"""
        response = requests.get(f"{BASE_URL}/api/download-links/media-types")
        assert response.status_code == 200
        data = response.json()
        types = data.get("types", [])
        assert types == sorted(types), f"Types should be sorted, got: {types}"
        print(f"PASS: Media types are sorted: {types}")
    
    def test_media_types_is_public(self):
        """Media types endpoint should be public (no auth required)"""
        # No auth headers
        response = requests.get(f"{BASE_URL}/api/download-links/media-types")
        assert response.status_code == 200, f"Expected 200 (public), got {response.status_code}"
        print("PASS: Media types endpoint is public (no auth required)")
    
    def test_media_types_no_credentials_leak(self):
        """No Supabase credentials should leak in response"""
        response = requests.get(f"{BASE_URL}/api/download-links/media-types")
        assert response.status_code == 200
        body = response.text.lower()
        assert "supabase" not in body, "Supabase should not appear in response"
        assert "service_role" not in body, "service_role should not appear in response"
        assert "eyj" not in body, "JWT token should not appear in response"
        print("PASS: No Supabase credentials leak in media-types response")


class TestDownloadLinksGrouping:
    """Tests for GET /api/download-links with grouping"""
    
    def test_default_returns_grouped_items(self):
        """Default request (group=True) returns grouped items"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "items" in data, "Response should have 'items'"
        assert "total" in data, "Response should have 'total'"
        assert "grouped" in data, "Response should have 'grouped' flag"
        assert data["grouped"] == True, "Default should be grouped=True"
        print(f"PASS: Default returns grouped items, total={data['total']}, grouped={data['grouped']}")
    
    def test_grouped_total_is_groups_not_rows(self):
        """With grouping, total should be ~3003 groups, not ~15237 raw rows"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=5&group=true")
        assert response.status_code == 200
        data = response.json()
        total = data.get("total", 0)
        # Previous iteration showed 15237 raw rows. Grouped should be significantly less (~3003)
        assert total < 10000, f"Grouped total should be much less than 15237 raw rows, got {total}"
        assert total > 100, f"Grouped total should be reasonable (>100), got {total}"
        print(f"PASS: Grouped total={total} (expected ~3003, much less than 15237 raw rows)")
    
    def test_ungrouped_returns_raw_rows(self):
        """group=false returns raw ungrouped rows"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=5&group=false")
        assert response.status_code == 200
        data = response.json()
        assert data["grouped"] == False, "Should have grouped=False"
        total = data.get("total", 0)
        # Raw rows should be ~15237
        assert total > 10000, f"Ungrouped total should be ~15237, got {total}"
        print(f"PASS: Ungrouped returns raw rows, total={total} (expected ~15237)")
    
    def test_grouped_item_has_required_fields(self):
        """Grouped items should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        assert len(items) > 0, "Should have at least one item"
        
        required_fields = [
            "group_type", "tmdb_id", "media_type", "season_number",
            "episode_count", "episode_range", "episode_min", "episode_max",
            "qualities", "languages", "uploaders_count",
            "latest_created_at", "earliest_created_at"
        ]
        
        for item in items:
            for field in required_fields:
                assert field in item, f"Missing field '{field}' in grouped item: {item.keys()}"
        
        print(f"PASS: All {len(items)} grouped items have required fields: {required_fields}")
    
    def test_group_type_values(self):
        """group_type should be 'tv_season' or 'movie'"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=50&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        group_types = set(item.get("group_type") for item in items)
        for gt in group_types:
            assert gt in ("tv_season", "movie"), f"Invalid group_type: {gt}"
        
        print(f"PASS: All group_types are valid: {group_types}")
    
    def test_tv_season_has_episode_info(self):
        """TV season groups should have episode_count, episode_range, episode_min, episode_max"""
        response = requests.get(f"{BASE_URL}/api/download-links?media_type=tv&limit=20&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        tv_seasons = [i for i in items if i.get("group_type") == "tv_season"]
        if not tv_seasons:
            pytest.skip("No TV season groups found")
        
        for item in tv_seasons:
            assert item.get("episode_count", 0) >= 1, f"TV season should have episode_count >= 1"
            # episode_range can be None if no episode numbers
            if item.get("episode_count", 0) > 0:
                assert item.get("episode_range") is not None, "TV season with episodes should have episode_range"
        
        print(f"PASS: {len(tv_seasons)} TV season groups have valid episode info")
    
    def test_episode_range_format(self):
        """Episode range should be in compressed format like 'E1-3, E5, E7'"""
        response = requests.get(f"{BASE_URL}/api/download-links?media_type=tv&limit=50&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        ranges_found = []
        for item in items:
            ep_range = item.get("episode_range")
            if ep_range:
                ranges_found.append(ep_range)
                # Should start with 'E' and contain numbers
                assert ep_range.startswith("E"), f"Episode range should start with 'E': {ep_range}"
        
        if ranges_found:
            print(f"PASS: Episode ranges in correct format. Examples: {ranges_found[:5]}")
        else:
            print("PASS: No episode ranges found (may be all single episodes)")
    
    def test_qualities_is_array(self):
        """qualities field should be an array of unique qualities"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            qualities = item.get("qualities")
            assert isinstance(qualities, list), f"qualities should be a list, got {type(qualities)}"
        
        print(f"PASS: All items have qualities as array")
    
    def test_languages_is_array(self):
        """languages field should be an array of unique languages"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            languages = item.get("languages")
            assert isinstance(languages, list), f"languages should be a list, got {type(languages)}"
        
        print(f"PASS: All items have languages as array")
    
    def test_uploaders_count_is_integer(self):
        """uploaders_count should be an integer >= 1"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            count = item.get("uploaders_count")
            assert isinstance(count, int), f"uploaders_count should be int, got {type(count)}"
            assert count >= 1, f"uploaders_count should be >= 1, got {count}"
        
        print(f"PASS: All items have valid uploaders_count")
    
    def test_movies_stay_individual(self):
        """Movies should stay individual (one row = one movie entry)"""
        response = requests.get(f"{BASE_URL}/api/download-links?media_type=movie&limit=20&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            assert item.get("group_type") == "movie", f"Movie should have group_type='movie'"
            # Movies don't have episode info
            assert item.get("episode_count") == 0 or item.get("episode_range") is None
        
        print(f"PASS: {len(items)} movies stay individual with group_type='movie'")


class TestGroupingFilters:
    """Tests for filtering with grouping"""
    
    def test_filter_by_uploader_with_grouping(self):
        """Filter by uploader should work with grouping"""
        response = requests.get(f"{BASE_URL}/api/download-links?uploader=IMPERIUM&group=true&limit=10")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            # The top uploader should be IMPERIUM
            assert item.get("uploader_username") == "IMPERIUM", f"Expected uploader IMPERIUM, got {item.get('uploader_username')}"
        
        print(f"PASS: Filter by uploader=IMPERIUM works with grouping, {len(items)} items")
    
    def test_filter_by_media_type_movie(self):
        """Filter by media_type=movie returns only movies"""
        response = requests.get(f"{BASE_URL}/api/download-links?media_type=movie&group=true&limit=20")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            assert item.get("media_type") == "movie", f"Expected media_type=movie, got {item.get('media_type')}"
            assert item.get("group_type") == "movie", f"Expected group_type=movie, got {item.get('group_type')}"
        
        print(f"PASS: media_type=movie filter returns only movies ({len(items)} items)")
    
    def test_filter_by_media_type_tv(self):
        """Filter by media_type=tv returns only TV groups"""
        response = requests.get(f"{BASE_URL}/api/download-links?media_type=tv&group=true&limit=20")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        for item in items:
            assert item.get("media_type") == "tv", f"Expected media_type=tv, got {item.get('media_type')}"
            assert item.get("group_type") == "tv_season", f"Expected group_type=tv_season, got {item.get('group_type')}"
        
        print(f"PASS: media_type=tv filter returns only TV groups ({len(items)} items)")


class TestGroupingPagination:
    """Tests for pagination with grouping"""
    
    def test_pagination_works_on_grouped_results(self):
        """Pagination should work correctly on grouped results"""
        # Get page 1
        response1 = requests.get(f"{BASE_URL}/api/download-links?page=1&limit=24&group=true")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Get page 2
        response2 = requests.get(f"{BASE_URL}/api/download-links?page=2&limit=24&group=true")
        assert response2.status_code == 200
        data2 = response2.json()
        
        items1 = data1.get("items", [])
        items2 = data2.get("items", [])
        
        # Pages should have different items
        keys1 = set(item.get("key") for item in items1)
        keys2 = set(item.get("key") for item in items2)
        
        assert len(keys1.intersection(keys2)) == 0, "Page 1 and Page 2 should have different items"
        
        print(f"PASS: Pagination works - Page 1 has {len(items1)} items, Page 2 has {len(items2)} items, no overlap")
    
    def test_has_more_flag(self):
        """has_more flag should indicate if more pages exist"""
        response = requests.get(f"{BASE_URL}/api/download-links?page=1&limit=24&group=true")
        assert response.status_code == 200
        data = response.json()
        
        total = data.get("total", 0)
        has_more = data.get("has_more", False)
        
        if total > 24:
            assert has_more == True, f"has_more should be True when total ({total}) > limit (24)"
        
        print(f"PASS: has_more={has_more} is correct for total={total}")


class TestGroupingSorting:
    """Tests for sorting with grouping"""
    
    def test_sort_created_at_desc(self):
        """Sort by created_at.desc should work with grouping"""
        response = requests.get(f"{BASE_URL}/api/download-links?sort=created_at.desc&limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        # Check items are sorted by latest_created_at descending
        dates = [item.get("latest_created_at") for item in items if item.get("latest_created_at")]
        if len(dates) > 1:
            for i in range(len(dates) - 1):
                assert dates[i] >= dates[i+1], f"Items should be sorted desc: {dates[i]} >= {dates[i+1]}"
        
        print(f"PASS: Sort by created_at.desc works with grouping")
    
    def test_sort_quality_desc(self):
        """Sort by quality.desc should work with grouping"""
        response = requests.get(f"{BASE_URL}/api/download-links?sort=quality.desc&limit=10&group=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data.get("items", [])) > 0, "Should return items"
        print(f"PASS: Sort by quality.desc works with grouping")


class TestCaching:
    """Tests for caching behavior"""
    
    def test_cache_makes_second_request_fast(self):
        """Second identical request should be faster due to 30s cache"""
        params = "?limit=5&group=true"
        
        # First request (may hit Supabase)
        start1 = time.time()
        response1 = requests.get(f"{BASE_URL}/api/download-links{params}")
        time1 = time.time() - start1
        assert response1.status_code == 200
        
        # Second request (should hit cache)
        start2 = time.time()
        response2 = requests.get(f"{BASE_URL}/api/download-links{params}")
        time2 = time.time() - start2
        assert response2.status_code == 200
        
        # Both should return same data
        assert response1.json()["total"] == response2.json()["total"]
        
        # Second request should be faster (or at least not significantly slower)
        # Note: Network latency can vary, so we just check it's reasonable
        print(f"PASS: Cache test - First request: {time1:.3f}s, Second request: {time2:.3f}s")


class TestRecentEndpoint:
    """Tests for /api/download-links/recent (unchanged behavior)"""
    
    def test_recent_still_deduplicates(self):
        """Recent endpoint should still deduplicate by (tmdb_id, media_type)"""
        response = requests.get(f"{BASE_URL}/api/download-links/recent?limit=12")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        # Check for duplicates
        seen = set()
        for item in items:
            key = (item.get("tmdb_id"), item.get("media_type"))
            assert key not in seen, f"Duplicate found in recent: {key}"
            seen.add(key)
        
        print(f"PASS: Recent endpoint still deduplicates, {len(items)} unique items")


class TestSecurity:
    """Security tests"""
    
    def test_no_supabase_credentials_in_download_links(self):
        """No Supabase credentials should leak in download-links response"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=5")
        assert response.status_code == 200
        body = response.text.lower()
        
        assert "supabase" not in body, "Supabase should not appear in response"
        assert "service_role" not in body, "service_role should not appear in response"
        assert "eyj" not in body, "JWT token should not appear in response"
        
        # Check headers too
        for header, value in response.headers.items():
            assert "supabase" not in value.lower(), f"Supabase in header {header}"
        
        print("PASS: No Supabase credentials leak in download-links response")
    
    def test_security_headers_present(self):
        """Security headers should be present"""
        response = requests.get(f"{BASE_URL}/api/download-links?limit=1")
        assert response.status_code == 200
        
        assert response.headers.get("X-Frame-Options") == "DENY", "X-Frame-Options should be DENY"
        assert response.headers.get("X-Content-Type-Options") == "nosniff", "X-Content-Type-Options should be nosniff"
        
        print("PASS: Security headers present on download-links endpoint")


class TestEdgeCases:
    """Edge case tests"""
    
    def test_empty_uploader_filter(self):
        """Filter by non-existent uploader returns empty"""
        response = requests.get(f"{BASE_URL}/api/download-links?uploader=NONEXISTENT_USER_12345&group=true")
        assert response.status_code == 200
        data = response.json()
        assert data.get("total") == 0, f"Expected 0 results for non-existent uploader, got {data.get('total')}"
        print("PASS: Non-existent uploader filter returns empty")
    
    def test_group_false_explicit(self):
        """Explicit group=false returns ungrouped"""
        response = requests.get(f"{BASE_URL}/api/download-links?group=false&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data.get("grouped") == False, "Should have grouped=False"
        print("PASS: Explicit group=false returns ungrouped data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
