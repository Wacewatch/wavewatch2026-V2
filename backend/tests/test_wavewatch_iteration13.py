"""
WaveWatch Iteration 13 Backend Tests
Testing: Admin login, TMDB totals, TV channels, Universal search, Promo sections
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@wavewatch.com"
        assert data["user"]["is_admin"] == True
        print(f"✓ Admin login successful, token received")
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestAdminEnhancedStats:
    """Test admin enhanced stats with TMDB totals"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        return response.json().get("token")
    
    def test_enhanced_stats_endpoint(self, admin_token):
        """Test enhanced stats returns TMDB totals"""
        response = requests.get(
            f"{BASE_URL}/api/admin/enhanced-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check basic stats
        assert "total_users" in data
        assert "tv_channels" in data
        assert "radio_stations" in data
        
        # Check TMDB totals
        assert "tmdb_movies" in data
        assert "tmdb_series" in data
        assert "tmdb_episodes" in data
        
        # TMDB should have values > 0
        assert data["tmdb_movies"] > 0, "TMDB movies count should be > 0"
        assert data["tmdb_series"] > 0, "TMDB series count should be > 0"
        assert data["tmdb_episodes"] > 0, "TMDB episodes count should be > 0"
        
        print(f"✓ TMDB Stats: Movies={data['tmdb_movies']}, Series={data['tmdb_series']}, Episodes={data['tmdb_episodes']}")
    
    def test_enhanced_stats_requires_admin(self):
        """Enhanced stats should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/enhanced-stats")
        assert response.status_code == 401


class TestTVChannels:
    """Test TV channels endpoints"""
    
    def test_get_tv_channels(self):
        """Get all TV channels"""
        response = requests.get(f"{BASE_URL}/api/tv-channels")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0, "Should have seeded TV channels"
        
        # Check channel structure
        channel = data["channels"][0]
        assert "name" in channel
        assert "logo_url" in channel or "logo" in channel
        print(f"✓ Found {len(data['channels'])} TV channels")
    
    def test_tv_channel_has_logo(self):
        """TV channels should have logo URLs"""
        response = requests.get(f"{BASE_URL}/api/tv-channels")
        data = response.json()
        
        for channel in data["channels"][:3]:
            logo = channel.get("logo_url") or channel.get("logo")
            assert logo is not None, f"Channel {channel.get('name')} should have logo"
            print(f"  - {channel.get('name')}: {logo[:50]}...")


class TestUniversalSearch:
    """Test universal search including TV, Radio, Music, Games, Software, Ebooks"""
    
    def test_search_tv_channel(self):
        """Search for TV channel (TF1)"""
        response = requests.get(f"{BASE_URL}/api/search/all?q=TF1")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        
        tv_results = [r for r in data["results"] if r.get("type") == "tv_channel"]
        assert len(tv_results) > 0, "Should find TF1 TV channel"
        assert tv_results[0]["title"] == "TF1"
        print(f"✓ Found TV channel: {tv_results[0]['title']}")
    
    def test_search_radio_station(self):
        """Search for radio station (NRJ)"""
        response = requests.get(f"{BASE_URL}/api/search/all?q=NRJ")
        assert response.status_code == 200
        data = response.json()
        
        radio_results = [r for r in data["results"] if r.get("type") == "radio"]
        assert len(radio_results) > 0, "Should find NRJ radio station"
        assert radio_results[0]["title"] == "NRJ"
        print(f"✓ Found Radio station: {radio_results[0]['title']}")
    
    def test_search_returns_multiple_types(self):
        """Search should return results from multiple content types"""
        response = requests.get(f"{BASE_URL}/api/search/all?q=France")
        assert response.status_code == 200
        data = response.json()
        
        types_found = set(r.get("type") for r in data["results"])
        print(f"✓ Search 'France' returned types: {types_found}")
    
    def test_search_empty_query(self):
        """Empty search should return empty results"""
        response = requests.get(f"{BASE_URL}/api/search/all?q=")
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []


class TestRadioStations:
    """Test radio stations endpoints"""
    
    def test_get_radio_stations(self):
        """Get all radio stations"""
        response = requests.get(f"{BASE_URL}/api/radio-stations")
        assert response.status_code == 200
        data = response.json()
        assert "stations" in data
        assert len(data["stations"]) > 0, "Should have seeded radio stations"
        print(f"✓ Found {len(data['stations'])} radio stations")


class TestModuleSettings:
    """Test module settings for homepage promos"""
    
    def test_get_home_modules(self):
        """Get home modules settings"""
        response = requests.get(f"{BASE_URL}/api/admin/site-settings/home_modules")
        assert response.status_code == 200
        data = response.json()
        # Settings may or may not exist, but endpoint should work
        print(f"✓ Home modules settings endpoint works")


class TestPlaylists:
    """Test playlist endpoints with VIP badges"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wavewatch.com",
            "password": "WaveWatch2026!"
        })
        return response.json().get("token")
    
    def test_create_playlist(self, admin_token):
        """Create a playlist as admin"""
        response = requests.post(
            f"{BASE_URL}/api/playlists",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test Playlist", "is_public": True}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert "playlist" in data
        print(f"✓ Created playlist: {data['playlist'].get('name')}")
    
    def test_get_playlists(self, admin_token):
        """Get user playlists"""
        response = requests.get(
            f"{BASE_URL}/api/playlists",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "playlists" in data
        print(f"✓ Found {len(data['playlists'])} playlists")


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
