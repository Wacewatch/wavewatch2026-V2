"""
Backend tests for WaveWatch iteration 16 features:
- DELETE /api/notifications/{id} endpoint
- Notification endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-monitor-7.preview.emergentagent.com')

class TestHealth:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "WaveWatch"
        print("✓ Health endpoint working")


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_login(self, auth_session):
        """Test login endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "admin@wavewatch.com"
        print("✓ Login and /me endpoint working")


class TestNotifications:
    """Notification endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert response.status_code == 200
        return session
    
    def test_get_notifications(self, auth_session):
        """Test GET /api/notifications endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        print(f"✓ GET /api/notifications working - {len(data['notifications'])} notifications")
    
    def test_mark_all_read(self, auth_session):
        """Test PUT /api/notifications/read-all endpoint"""
        response = auth_session.put(f"{BASE_URL}/api/notifications/read-all")
        assert response.status_code == 200
        print("✓ PUT /api/notifications/read-all working")
    
    def test_delete_notification_endpoint_exists(self, auth_session):
        """Test DELETE /api/notifications/{id} endpoint exists and responds"""
        # Use a fake ObjectId format
        fake_id = "000000000000000000000000"
        response = auth_session.delete(f"{BASE_URL}/api/notifications/{fake_id}")
        # Should return 200 (even if notification doesn't exist, it's a no-op)
        assert response.status_code == 200
        print("✓ DELETE /api/notifications/{id} endpoint exists and responds")


class TestTMDBProxy:
    """TMDB proxy endpoint tests"""
    
    def test_trending_movies(self):
        """Test trending movies endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending movies: {len(data.get('results', []))} results")
    
    def test_trending_tv(self):
        """Test trending TV endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending TV: {len(data.get('results', []))} results")
    
    def test_on_the_air(self):
        """Test on-the-air endpoint (used for Prochaines Sorties)"""
        response = requests.get(f"{BASE_URL}/api/tmdb/on-the-air")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ On the air: {len(data.get('results', []))} results")
    
    def test_tv_details(self):
        """Test TV details endpoint (used for S/E info)"""
        # Use a known TV show ID (The Boys = 76479)
        response = requests.get(f"{BASE_URL}/api/tmdb/tv/76479")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data or "id" in data
        # Check for next_episode_to_air or last_episode_to_air
        has_episode_info = "next_episode_to_air" in data or "last_episode_to_air" in data
        print(f"✓ TV details endpoint working - has episode info: {has_episode_info}")
    
    def test_popular_persons(self):
        """Test popular persons endpoint (used for Acteurs Tendance)"""
        response = requests.get(f"{BASE_URL}/api/tmdb/popular/persons")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Popular persons: {len(data.get('results', []))} results")
    
    def test_collections_search(self):
        """Test collections search endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/collections/search?q=Marvel")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Collections search: {len(data.get('results', []))} results")


class TestTVChannels:
    """TV Channels endpoint tests"""
    
    def test_get_tv_channels(self):
        """Test GET /api/tv-channels endpoint"""
        response = requests.get(f"{BASE_URL}/api/tv-channels")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        print(f"✓ TV channels: {len(data['channels'])} channels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
