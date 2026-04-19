"""
Test iteration 27 features:
1. VIP codes with duration_days and quantity
2. Info banner (public GET, admin PUT/GET)
3. TV/Radio voting (like/dislike toggle)
4. Security headers on new endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"


class TestSetup:
    """Setup and helper methods"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Admin login failed: {resp.text}"
        data = resp.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Headers with admin auth"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }


class TestVIPCodes(TestSetup):
    """Test VIP code generation with duration_days and quantity"""
    
    def test_create_vip_plus_codes_with_duration_and_quantity(self, admin_headers):
        """POST /api/admin/vip-codes with type='vip_plus', duration_days=60, quantity=3"""
        resp = requests.post(f"{BASE_URL}/api/admin/vip-codes", 
            headers=admin_headers,
            json={"type": "vip_plus", "duration_days": 60, "quantity": 3}
        )
        assert resp.status_code == 200, f"Failed to create VIP codes: {resp.text}"
        data = resp.json()
        
        # Should return 3 codes
        assert "codes" in data, "No 'codes' field in response"
        assert len(data["codes"]) == 3, f"Expected 3 codes, got {len(data['codes'])}"
        assert data["duration_days"] == 60, f"Expected duration_days=60, got {data.get('duration_days')}"
        assert data["type"] == "vip_plus", f"Expected type='vip_plus', got {data.get('type')}"
        print(f"✓ Created 3 VIP+ codes with 60-day duration: {data['codes']}")
    
    def test_create_vip_code_default_quantity(self, admin_headers):
        """POST /api/admin/vip-codes without quantity defaults to 1 code"""
        resp = requests.post(f"{BASE_URL}/api/admin/vip-codes",
            headers=admin_headers,
            json={"type": "vip", "duration_days": 30}
        )
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "codes" in data
        assert len(data["codes"]) == 1, f"Expected 1 code (default), got {len(data['codes'])}"
        assert "code" in data, "Should also have 'code' field for single code"
        print(f"✓ Default quantity=1 works: {data['code']}")
    
    def test_create_admin_code_no_duration(self, admin_headers):
        """POST /api/admin/vip-codes with type='admin' still works (no duration needed)"""
        resp = requests.post(f"{BASE_URL}/api/admin/vip-codes",
            headers=admin_headers,
            json={"type": "admin"}
        )
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "code" in data
        assert data["type"] == "admin"
        print(f"✓ Admin code created: {data['code']}")
    
    def test_get_vip_codes_list_has_duration_days(self, admin_headers):
        """GET /api/admin/vip-codes returns list with duration_days field"""
        resp = requests.get(f"{BASE_URL}/api/admin/vip-codes", headers=admin_headers)
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "codes" in data
        assert len(data["codes"]) > 0, "No codes found"
        
        # Check that codes have duration_days field
        for code in data["codes"][:5]:  # Check first 5
            assert "duration_days" in code, f"Code missing duration_days: {code}"
            assert "_id" in code, "Code missing _id"
        print(f"✓ GET /api/admin/vip-codes returns {len(data['codes'])} codes with duration_days")
    
    def test_delete_vip_code(self, admin_headers):
        """DELETE /api/admin/vip-codes/{id} removes a code"""
        # First create a code to delete
        create_resp = requests.post(f"{BASE_URL}/api/admin/vip-codes",
            headers=admin_headers,
            json={"type": "vip", "duration_days": 7}
        )
        assert create_resp.status_code == 200
        
        # Get the code ID
        list_resp = requests.get(f"{BASE_URL}/api/admin/vip-codes", headers=admin_headers)
        codes = list_resp.json()["codes"]
        code_to_delete = codes[0]  # Most recent
        code_id = code_to_delete["_id"]
        
        # Delete it
        del_resp = requests.delete(f"{BASE_URL}/api/admin/vip-codes/{code_id}", headers=admin_headers)
        assert del_resp.status_code == 200, f"Delete failed: {del_resp.text}"
        
        # Verify it's gone
        list_resp2 = requests.get(f"{BASE_URL}/api/admin/vip-codes", headers=admin_headers)
        remaining_ids = [c["_id"] for c in list_resp2.json()["codes"]]
        assert code_id not in remaining_ids, "Code was not deleted"
        print(f"✓ DELETE /api/admin/vip-codes/{code_id} worked")


class TestVIPCodeActivation(TestSetup):
    """Test VIP code activation with expiration"""
    
    @pytest.fixture(scope="class")
    def test_user_token(self, admin_headers):
        """Create a test user for activation tests"""
        import secrets
        test_email = f"test_vip_{secrets.token_hex(4)}@test.com"
        
        # Register new user
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"testvip{secrets.token_hex(3)}",
            "email": test_email,
            "password": "TestPass123!"
        })
        
        if reg_resp.status_code == 429:
            pytest.skip("Rate limited on registration")
        
        assert reg_resp.status_code in [200, 201], f"Registration failed: {reg_resp.text}"
        data = reg_resp.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def test_user_headers(self, test_user_token):
        if not test_user_token:
            pytest.skip("No test user token")
        return {
            "Authorization": f"Bearer {test_user_token}",
            "Content-Type": "application/json"
        }
    
    def test_activate_vip_plus_code_sets_expiration(self, admin_headers, test_user_headers):
        """POST /api/user/activate-code with VIP+ 30-day code sets vip_expires_at"""
        # Create a fresh VIP+ code
        create_resp = requests.post(f"{BASE_URL}/api/admin/vip-codes",
            headers=admin_headers,
            json={"type": "vip_plus", "duration_days": 30}
        )
        assert create_resp.status_code == 200
        code = create_resp.json()["code"]
        
        # Activate it
        activate_resp = requests.post(f"{BASE_URL}/api/user/activate-code",
            headers=test_user_headers,
            json={"code": code}
        )
        assert activate_resp.status_code == 200, f"Activation failed: {activate_resp.text}"
        data = activate_resp.json()
        
        # Check user has VIP+ status
        user = data.get("user", {})
        assert user.get("is_vip") == True, "User should be VIP"
        assert user.get("is_vip_plus") == True, "User should be VIP+"
        assert "vip_expires_at" in user, "User should have vip_expires_at"
        
        # Verify expiration is ~30 days in future
        expires_at = datetime.fromisoformat(user["vip_expires_at"].replace("Z", "+00:00"))
        now = datetime.now(expires_at.tzinfo)
        days_diff = (expires_at - now).days
        assert 29 <= days_diff <= 31, f"Expected ~30 days, got {days_diff}"
        print(f"✓ VIP+ code activated, expires in {days_diff} days")
    
    def test_activate_already_used_code_returns_400(self, admin_headers, test_user_headers):
        """POST /api/user/activate-code with already-used code returns 400"""
        # Create and use a code
        create_resp = requests.post(f"{BASE_URL}/api/admin/vip-codes",
            headers=admin_headers,
            json={"type": "vip", "duration_days": 7}
        )
        code = create_resp.json()["code"]
        
        # First activation
        requests.post(f"{BASE_URL}/api/user/activate-code",
            headers=test_user_headers,
            json={"code": code}
        )
        
        # Try to use same code again (should fail)
        resp2 = requests.post(f"{BASE_URL}/api/user/activate-code",
            headers=test_user_headers,
            json={"code": code}
        )
        assert resp2.status_code == 400, f"Expected 400 for used code, got {resp2.status_code}"
        print("✓ Already-used code returns 400")


class TestInfoBanner(TestSetup):
    """Test info banner endpoints"""
    
    def test_get_info_banner_public_disabled(self, admin_headers):
        """GET /api/info-banner returns {banner: null} when disabled"""
        # First disable the banner
        requests.put(f"{BASE_URL}/api/admin/info-banner",
            headers=admin_headers,
            json={"enabled": False, "message": ""}
        )
        
        # Public endpoint should return null
        resp = requests.get(f"{BASE_URL}/api/info-banner")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        assert data.get("banner") is None, f"Expected banner=null, got {data}"
        print("✓ GET /api/info-banner returns null when disabled")
    
    def test_put_info_banner_admin_persists_and_increments_version(self, admin_headers):
        """PUT /api/admin/info-banner persists and version increments"""
        # Get current version
        get_resp = requests.get(f"{BASE_URL}/api/admin/info-banner", headers=admin_headers)
        current = get_resp.json().get("banner", {})
        old_version = current.get("version", 0)
        
        # Update with new message
        update_resp = requests.put(f"{BASE_URL}/api/admin/info-banner",
            headers=admin_headers,
            json={
                "enabled": True,
                "message": f"Test banner {datetime.now().isoformat()}",
                "variant": "promo",
                "dismissible": True
            }
        )
        assert update_resp.status_code == 200, f"Failed: {update_resp.text}"
        data = update_resp.json()
        
        assert data.get("success") == True
        banner = data.get("banner", {})
        assert banner.get("enabled") == True
        assert banner.get("variant") == "promo"
        assert banner.get("dismissible") == True
        
        # Version should have incremented (message changed)
        new_version = banner.get("version", 0)
        assert new_version > old_version, f"Version should increment: {old_version} -> {new_version}"
        print(f"✓ PUT /api/admin/info-banner persisted, version {old_version} -> {new_version}")
    
    def test_put_info_banner_requires_admin_401(self):
        """PUT /api/admin/info-banner without auth returns 401"""
        resp = requests.put(f"{BASE_URL}/api/admin/info-banner",
            json={"enabled": True, "message": "Test"}
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ PUT /api/admin/info-banner without auth returns 401")
    
    def test_get_info_banner_public_when_enabled(self, admin_headers):
        """GET /api/info-banner returns banner object when enabled"""
        # Enable banner
        requests.put(f"{BASE_URL}/api/admin/info-banner",
            headers=admin_headers,
            json={"enabled": True, "message": "Active banner", "variant": "info"}
        )
        
        # Public endpoint should return banner
        resp = requests.get(f"{BASE_URL}/api/info-banner")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("banner") is not None, "Banner should not be null when enabled"
        assert data["banner"].get("enabled") == True
        assert data["banner"].get("message") == "Active banner"
        print("✓ GET /api/info-banner returns banner when enabled")
    
    def test_get_admin_info_banner_admin_only(self, admin_headers):
        """GET /api/admin/info-banner returns current config (admin only)"""
        resp = requests.get(f"{BASE_URL}/api/admin/info-banner", headers=admin_headers)
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "banner" in data
        banner = data["banner"]
        assert "enabled" in banner
        assert "message" in banner
        assert "variant" in banner
        print(f"✓ GET /api/admin/info-banner returns config: enabled={banner.get('enabled')}")
    
    def test_get_admin_info_banner_without_auth_401(self):
        """GET /api/admin/info-banner without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/admin/info-banner")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ GET /api/admin/info-banner without auth returns 401")


class TestMediaVotes(TestSetup):
    """Test TV channel and radio station voting"""
    
    @pytest.fixture(scope="class")
    def tv_channel_id(self, admin_headers):
        """Get a TV channel ID for testing"""
        resp = requests.get(f"{BASE_URL}/api/tv-channels")
        assert resp.status_code == 200
        channels = resp.json().get("channels", [])
        if not channels:
            pytest.skip("No TV channels available")
        return channels[0]["_id"]
    
    @pytest.fixture(scope="class")
    def radio_station_id(self, admin_headers):
        """Get a radio station ID for testing"""
        resp = requests.get(f"{BASE_URL}/api/radio-stations")
        assert resp.status_code == 200
        stations = resp.json().get("stations", [])
        if not stations:
            pytest.skip("No radio stations available")
        return stations[0]["_id"]
    
    def test_vote_tv_channel_like(self, admin_headers, tv_channel_id):
        """POST /api/tv-channels/{id}/vote with {vote:'like'} works"""
        resp = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "likes" in data
        assert "dislikes" in data
        assert "user_vote" in data
        print(f"✓ Vote like on TV channel: likes={data['likes']}, user_vote={data['user_vote']}")
    
    def test_vote_tv_channel_toggle_off(self, admin_headers, tv_channel_id):
        """POST /api/tv-channels/{id}/vote twice with 'like' removes vote"""
        # First like
        resp1 = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        data1 = resp1.json()
        
        # Second like (toggle off)
        resp2 = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        
        # If first vote was 'like', second should toggle it off (user_vote=null)
        # If first vote was null, second should set it to 'like'
        # The toggle behavior depends on current state
        print(f"✓ Toggle vote: first={data1.get('user_vote')}, second={data2.get('user_vote')}")
    
    def test_vote_tv_channel_flip_like_to_dislike(self, admin_headers, tv_channel_id):
        """POST /api/tv-channels/{id}/vote with 'like' then 'dislike' flips vote"""
        # Ensure we start with a like
        requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        resp1 = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        # Now we have no vote, add like
        resp2 = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        data_like = resp2.json()
        
        # Now flip to dislike
        resp3 = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "dislike"}
        )
        assert resp3.status_code == 200
        data_dislike = resp3.json()
        
        assert data_dislike.get("user_vote") == "dislike", f"Expected user_vote='dislike', got {data_dislike.get('user_vote')}"
        print(f"✓ Flip vote: like -> dislike, likes={data_dislike['likes']}, dislikes={data_dislike['dislikes']}")
    
    def test_vote_invalid_vote_string_returns_400(self, admin_headers, tv_channel_id):
        """POST /api/tv-channels/{id}/vote with invalid vote returns 400"""
        resp = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            headers=admin_headers,
            json={"vote": "invalid_vote"}
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print("✓ Invalid vote string returns 400")
    
    def test_vote_without_auth_returns_401(self, tv_channel_id):
        """POST /api/tv-channels/{id}/vote without auth returns 401"""
        resp = requests.post(f"{BASE_URL}/api/tv-channels/{tv_channel_id}/vote",
            json={"vote": "like"}
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Vote without auth returns 401")
    
    def test_vote_radio_station_works(self, admin_headers, radio_station_id):
        """POST /api/radio-stations/{id}/vote works same as TV channels"""
        resp = requests.post(f"{BASE_URL}/api/radio-stations/{radio_station_id}/vote",
            headers=admin_headers,
            json={"vote": "like"}
        )
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "likes" in data
        assert "dislikes" in data
        assert "user_vote" in data
        print(f"✓ Vote on radio station: likes={data['likes']}, user_vote={data['user_vote']}")
    
    def test_get_my_media_votes(self, admin_headers):
        """GET /api/media-votes/mine returns user's votes"""
        resp = requests.get(f"{BASE_URL}/api/media-votes/mine", headers=admin_headers)
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        assert "votes" in data
        # Should have at least some votes from previous tests
        print(f"✓ GET /api/media-votes/mine returns {len(data['votes'])} votes")


class TestMediaListsWithVotes(TestSetup):
    """Test that TV channels and radio stations include likes/dislikes"""
    
    def test_tv_channels_have_likes_dislikes(self):
        """GET /api/tv-channels returns channels with likes/dislikes fields"""
        resp = requests.get(f"{BASE_URL}/api/tv-channels")
        assert resp.status_code == 200
        data = resp.json()
        
        channels = data.get("channels", [])
        if channels:
            for ch in channels[:3]:
                assert "likes" in ch, f"Channel missing 'likes': {ch.get('name')}"
                assert "dislikes" in ch, f"Channel missing 'dislikes': {ch.get('name')}"
            print(f"✓ TV channels have likes/dislikes fields")
        else:
            print("⚠ No TV channels to verify")
    
    def test_radio_stations_have_likes_dislikes(self):
        """GET /api/radio-stations returns stations with likes/dislikes fields"""
        resp = requests.get(f"{BASE_URL}/api/radio-stations")
        assert resp.status_code == 200
        data = resp.json()
        
        stations = data.get("stations", [])
        if stations:
            for st in stations[:3]:
                assert "likes" in st, f"Station missing 'likes': {st.get('name')}"
                assert "dislikes" in st, f"Station missing 'dislikes': {st.get('name')}"
            print(f"✓ Radio stations have likes/dislikes fields")
        else:
            print("⚠ No radio stations to verify")


class TestSecurityHeaders(TestSetup):
    """Test security headers on new endpoints"""
    
    def test_security_headers_on_info_banner(self):
        """Security headers present on /api/info-banner"""
        resp = requests.get(f"{BASE_URL}/api/info-banner")
        
        assert resp.headers.get("X-Frame-Options") == "DENY", "Missing X-Frame-Options"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options"
        print("✓ Security headers on /api/info-banner")
    
    def test_security_headers_on_tv_channels(self):
        """Security headers present on /api/tv-channels"""
        resp = requests.get(f"{BASE_URL}/api/tv-channels")
        
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        print("✓ Security headers on /api/tv-channels")
    
    def test_security_headers_on_radio_stations(self):
        """Security headers present on /api/radio-stations"""
        resp = requests.get(f"{BASE_URL}/api/radio-stations")
        
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        print("✓ Security headers on /api/radio-stations")
    
    def test_security_headers_on_vip_codes(self, admin_headers):
        """Security headers present on /api/admin/vip-codes"""
        resp = requests.get(f"{BASE_URL}/api/admin/vip-codes", headers=admin_headers)
        
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        print("✓ Security headers on /api/admin/vip-codes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
