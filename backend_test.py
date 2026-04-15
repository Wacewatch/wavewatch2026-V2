#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WaveWatchAPITester:
    def __init__(self, base_url="https://wavewatch-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        details += f", Error: {error_data['detail']}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "ok"}
            return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "/api/health", 200)

    def test_admin_login(self):
        """Test admin login"""
        response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "admin@wavewatch.com", "password": "WaveWatch2026!"}
        )
        if response and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data=test_user
        )
        
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_user_login(self):
        """Test user login with registered user"""
        timestamp = datetime.now().strftime("%H%M%S")
        response = self.run_test(
            "User Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": f"test_{timestamp}@example.com", "password": "TestPass123!"}
        )
        return response and 'token' in response

    def test_auth_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "/api/auth/me", 200)

    def test_tmdb_endpoints(self):
        """Test TMDB proxy endpoints"""
        endpoints = [
            ("/api/tmdb/trending/movies", "Trending Movies"),
            ("/api/tmdb/trending/tv", "Trending TV"),
            ("/api/tmdb/trending/anime", "Trending Anime"),
            ("/api/tmdb/popular/movies", "Popular Movies"),
            ("/api/tmdb/popular/tv", "Popular TV"),
            ("/api/tmdb/search?q=avengers", "Search Movies"),
            ("/api/tmdb/genres/movie", "Movie Genres"),
            ("/api/tmdb/discover/movie", "Discover Movies")
        ]
        
        for endpoint, name in endpoints:
            self.run_test(f"TMDB - {name}", "GET", endpoint, 200)

    def test_movie_details(self):
        """Test movie details endpoint"""
        # Test with a popular movie ID (Avengers: Endgame)
        self.run_test("Movie Details", "GET", "/api/tmdb/movie/299534", 200)

    def test_favorites(self):
        """Test favorites functionality"""
        if not self.token:
            self.log_test("Favorites Test", False, "No auth token available")
            return

        # Get favorites
        self.run_test("Get Favorites", "GET", "/api/user/favorites", 200)
        
        # Add to favorites
        favorite_data = {
            "content_id": 299534,
            "content_type": "movie",
            "title": "Avengers: Endgame",
            "poster_path": "/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
        }
        self.run_test("Add to Favorites", "POST", "/api/user/favorites", 200, data=favorite_data)
        
        # Check if favorite
        self.run_test("Check Favorite", "GET", "/api/user/favorites/check?content_id=299534&content_type=movie", 200)

    def test_playlists(self):
        """Test playlist functionality"""
        if not self.token:
            self.log_test("Playlists Test", False, "No auth token available")
            return

        # Get playlists
        self.run_test("Get Playlists", "GET", "/api/playlists", 200)
        
        # Create playlist
        playlist_data = {
            "name": "Test Playlist",
            "description": "A test playlist",
            "is_public": False
        }
        response = self.run_test("Create Playlist", "POST", "/api/playlists", 200, data=playlist_data)
        
        if response and 'playlist' in response:
            playlist_id = response['playlist']['_id']
            # Get specific playlist
            self.run_test("Get Specific Playlist", "GET", f"/api/playlists/{playlist_id}", 200)

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            self.log_test("Admin Endpoints Test", False, "No admin token available")
            return

        # Use admin token for these tests
        old_token = self.token
        self.token = self.admin_token
        
        # Test admin endpoints
        self.run_test("Admin - Get Users", "GET", "/api/admin/users", 200)
        self.run_test("Admin - Get Stats", "GET", "/api/admin/stats", 200)
        
        # Restore original token
        self.token = old_token

    def test_content_requests(self):
        """Test content requests"""
        if not self.token:
            self.log_test("Content Requests Test", False, "No auth token available")
            return

        # Get content requests
        self.run_test("Get Content Requests", "GET", "/api/content-requests", 200)
        
        # Create content request
        request_data = {
            "title": "Test Movie Request",
            "content_type": "movie",
            "description": "A test movie request"
        }
        self.run_test("Create Content Request", "POST", "/api/content-requests", 200, data=request_data)

    def test_feedback(self):
        """Test feedback system"""
        feedback_data = {
            "content": 5,
            "functionality": 4,
            "design": 5,
            "message": "Great platform!"
        }
        self.run_test("Submit Feedback", "POST", "/api/feedback", 200, data=feedback_data)
        self.run_test("Get Feedback Stats", "GET", "/api/feedback/stats", 200)

    def test_tv_channels_and_radio(self):
        """Test TV channels and radio endpoints"""
        self.run_test("Get TV Channels", "GET", "/api/tv-channels", 200)
        self.run_test("Get Radio Stations", "GET", "/api/radio-stations", 200)

    def test_ebooks_and_software(self):
        """Test ebooks and software endpoints"""
        self.run_test("Get Ebooks", "GET", "/api/ebooks", 200)
        self.run_test("Get Software", "GET", "/api/software", 200)

    def test_retrogaming(self):
        """Test retrogaming endpoint"""
        self.run_test("Get Retrogaming", "GET", "/api/retrogaming", 200)

    def test_new_endpoints(self):
        """Test new endpoints added in this iteration"""
        if not self.token:
            self.log_test("New Endpoints Test", False, "No auth token available")
            return

        # Test heartbeat endpoint
        self.run_test("User Heartbeat", "POST", "/api/user/heartbeat", 200)
        
        # Test status batch endpoint
        self.run_test("User Status Batch", "GET", "/api/user/status-batch", 200)
        
        # Test change password endpoint (with dummy data)
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        # This should fail with wrong current password, but endpoint should exist
        self.run_test("Change Password Endpoint", "PUT", "/api/user/change-password", 400, data=password_data)
        
        # Test activation code endpoint (with dummy code)
        activation_data = {"code": "DUMMY_CODE"}
        # This should fail with invalid code, but endpoint should exist
        self.run_test("Activate Code Endpoint", "POST", "/api/user/activate-code", 400, data=activation_data)

    def test_admin_new_endpoints(self):
        """Test new admin endpoints"""
        if not self.admin_token:
            self.log_test("Admin New Endpoints Test", False, "No admin token available")
            return

        # Use admin token for these tests
        old_token = self.token
        self.token = self.admin_token
        
        # Test online users endpoint
        self.run_test("Admin - Online Users", "GET", "/api/admin/online-users", 200)
        
        # Test enhanced stats endpoint
        self.run_test("Admin - Enhanced Stats", "GET", "/api/admin/enhanced-stats", 200)
        
        # Restore original token
        self.token = old_token

    def test_ratings_endpoints(self):
        """Test like/dislike ratings functionality"""
        if not self.token:
            self.log_test("Ratings Test", False, "No auth token available")
            return

        # Test rating a movie
        rating_data = {
            "content_id": 299534,
            "content_type": "movie",
            "rating": "like"
        }
        self.run_test("Rate Content (Like)", "POST", "/api/user/ratings", 200, data=rating_data)
        
        # Check rating
        self.run_test("Check Rating", "GET", "/api/user/ratings/check?content_id=299534&content_type=movie", 200)
        
        # Test dislike
        rating_data["rating"] = "dislike"
        self.run_test("Rate Content (Dislike)", "POST", "/api/user/ratings", 200, data=rating_data)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting WaveWatch API Tests...")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic tests
        self.test_health_check()
        
        # Auth tests
        self.test_admin_login()
        self.test_user_registration()
        self.test_auth_me()
        
        # TMDB tests
        self.test_tmdb_endpoints()
        self.test_movie_details()
        
        # User feature tests
        self.test_favorites()
        self.test_playlists()
        self.test_content_requests()
        
        # Admin tests
        self.test_admin_endpoints()
        
        # Content tests
        self.test_feedback()
        self.test_tv_channels_and_radio()
        self.test_ebooks_and_software()
        self.test_retrogaming()
        
        # New feature tests
        self.test_new_endpoints()
        self.test_admin_new_endpoints()
        self.test_ratings_endpoints()

        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = WaveWatchAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())