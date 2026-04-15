"""
WaveWatch Playlist System Tests - Iteration 4
Tests for complete playlist CRUD operations and integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"

class TestPlaylistSystem:
    """Complete playlist system tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get auth cookie
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        yield
        # Cleanup: logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    # ==================== PLAYLIST CRUD ====================
    
    def test_create_playlist(self):
        """POST /api/playlists - Create a new playlist"""
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Playlist_Create",
            "description": "Test playlist description",
            "is_public": False
        })
        assert resp.status_code == 200, f"Create playlist failed: {resp.text}"
        data = resp.json()
        assert "playlist" in data
        assert data["playlist"]["name"] == "TEST_Playlist_Create"
        assert data["playlist"]["description"] == "Test playlist description"
        assert data["playlist"]["is_public"] == False
        assert "_id" in data["playlist"]
        print(f"✓ Created playlist: {data['playlist']['_id']}")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{data['playlist']['_id']}")
    
    def test_create_public_playlist(self):
        """POST /api/playlists - Create a public playlist"""
        resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Public_Playlist",
            "description": "Public test playlist",
            "is_public": True
        })
        assert resp.status_code == 200, f"Create public playlist failed: {resp.text}"
        data = resp.json()
        assert data["playlist"]["is_public"] == True
        print(f"✓ Created public playlist: {data['playlist']['_id']}")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{data['playlist']['_id']}")
    
    def test_get_user_playlists(self):
        """GET /api/playlists - Get user's playlists"""
        # First create a playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Get_Playlists",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Get playlists
        resp = self.session.get(f"{BASE_URL}/api/playlists")
        assert resp.status_code == 200, f"Get playlists failed: {resp.text}"
        data = resp.json()
        assert "playlists" in data
        assert isinstance(data["playlists"], list)
        # Check our playlist is in the list
        playlist_ids = [p["_id"] for p in data["playlists"]]
        assert playlist_id in playlist_ids
        print(f"✓ Got {len(data['playlists'])} playlists")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_get_specific_playlist(self):
        """GET /api/playlists/{id} - Get specific playlist"""
        # Create playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Specific_Playlist",
            "description": "Specific test",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Get specific playlist
        resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        assert resp.status_code == 200, f"Get specific playlist failed: {resp.text}"
        data = resp.json()
        assert "playlist" in data
        assert data["playlist"]["_id"] == playlist_id
        assert data["playlist"]["name"] == "TEST_Specific_Playlist"
        print(f"✓ Got specific playlist: {playlist_id}")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_delete_playlist(self):
        """DELETE /api/playlists/{id} - Delete playlist"""
        # Create playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Delete_Playlist",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Delete playlist
        resp = self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
        assert resp.status_code == 200, f"Delete playlist failed: {resp.text}"
        
        # Verify deleted
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        assert get_resp.status_code == 404
        print(f"✓ Deleted playlist: {playlist_id}")
    
    # ==================== PLAYLIST ITEMS ====================
    
    def test_add_item_to_playlist(self):
        """POST /api/playlists/{id}/items - Add item to playlist"""
        # Create playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Add_Item_Playlist",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Add movie item
        resp = self.session.post(f"{BASE_URL}/api/playlists/{playlist_id}/items", json={
            "content_id": 550,  # Fight Club
            "content_type": "movie",
            "title": "Fight Club",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
        })
        assert resp.status_code == 200, f"Add item failed: {resp.text}"
        
        # Verify item added
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist = get_resp.json()["playlist"]
        assert len(playlist["items"]) == 1
        assert playlist["items"][0]["content_id"] == 550
        assert playlist["items"][0]["content_type"] == "movie"
        assert playlist["items"][0]["title"] == "Fight Club"
        print(f"✓ Added item to playlist: {playlist_id}")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_add_tv_item_to_playlist(self):
        """POST /api/playlists/{id}/items - Add TV show to playlist"""
        # Create playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_TV_Item_Playlist",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Add TV item
        resp = self.session.post(f"{BASE_URL}/api/playlists/{playlist_id}/items", json={
            "content_id": 1399,  # Game of Thrones
            "content_type": "tv",
            "title": "Game of Thrones",
            "poster_path": "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg"
        })
        assert resp.status_code == 200, f"Add TV item failed: {resp.text}"
        
        # Verify
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist = get_resp.json()["playlist"]
        assert playlist["items"][0]["content_type"] == "tv"
        print(f"✓ Added TV item to playlist")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_remove_item_from_playlist(self):
        """DELETE /api/playlists/{id}/items/{content_id} - Remove item"""
        # Create playlist and add item
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Remove_Item_Playlist",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        self.session.post(f"{BASE_URL}/api/playlists/{playlist_id}/items", json={
            "content_id": 550,
            "content_type": "movie",
            "title": "Fight Club",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
        })
        
        # Remove item
        resp = self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}/items/550")
        assert resp.status_code == 200, f"Remove item failed: {resp.text}"
        
        # Verify removed
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist = get_resp.json()["playlist"]
        assert len(playlist["items"]) == 0
        print(f"✓ Removed item from playlist")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_add_multiple_items_to_playlist(self):
        """Add multiple items to playlist and verify order"""
        # Create playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Multiple_Items",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Add 3 items
        items = [
            {"content_id": 550, "content_type": "movie", "title": "Fight Club", "poster_path": "/path1.jpg"},
            {"content_id": 1399, "content_type": "tv", "title": "Game of Thrones", "poster_path": "/path2.jpg"},
            {"content_id": 278, "content_type": "movie", "title": "Shawshank Redemption", "poster_path": "/path3.jpg"},
        ]
        for item in items:
            self.session.post(f"{BASE_URL}/api/playlists/{playlist_id}/items", json=item)
        
        # Verify all items
        get_resp = self.session.get(f"{BASE_URL}/api/playlists/{playlist_id}")
        playlist = get_resp.json()["playlist"]
        assert len(playlist["items"]) == 3
        print(f"✓ Added 3 items to playlist")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    # ==================== PUBLIC PLAYLISTS ====================
    
    def test_discover_public_playlists(self):
        """GET /api/playlists/public/discover - Get public playlists"""
        # Create a public playlist
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Discover_Public",
            "description": "Public for discovery",
            "is_public": True
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        # Discover public playlists (no auth needed)
        session_no_auth = requests.Session()
        resp = session_no_auth.get(f"{BASE_URL}/api/playlists/public/discover")
        assert resp.status_code == 200, f"Discover playlists failed: {resp.text}"
        data = resp.json()
        assert "playlists" in data
        assert "total" in data
        print(f"✓ Discovered {len(data['playlists'])} public playlists (total: {data['total']})")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")
    
    def test_discover_playlists_pagination(self):
        """GET /api/playlists/public/discover?page=1 - Test pagination"""
        resp = requests.get(f"{BASE_URL}/api/playlists/public/discover?page=1")
        assert resp.status_code == 200
        data = resp.json()
        assert "playlists" in data
        assert "total" in data
        print(f"✓ Pagination works - page 1")
    
    # ==================== AUTH REQUIREMENTS ====================
    
    def test_create_playlist_requires_auth(self):
        """POST /api/playlists without auth should fail"""
        session_no_auth = requests.Session()
        resp = session_no_auth.post(f"{BASE_URL}/api/playlists", json={
            "name": "Unauthorized Playlist",
            "description": "",
            "is_public": False
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"✓ Create playlist requires auth")
    
    def test_get_playlists_requires_auth(self):
        """GET /api/playlists without auth should fail"""
        session_no_auth = requests.Session()
        resp = session_no_auth.get(f"{BASE_URL}/api/playlists")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"✓ Get user playlists requires auth")
    
    def test_add_item_requires_auth(self):
        """POST /api/playlists/{id}/items without auth should fail"""
        session_no_auth = requests.Session()
        resp = session_no_auth.post(f"{BASE_URL}/api/playlists/someid/items", json={
            "content_id": 550,
            "content_type": "movie",
            "title": "Test",
            "poster_path": None
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"✓ Add item requires auth")
    
    def test_delete_playlist_requires_auth(self):
        """DELETE /api/playlists/{id} without auth should fail"""
        session_no_auth = requests.Session()
        resp = session_no_auth.delete(f"{BASE_URL}/api/playlists/someid")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print(f"✓ Delete playlist requires auth")
    
    # ==================== EDGE CASES ====================
    
    def test_get_nonexistent_playlist(self):
        """GET /api/playlists/{invalid_id} should return 404"""
        resp = self.session.get(f"{BASE_URL}/api/playlists/000000000000000000000000")
        assert resp.status_code == 404
        print(f"✓ Nonexistent playlist returns 404")
    
    def test_playlist_with_items_shows_in_list(self):
        """Verify playlist items are included when listing playlists"""
        # Create playlist with item
        create_resp = self.session.post(f"{BASE_URL}/api/playlists", json={
            "name": "TEST_Items_In_List",
            "description": "",
            "is_public": False
        })
        playlist_id = create_resp.json()["playlist"]["_id"]
        
        self.session.post(f"{BASE_URL}/api/playlists/{playlist_id}/items", json={
            "content_id": 550,
            "content_type": "movie",
            "title": "Fight Club",
            "poster_path": "/poster.jpg"
        })
        
        # Get playlists list
        resp = self.session.get(f"{BASE_URL}/api/playlists")
        playlists = resp.json()["playlists"]
        our_playlist = next((p for p in playlists if p["_id"] == playlist_id), None)
        assert our_playlist is not None
        assert "items" in our_playlist
        assert len(our_playlist["items"]) == 1
        print(f"✓ Playlist items included in list response")
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/playlists/{playlist_id}")


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """GET /api/health"""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed")
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Login successful")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert resp.status_code == 401
        print(f"✓ Invalid login rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
