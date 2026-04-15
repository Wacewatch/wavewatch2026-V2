"""
WaveWatch Iteration 14 Backend Tests
Testing: Collections, Calendar, On-the-air endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-monitor-7.preview.emergentagent.com')

class TestHealthAndBasicEndpoints:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "WaveWatch"
        print("✓ Health endpoint working")

class TestTMDBEndpoints:
    """TMDB proxy endpoint tests"""
    
    def test_on_the_air_endpoint(self):
        """Test /api/tmdb/on-the-air endpoint - NEW for iteration 14"""
        response = requests.get(f"{BASE_URL}/api/tmdb/on-the-air")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        # Verify TV show structure
        first_show = data["results"][0]
        assert "id" in first_show
        assert "name" in first_show or "original_name" in first_show
        assert "first_air_date" in first_show or "overview" in first_show
        print(f"✓ On-the-air endpoint returns {len(data['results'])} TV shows")
    
    def test_upcoming_tv_endpoint(self):
        """Test /api/tmdb/upcoming/tv endpoint - NEW for iteration 14"""
        response = requests.get(f"{BASE_URL}/api/tmdb/upcoming/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Upcoming TV endpoint returns {len(data.get('results', []))} shows")
    
    def test_upcoming_movies_endpoint(self):
        """Test /api/tmdb/upcoming/movies endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/upcoming/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        # Verify movie structure
        first_movie = data["results"][0]
        assert "id" in first_movie
        assert "title" in first_movie or "original_title" in first_movie
        assert "release_date" in first_movie
        print(f"✓ Upcoming movies endpoint returns {len(data['results'])} movies")
    
    def test_upcoming_movies_page_2(self):
        """Test /api/tmdb/upcoming/movies with page parameter"""
        response = requests.get(f"{BASE_URL}/api/tmdb/upcoming/movies?page=2")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data.get("page") == 2 or len(data["results"]) > 0
        print(f"✓ Upcoming movies page 2 returns {len(data.get('results', []))} movies")

class TestCollectionsEndpoints:
    """Collection-related endpoint tests"""
    
    def test_collection_search(self):
        """Test /api/tmdb/collections/search endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/collections/search?q=Star Wars")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        # Verify collection structure
        first_collection = data["results"][0]
        assert "id" in first_collection
        assert "name" in first_collection
        print(f"✓ Collection search returns {len(data['results'])} results for 'Star Wars'")
    
    def test_collection_detail(self):
        """Test /api/tmdb/collection/{id} endpoint - Star Wars collection"""
        collection_id = 10  # Star Wars collection
        response = requests.get(f"{BASE_URL}/api/tmdb/collection/{collection_id}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "parts" in data
        assert len(data["parts"]) > 0
        # Verify movie parts structure
        first_part = data["parts"][0]
        assert "id" in first_part
        assert "title" in first_part
        print(f"✓ Collection detail returns '{data['name']}' with {len(data['parts'])} movies")
    
    def test_collection_detail_marvel(self):
        """Test collection detail for Marvel collection"""
        # Search for Marvel collection first
        search_response = requests.get(f"{BASE_URL}/api/tmdb/collections/search?q=Marvel")
        assert search_response.status_code == 200
        search_data = search_response.json()
        if search_data.get("results"):
            collection_id = search_data["results"][0]["id"]
            response = requests.get(f"{BASE_URL}/api/tmdb/collection/{collection_id}")
            assert response.status_code == 200
            data = response.json()
            assert "parts" in data
            print(f"✓ Marvel collection '{data.get('name')}' has {len(data.get('parts', []))} movies")
        else:
            print("⚠ Marvel collection not found in search")
    
    def test_collection_detail_harry_potter(self):
        """Test collection detail for Harry Potter collection"""
        search_response = requests.get(f"{BASE_URL}/api/tmdb/collections/search?q=Harry Potter")
        assert search_response.status_code == 200
        search_data = search_response.json()
        if search_data.get("results"):
            collection_id = search_data["results"][0]["id"]
            response = requests.get(f"{BASE_URL}/api/tmdb/collection/{collection_id}")
            assert response.status_code == 200
            data = response.json()
            assert "parts" in data
            print(f"✓ Harry Potter collection '{data.get('name')}' has {len(data.get('parts', []))} movies")
        else:
            print("⚠ Harry Potter collection not found in search")

class TestTrendingEndpoints:
    """Trending content endpoint tests"""
    
    def test_trending_movies(self):
        """Test trending movies endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/movies")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        print(f"✓ Trending movies returns {len(data['results'])} movies")
    
    def test_trending_tv(self):
        """Test trending TV shows endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/tv")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        print(f"✓ Trending TV shows returns {len(data['results'])} shows")
    
    def test_trending_anime(self):
        """Test trending anime endpoint"""
        response = requests.get(f"{BASE_URL}/api/tmdb/trending/anime")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Trending anime returns {len(data.get('results', []))} anime")

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_with_valid_credentials(self):
        """Test login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == "admin@wavewatch.com"
        print("✓ Admin login successful")
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")

class TestMovieDetailEndpoints:
    """Movie detail endpoint tests"""
    
    def test_movie_detail(self):
        """Test movie detail endpoint"""
        movie_id = 11  # Star Wars: A New Hope
        response = requests.get(f"{BASE_URL}/api/tmdb/movie/{movie_id}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "title" in data
        assert "overview" in data
        print(f"✓ Movie detail returns '{data.get('title')}'")
    
    def test_tv_detail(self):
        """Test TV show detail endpoint"""
        tv_id = 76479  # The Boys
        response = requests.get(f"{BASE_URL}/api/tmdb/tv/{tv_id}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        print(f"✓ TV detail returns '{data.get('name')}'")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
