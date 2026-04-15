"""
Test suite for WaveWatch Iteration 17 features:
1. Playlist customization with tabs (Couleurs, Icones, Couverture)
2. Backend PUT /api/playlists/{id}/customize accepts name, description, icon, is_public
3. VIP theme animations (CSS-based, verified via DOM classes)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPlaylistCustomization:
    """Test playlist customization endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get auth cookies"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user = login_resp.json().get("user", {})
        print(f"Logged in as: {self.user.get('email')}")
        yield
        # Cleanup - logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_create_playlist_for_customization(self):
        """Create a test playlist for customization tests"""
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_CustomizePlaylist",
            "description": "Test playlist for customization",
            "is_public": False
        })
        assert resp.status_code == 200, f"Create playlist failed: {resp.text}"
        data = resp.json()
        assert "playlist" in data
        self.playlist_id = data["playlist"]["_id"]
        print(f"Created playlist: {self.playlist_id}")
        
        # Test customize with name
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{self.playlist_id}/customize", json={
            "name": "TEST_RenamedPlaylist"
        })
        assert customize_resp.status_code == 200, f"Customize name failed: {customize_resp.text}"
        print("Customize name: PASS")
        
        # Verify name was updated
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{self.playlist_id}")
        assert get_resp.status_code == 200
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data["name"] == "TEST_RenamedPlaylist", f"Name not updated: {playlist_data['name']}"
        print("Verify name update: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{self.playlist_id}")
    
    def test_customize_playlist_description(self):
        """Test updating playlist description via customize endpoint"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_DescPlaylist",
            "description": "Original description",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Update description
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "description": "Updated description via customize"
        })
        assert customize_resp.status_code == 200, f"Customize description failed: {customize_resp.text}"
        print("Customize description: PASS")
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data["description"] == "Updated description via customize"
        print("Verify description update: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_customize_playlist_icon(self):
        """Test updating playlist icon via customize endpoint"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_IconPlaylist",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Update icon
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "icon": "fire"
        })
        assert customize_resp.status_code == 200, f"Customize icon failed: {customize_resp.text}"
        print("Customize icon: PASS")
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data.get("icon") == "fire", f"Icon not updated: {playlist_data.get('icon')}"
        print("Verify icon update: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_customize_playlist_is_public(self):
        """Test toggling playlist public/private via customize endpoint"""
        # Create private playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_PublicTogglePlaylist",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Toggle to public
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "is_public": True
        })
        assert customize_resp.status_code == 200, f"Customize is_public failed: {customize_resp.text}"
        print("Customize is_public to True: PASS")
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data.get("is_public") == True, f"is_public not updated: {playlist_data.get('is_public')}"
        print("Verify is_public=True: PASS")
        
        # Toggle back to private
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "is_public": False
        })
        assert customize_resp.status_code == 200
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data.get("is_public") == False
        print("Verify is_public=False: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_customize_playlist_color_and_gradient(self):
        """Test updating playlist color and gradient"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_ColorPlaylist",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Update color and gradient
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "color": "gold",
            "gradient": "linear-gradient(135deg, #92400e, #fbbf24, #92400e)",
            "animation": "shimmer"
        })
        assert customize_resp.status_code == 200, f"Customize color failed: {customize_resp.text}"
        print("Customize color/gradient/animation: PASS")
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data.get("color") == "gold"
        assert "gradient" in playlist_data.get("gradient", "")
        assert playlist_data.get("animation") == "shimmer"
        print("Verify color/gradient/animation: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_customize_playlist_cover_url_vip(self):
        """Test updating playlist cover URL (VIP feature - admin has VIP)"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_CoverPlaylist",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Update cover URL (admin is VIP so should work)
        cover_url = "https://image.tmdb.org/t/p/w780/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg"
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "cover_url": cover_url
        })
        assert customize_resp.status_code == 200, f"Customize cover_url failed: {customize_resp.text}"
        print("Customize cover_url: PASS")
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data.get("cover_url") == cover_url
        print("Verify cover_url: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_customize_multiple_fields_at_once(self):
        """Test updating multiple fields in a single customize call"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_MultiFieldPlaylist",
            "is_public": False
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Update multiple fields
        customize_resp = self.session.put(f"{BASE_URL}/api/playlists/{playlist_id}/customize", json={
            "name": "TEST_UpdatedMultiField",
            "description": "Multi-field update test",
            "icon": "star",
            "is_public": True,
            "color": "blue",
            "gradient": "linear-gradient(135deg, #1e3a5f, #2563eb)"
        })
        assert customize_resp.status_code == 200, f"Multi-field customize failed: {customize_resp.text}"
        print("Customize multiple fields: PASS")
        
        # Verify all fields
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist_data = get_resp.json()["playlist"]
        assert playlist_data["name"] == "TEST_UpdatedMultiField"
        assert playlist_data["description"] == "Multi-field update test"
        assert playlist_data.get("icon") == "star"
        assert playlist_data.get("is_public") == True
        assert playlist_data.get("color") == "blue"
        print("Verify all fields updated: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")


class TestPlaylistDetailEndpoint:
    """Test playlist detail endpoint returns user_info for badges"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert login_resp.status_code == 200
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_playlist_detail_includes_user_info(self):
        """Test that playlist detail includes user_info for badge display"""
        # Create playlist
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_UserInfoPlaylist",
            "is_public": True
        })
        assert resp.status_code == 200
        playlist_id = resp.json()["playlist"]["_id"]
        
        # Get playlist detail
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        assert get_resp.status_code == 200
        playlist_data = get_resp.json()["playlist"]
        
        # Verify user_info is present
        assert "user_info" in playlist_data, "user_info not in playlist response"
        user_info = playlist_data["user_info"]
        assert "is_admin" in user_info
        assert "is_vip" in user_info
        assert "is_vip_plus" in user_info
        print(f"user_info: {user_info}")
        print("Playlist detail includes user_info: PASS")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "ok"
        print("Health endpoint: PASS")
    
    def test_login_admin(self):
        """Test admin login"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert data["user"]["is_admin"] == True
        assert data["user"]["is_vip"] == True
        assert data["user"]["is_vip_plus"] == True
        print("Admin login: PASS")
        print(f"Admin user: {data['user']['email']}, is_admin={data['user']['is_admin']}, is_vip={data['user']['is_vip']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_playlists(self):
        """Remove any TEST_ prefixed playlists"""
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        if login_resp.status_code != 200:
            pytest.skip("Cannot login for cleanup")
        
        # Get all playlists
        playlists_resp = session.get(f"{BASE_URL}/api/playlists")
        if playlists_resp.status_code == 200:
            playlists = playlists_resp.json().get("playlists", [])
            deleted = 0
            for p in playlists:
                if p.get("name", "").startswith("TEST_"):
                    session.delete(f"{BASE_URL}/api/playlists/{p['_id']}")
                    deleted += 1
            print(f"Cleaned up {deleted} test playlists")
        
        session.post(f"{BASE_URL}/api/auth/logout")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
