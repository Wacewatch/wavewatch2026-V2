"""
WaveWatch API Tests - Iteration 2
Tests for navigation pages, auth, and TMDB integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")
    
    def test_feedback_stats(self):
        """Test feedback stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/feedback/stats")
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        print("✓ Feedback stats endpoint working")


class TestTMDBIntegration:
    """TMDB API integration tests"""
    
    def test_trending_movies(self):
        """Test trending movies endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        print(f"✓ Trending movies: {len(data['results'])} results")
    
    def test_trending_tv(self):
        """Test trending TV shows endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending TV: {len(data['results'])} results")
    
    def test_trending_anime(self):
        """Test trending anime endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/anime")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending anime: {len(data['results'])} results")
    
    def test_popular_movies(self):
        """Test popular movies endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Popular movies: {len(data['results'])} results")
    
    def test_popular_tv(self):
        """Test popular TV shows endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Popular TV: {len(data['results'])} results")
    
    def test_popular_persons(self):
        """Test popular persons endpoint for Actors page"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/persons")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        # Verify actor data structure
        actor = data["results"][0]
        assert "id" in actor
        assert "name" in actor
        print(f"✓ Popular persons: {len(data['results'])} results")
    
    def test_upcoming_movies(self):
        """Test upcoming movies endpoint for Calendar page"""
        response = requests.get(f"{BASE_URL}/api/tmdb/upcoming/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Upcoming movies: {len(data['results'])} results")
    
    def test_movie_genres(self):
        """Test movie genres endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/genres/movie")
        assert response.status_code == 200
        data = response.json()
        assert "genres" in data
        print(f"✓ Movie genres: {len(data['genres'])} genres")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_auth_me_unauthorized(self):
        """Test /auth/me returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me returns 401 when not authenticated")
    
    def test_login_success(self):
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
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code in [401, 400]
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me with valid token"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@wavewatch.com", "password": "WaveWatch2026!"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Now test /auth/me with token
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Response is {"user": {...}}
        assert "user" in data
        assert data["user"]["email"] == "admin@wavewatch.com"
        print("✓ Auth me with token working")


class TestVIPGame:
    """VIP Game endpoint tests"""
    
    def test_vip_game_winners(self):
        """Test VIP game winners endpoint"""
        response = requests.get(f"{BASE_URL}/api/vip-game/winners")
        assert response.status_code == 200
        data = response.json()
        assert "winners" in data
        print(f"✓ VIP game winners: {len(data['winners'])} winners")
    
    def test_vip_game_status_unauthorized(self):
        """Test VIP game status requires auth"""
        response = requests.get(f"{BASE_URL}/api/vip-game/status")
        assert response.status_code == 401
        print("✓ VIP game status requires authentication")


class TestUserEndpoints:
    """User-related endpoint tests"""
    
    def test_user_history_unauthorized(self):
        """Test user history requires auth"""
        response = requests.get(f"{BASE_URL}/api/user/history")
        assert response.status_code == 401
        print("✓ User history requires authentication")
    
    def test_user_playlists_unauthorized(self):
        """Test user playlists requires auth"""
        response = requests.get(f"{BASE_URL}/api/playlists")
        assert response.status_code == 401
        print("✓ User playlists requires authentication")


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
    
    def test_vip_game_status_authenticated(self, auth_token):
        """Test VIP game status with auth"""
        response = requests.get(
            f"{BASE_URL}/api/vip-game/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "played_today" in data
        print("✓ VIP game status accessible when authenticated")
    
    def test_user_history_authenticated(self, auth_token):
        """Test user history with auth"""
        response = requests.get(
            f"{BASE_URL}/api/user/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        print("✓ User history accessible when authenticated")
    
    def test_playlists_authenticated(self, auth_token):
        """Test playlists with auth"""
        response = requests.get(
            f"{BASE_URL}/api/playlists",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "playlists" in data or isinstance(data, list)
        print("✓ Playlists accessible when authenticated")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
