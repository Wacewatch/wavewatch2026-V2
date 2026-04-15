"""
WaveWatch API Tests - Iteration 3
Tests for NEW features: Cinema Rooms, Achievements, Leaderboard, and enhanced homepage sections
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ==================== HEALTH & BASIC ====================
class TestHealthAndBasic:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")


# ==================== AUTHENTICATION ====================
class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self):
        """Test login with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@wavewatch.com", "password": "WaveWatch2026!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@wavewatch.com"
        assert data["user"]["is_admin"] == True
        print("✓ Admin login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code in [401, 400]
        print("✓ Invalid login correctly rejected")


# ==================== LEADERBOARD (PUBLIC) ====================
class TestLeaderboard:
    """Leaderboard endpoint tests - PUBLIC"""
    
    def test_leaderboard_public(self):
        """Test leaderboard endpoint is public"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        print(f"✓ Leaderboard public endpoint: {len(data['leaderboard'])} users")
    
    def test_vip_game_winners_public(self):
        """Test VIP game winners endpoint is public"""
        response = requests.get(f"{BASE_URL}/api/vip-game/winners")
        assert response.status_code == 200
        data = response.json()
        assert "winners" in data
        assert isinstance(data["winners"], list)
        print(f"✓ VIP game winners: {len(data['winners'])} winners")


# ==================== CINEMA ROOMS (PUBLIC) ====================
class TestCinemaRoomsPublic:
    """Cinema rooms public endpoint tests"""
    
    def test_cinema_rooms_public(self):
        """Test public cinema rooms endpoint"""
        response = requests.get(f"{BASE_URL}/api/cinema-rooms")
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        print(f"✓ Public cinema rooms: {len(data['rooms'])} rooms")


# ==================== TV CHANNELS ====================
class TestTVChannels:
    """TV Channels endpoint tests"""
    
    def test_tv_channels(self):
        """Test TV channels endpoint"""
        response = requests.get(f"{BASE_URL}/api/tv-channels")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        # Verify channel structure
        channel = data["channels"][0]
        assert "id" in channel
        assert "name" in channel
        print(f"✓ TV channels: {len(data['channels'])} channels")


# ==================== PLAYLISTS PUBLIC ====================
class TestPlaylistsPublic:
    """Public playlists endpoint tests"""
    
    def test_discover_playlists(self):
        """Test public playlists discovery endpoint"""
        response = requests.get(f"{BASE_URL}/api/playlists/public/discover")
        assert response.status_code == 200
        data = response.json()
        assert "playlists" in data
        assert "total" in data
        print(f"✓ Public playlists: {len(data['playlists'])} playlists")


# ==================== TMDB INTEGRATION ====================
class TestTMDBIntegration:
    """TMDB API integration tests for homepage sections"""
    
    def test_trending_movies(self):
        """Test trending movies for Films Tendance section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        print(f"✓ Trending movies: {len(data['results'])} results")
    
    def test_trending_tv(self):
        """Test trending TV for Series Tendance section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending TV: {len(data['results'])} results")
    
    def test_trending_anime(self):
        """Test trending anime for Animes section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/anime")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending anime: {len(data['results'])} results")
    
    def test_popular_movies(self):
        """Test popular movies for Films Populaires section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Popular movies: {len(data['results'])} results")
    
    def test_popular_tv(self):
        """Test popular TV for Series Populaires section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Popular TV: {len(data['results'])} results")
    
    def test_popular_persons(self):
        """Test popular persons for Acteurs Tendance section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/persons")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        actor = data["results"][0]
        assert "id" in actor
        assert "name" in actor
        print(f"✓ Popular persons: {len(data['results'])} results")
    
    def test_upcoming_movies(self):
        """Test upcoming movies for Calendar Widget section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/upcoming/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Upcoming movies: {len(data['results'])} results")
    
    def test_collections_search(self):
        """Test collections search for Popular Collections section"""
        response = requests.get(f"{BASE_URL}/api/tmdb/collections/search?q=Marvel")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Collections search: {len(data['results'])} results")


# ==================== AUTHENTICATED ENDPOINTS ====================
class TestAuthenticatedEndpoints:
    """Tests for endpoints that require authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@wavewatch.com", "password": "WaveWatch2026!"}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    # ==================== ACHIEVEMENTS ====================
    def test_achievements_requires_auth(self):
        """Test achievements endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/achievements")
        assert response.status_code == 401
        print("✓ Achievements requires authentication")
    
    def test_achievements_authenticated(self, auth_token):
        """Test achievements endpoint with auth"""
        response = requests.get(
            f"{BASE_URL}/api/user/achievements",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "stats" in data
        assert isinstance(data["achievements"], list)
        # Verify achievement structure
        if len(data["achievements"]) > 0:
            achievement = data["achievements"][0]
            assert "id" in achievement
            assert "name" in achievement
            assert "description" in achievement
            assert "unlocked" in achievement
        print(f"✓ Achievements: {len(data['achievements'])} achievements, stats: {data['stats']}")
    
    # ==================== ADMIN CINEMA ROOMS ====================
    def test_admin_cinema_rooms_requires_auth(self):
        """Test admin cinema rooms requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/cinema-rooms")
        assert response.status_code == 401
        print("✓ Admin cinema rooms requires authentication")
    
    def test_admin_cinema_rooms_get(self, auth_token):
        """Test GET admin cinema rooms with auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cinema-rooms",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        print(f"✓ Admin cinema rooms GET: {len(data['rooms'])} rooms")
    
    def test_admin_cinema_rooms_create_and_delete(self, auth_token):
        """Test POST and DELETE admin cinema rooms"""
        # Create a room
        create_response = requests.post(
            f"{BASE_URL}/api/admin/cinema-rooms",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Salle Test",
                "movie_title": "Test Movie",
                "date": "2026-02-20",
                "time": "20:00",
                "capacity": 100
            }
        )
        assert create_response.status_code == 200
        data = create_response.json()
        assert "room" in data
        assert data["room"]["name"] == "TEST_Salle Test"
        assert "room_id" in data["room"]
        room_id = data["room"]["room_id"]
        print(f"✓ Admin cinema room created: {room_id}")
        
        # Verify room appears in list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/cinema-rooms",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert list_response.status_code == 200
        rooms = list_response.json()["rooms"]
        room_ids = [r["room_id"] for r in rooms]
        assert room_id in room_ids
        print("✓ Created room appears in list")
        
        # Delete the room
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/cinema-rooms/{room_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Admin cinema room deleted: {room_id}")
        
        # Verify room is deleted
        list_response2 = requests.get(
            f"{BASE_URL}/api/admin/cinema-rooms",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        rooms2 = list_response2.json()["rooms"]
        room_ids2 = [r["room_id"] for r in rooms2]
        assert room_id not in room_ids2
        print("✓ Deleted room no longer in list")
    
    # ==================== ADMIN STATS ====================
    def test_admin_stats(self, auth_token):
        """Test admin stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "vip_users" in data
        assert "total_feedback" in data
        assert "total_requests" in data
        assert "total_playlists" in data
        print(f"✓ Admin stats: {data['total_users']} users, {data['vip_users']} VIP")
    
    # ==================== ADMIN USERS ====================
    def test_admin_users(self, auth_token):
        """Test admin users endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
        print(f"✓ Admin users: {len(data['users'])} users")
    
    # ==================== ADMIN SITE SETTINGS (MODULES) ====================
    def test_admin_site_settings_get(self, auth_token):
        """Test GET admin site settings for home modules"""
        response = requests.get(f"{BASE_URL}/api/admin/site-settings/home_modules")
        assert response.status_code == 200
        data = response.json()
        assert "setting_key" in data
        print(f"✓ Admin site settings GET: {data}")
    
    def test_admin_site_settings_update(self, auth_token):
        """Test PUT admin site settings"""
        response = requests.put(
            f"{BASE_URL}/api/admin/site-settings",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "setting_key": "home_modules",
                "setting_value": {"hero": True, "trending_movies": True}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Admin site settings updated")
    
    # ==================== USER STATS ====================
    def test_user_stats(self, auth_token):
        """Test user stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/user/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "favorites" in data
        assert "watched" in data
        assert "playlists" in data
        print(f"✓ User stats: {data}")
    
    # ==================== VIP GAME STATUS ====================
    def test_vip_game_status(self, auth_token):
        """Test VIP game status with auth"""
        response = requests.get(
            f"{BASE_URL}/api/vip-game/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "played_today" in data
        print(f"✓ VIP game status: played_today={data['played_today']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
