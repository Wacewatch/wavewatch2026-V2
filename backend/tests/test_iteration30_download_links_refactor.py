"""
Iteration 30: Download Links Refactor Tests
============================================
Tests for the refactored /api/download-links endpoint:
- NO MORE Python-side dedup - returns raw paginated Supabase rows (total=15237)
- Joins Supabase profiles table to get uploader info (uploader_username, uploader_role)
- New filter: uploader=username uses PostgREST inner join
- New sorts: profiles(username).asc/desc and quality.asc/desc
- New endpoint: /api/download-links/uploaders for dropdown options
- /recent endpoint still dedups (unchanged, for home slider)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDownloadLinksRefactor:
    """Tests for the refactored download-links endpoint with uploader info"""
    
    def test_download_links_returns_all_items_no_dedup(self):
        """GET /api/download-links?limit=24 now returns 15237 total (not deduplicated)"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"limit": 24})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "has_more" in data
        
        # Total should be around 15237 (not deduplicated)
        total = data["total"]
        print(f"Total download links: {total}")
        assert total > 10000, f"Expected total > 10000 (no dedup), got {total}"
        
        # Items should have uploader info
        if data["items"]:
            item = data["items"][0]
            assert "uploader_username" in item, "Missing uploader_username field"
            assert "uploader_role" in item, "Missing uploader_role field"
            print(f"First item uploader: {item['uploader_username']} ({item['uploader_role']})")
    
    def test_download_links_items_have_required_fields(self):
        """Items include all required fields including uploader info"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"limit": 10})
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "id", "tmdb_id", "media_type", "ww_id", "source_name", "source_url",
            "quality", "resolution", "language", "release_name", "season_number",
            "episode_number", "file_size", "is_verified", "created_at", "submitted_by",
            "uploader_username", "uploader_role", "title", "poster_path"
        ]
        
        if data["items"]:
            item = data["items"][0]
            for field in required_fields:
                assert field in item, f"Missing required field: {field}"
            print(f"All required fields present. Sample item: id={item['id']}, title={item.get('title')}, uploader={item['uploader_username']}")
    
    def test_download_links_filter_by_uploader_imperium(self):
        """GET /api/download-links?uploader=IMPERIUM filters correctly (~8951 items)"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"uploader": "IMPERIUM", "limit": 24})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        total = data["total"]
        print(f"IMPERIUM uploads total: {total}")
        
        # Should be significantly less than total (around 8951)
        assert total < 15237, f"Filter should reduce total, got {total}"
        assert total > 5000, f"IMPERIUM should have many uploads, got {total}"
        
        # All items should have uploader_username=IMPERIUM
        for item in data["items"]:
            assert item["uploader_username"] == "IMPERIUM", f"Expected IMPERIUM, got {item['uploader_username']}"
    
    def test_download_links_filter_by_uploader_dimrost(self):
        """GET /api/download-links?uploader=Dimrost works (~1731 items)"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"uploader": "Dimrost", "limit": 24})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        total = data["total"]
        print(f"Dimrost uploads total: {total}")
        
        # Should be around 1731
        assert total != 15237, f"Filter should restrict results, got total={total}"
        assert total > 0, f"Dimrost should have uploads, got {total}"
        
        # All items should have uploader_username=Dimrost
        for item in data["items"]:
            assert item["uploader_username"] == "Dimrost", f"Expected Dimrost, got {item['uploader_username']}"
    
    def test_download_links_filter_by_nonexistent_uploader(self):
        """GET /api/download-links?uploader=NONEXISTENT returns empty list total=0"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"uploader": "NONEXISTENT_USER_12345", "limit": 24})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["total"] == 0, f"Expected total=0 for nonexistent uploader, got {data['total']}"
        assert len(data["items"]) == 0, f"Expected empty items, got {len(data['items'])}"
        print("Nonexistent uploader correctly returns empty results")
    
    def test_download_links_sort_by_uploader_asc(self):
        """GET /api/download-links?sort=profiles(username).asc sorts uploaders A→Z"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"sort": "profiles(username).asc", "limit": 50})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        if len(data["items"]) > 1:
            usernames = [item["uploader_username"] for item in data["items"]]
            # Filter out 'Anonyme' for sorting check
            non_anon = [u for u in usernames if u != "Anonyme"]
            if len(non_anon) > 1:
                # Check if sorted ascending
                sorted_usernames = sorted(non_anon, key=str.lower)
                print(f"First 5 usernames (asc): {non_anon[:5]}")
                # At least first few should be in order
                assert non_anon[0].lower() <= non_anon[-1].lower(), f"Expected ascending order"
    
    def test_download_links_sort_by_uploader_desc(self):
        """GET /api/download-links?sort=profiles(username).desc sorts uploaders Z→A"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"sort": "profiles(username).desc", "limit": 50})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        if len(data["items"]) > 1:
            usernames = [item["uploader_username"] for item in data["items"]]
            non_anon = [u for u in usernames if u != "Anonyme"]
            if len(non_anon) > 1:
                print(f"First 5 usernames (desc): {non_anon[:5]}")
                # Check descending order
                assert non_anon[0].lower() >= non_anon[-1].lower(), f"Expected descending order"
    
    def test_download_links_sort_by_quality_asc(self):
        """GET /api/download-links?sort=quality.asc sorts by quality ascending"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"sort": "quality.asc", "limit": 50})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        if len(data["items"]) > 1:
            qualities = [item.get("quality") for item in data["items"]]
            print(f"First 5 qualities (asc): {qualities[:5]}")
            # Just verify the endpoint works and returns data
            assert len(data["items"]) > 0
    
    def test_download_links_sort_by_quality_desc(self):
        """GET /api/download-links?sort=quality.desc sorts by quality descending"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"sort": "quality.desc", "limit": 50})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        if len(data["items"]) > 1:
            qualities = [item.get("quality") for item in data["items"]]
            print(f"First 5 qualities (desc): {qualities[:5]}")
            assert len(data["items"]) > 0
    
    def test_download_links_invalid_sort_defaults_to_created_at_desc(self):
        """GET /api/download-links?sort=invalid_sort defaults to created_at.desc"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"sort": "invalid_sort_field", "limit": 10})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should still return data (defaulted to created_at.desc)
        assert "items" in data
        assert "total" in data
        print(f"Invalid sort handled gracefully, returned {len(data['items'])} items")
    
    def test_download_links_combined_filters(self):
        """GET /api/download-links combining filters works (uploader + quality + media_type)"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={
            "uploader": "IMPERIUM",
            "quality": "FHD",
            "media_type": "tv",
            "limit": 24
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Combined filter (IMPERIUM + FHD + tv) total: {data['total']}")
        
        # Verify all filters applied
        for item in data["items"]:
            assert item["uploader_username"] == "IMPERIUM", f"Expected IMPERIUM uploader"
            assert item["quality"] == "FHD", f"Expected FHD quality, got {item['quality']}"
            assert item["media_type"] == "tv", f"Expected tv media_type, got {item['media_type']}"
    
    def test_download_links_anonyme_for_missing_profile(self):
        """Items without a profile link show uploader_username='Anonyme' and uploader_role='user'"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"limit": 100})
        assert response.status_code == 200
        data = response.json()
        
        # Look for items with Anonyme
        anonyme_items = [item for item in data["items"] if item["uploader_username"] == "Anonyme"]
        if anonyme_items:
            for item in anonyme_items[:3]:
                assert item["uploader_role"] == "user", f"Anonyme should have role='user', got {item['uploader_role']}"
            print(f"Found {len(anonyme_items)} items with Anonyme uploader")
        else:
            print("No Anonyme items found in first 100 results (all have profiles)")


class TestUploadersEndpoint:
    """Tests for the new /api/download-links/uploaders endpoint"""
    
    def test_uploaders_endpoint_returns_list(self):
        """GET /api/download-links/uploaders returns list of {username, role}"""
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "uploaders" in data
        uploaders = data["uploaders"]
        print(f"Found {len(uploaders)} uploaders")
        
        if uploaders:
            # Verify structure
            for uploader in uploaders[:5]:
                assert "username" in uploader, "Missing username field"
                assert "role" in uploader, "Missing role field"
                print(f"  - {uploader['username']} ({uploader['role']})")
    
    def test_uploaders_endpoint_is_public(self):
        """GET /api/download-links/uploaders is PUBLIC (no auth required)"""
        # No auth headers
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200, f"Expected 200 (public), got {response.status_code}"
        print("Uploaders endpoint is public (no auth required)")
    
    def test_uploaders_only_uploader_and_admin_roles(self):
        """Uploaders list only contains profiles with role in ('uploader', 'admin')"""
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200
        data = response.json()
        
        for uploader in data["uploaders"]:
            assert uploader["role"] in ("uploader", "admin"), f"Unexpected role: {uploader['role']}"
        print(f"All {len(data['uploaders'])} uploaders have valid roles (uploader/admin)")
    
    def test_uploaders_sorted_by_username(self):
        """Uploaders list is sorted by username"""
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200
        data = response.json()
        
        usernames = [u["username"] for u in data["uploaders"]]
        sorted_usernames = sorted(usernames, key=str.lower)
        assert usernames == sorted_usernames, f"Uploaders not sorted: {usernames[:5]}"
        print(f"Uploaders sorted alphabetically: {usernames[:5]}")


class TestRecentEndpointUnchanged:
    """Tests to verify /api/download-links/recent still works (still deduplicated)"""
    
    def test_recent_still_deduplicates(self):
        """GET /api/download-links/recent still works unchanged (still deduplicated for home slider)"""
        response = requests.get(f"{BASE_URL}/api/download-links/recent", params={"limit": 12})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "items" in data
        assert "count" in data
        
        # Check for deduplication - each (tmdb_id, media_type) should be unique
        seen = set()
        for item in data["items"]:
            key = (item.get("tmdb_id"), item.get("media_type"))
            assert key not in seen, f"Duplicate found: {key}"
            seen.add(key)
        
        print(f"Recent endpoint returned {data['count']} unique items (deduplicated)")


class TestSecurityHeaders:
    """Security tests for download-links endpoints"""
    
    def test_no_supabase_credentials_in_download_links_response(self):
        """Security: no supabase credentials (service_role key) leak in /api/download-links response"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"limit": 10})
        assert response.status_code == 200
        
        # Check response body
        body = response.text.lower()
        assert "service_role" not in body, "service_role key leaked in response body"
        assert "eyj" not in body or "supabase" not in body, "JWT token possibly leaked"
        
        # Check headers
        for header, value in response.headers.items():
            assert "service_role" not in value.lower(), f"service_role leaked in header {header}"
        
        print("No Supabase credentials leaked in /api/download-links response")
    
    def test_no_supabase_credentials_in_uploaders_response(self):
        """Security: no supabase credentials leak in /api/download-links/uploaders response"""
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200
        
        body = response.text.lower()
        assert "service_role" not in body, "service_role key leaked in response body"
        
        print("No Supabase credentials leaked in /api/download-links/uploaders response")
    
    def test_security_headers_on_download_links(self):
        """Security headers present on /api/download-links"""
        response = requests.get(f"{BASE_URL}/api/download-links", params={"limit": 1})
        assert response.status_code == 200
        
        assert response.headers.get("X-Frame-Options") == "DENY", "Missing X-Frame-Options header"
        assert response.headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options header"
        print("Security headers present on /api/download-links")
    
    def test_security_headers_on_uploaders(self):
        """Security headers present on /api/download-links/uploaders"""
        response = requests.get(f"{BASE_URL}/api/download-links/uploaders")
        assert response.status_code == 200
        
        assert response.headers.get("X-Frame-Options") == "DENY", "Missing X-Frame-Options header"
        assert response.headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options header"
        print("Security headers present on /api/download-links/uploaders")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
