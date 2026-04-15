#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WaveWatchAPITester:
    def __init__(self, base_url="https://code-monitor-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_api_call(self, method, endpoint, expected_status=200, data=None, headers=None, description=""):
        """Generic API test method"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {"Content-Type": "application/json"}
        if headers:
            test_headers.update(headers)
        
        try:
            if method == "GET":
                response = self.session.get(url, headers=test_headers, timeout=10)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=test_headers, timeout=10)
            elif method == "PUT":
                response = self.session.put(url, json=data, headers=test_headers, timeout=10)
            elif method == "DELETE":
                response = self.session.delete(url, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(f"{method} {endpoint} {description}", success, details)
            return success, response
            
        except Exception as e:
            self.log_test(f"{method} {endpoint} {description}", False, f"Exception: {str(e)}")
            return False, None

    def test_admin_login(self):
        """Test admin login and store token"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.test_api_call(
            "POST", "/api/auth/login", 200,
            {"email": "admin@wavewatch.com", "password": "WaveWatch2026!"},
            description="(Admin Login)"
        )
        
        if success and response:
            try:
                data = response.json()
                self.admin_token = data.get("token")
                # Store cookies for session-based auth
                self.session.cookies.update(response.cookies)
                return True
            except:
                self.log_test("Admin Login Token Extraction", False, "Failed to extract token")
                return False
        return False

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        if not self.admin_token:
            print("❌ Skipping admin tests - no admin token")
            return

        print("\n👑 Testing Admin Endpoints...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test admin stats
        self.test_api_call("GET", "/api/admin/enhanced-stats", 200, headers=auth_headers, description="(Enhanced Stats)")
        
        # Test admin users
        self.test_api_call("GET", "/api/admin/users", 200, headers=auth_headers, description="(Users List)")
        
        # Test site settings
        self.test_api_call("GET", "/api/admin/site-settings/home_modules", 200, headers=auth_headers, description="(Home Modules Settings)")

    def test_content_endpoints(self):
        """Test content retrieval endpoints"""
        print("\n📺 Testing Content Endpoints...")
        
        # Test TV channels
        self.test_api_call("GET", "/api/tv-channels", 200, description="(TV Channels)")
        
        # Test radio stations  
        self.test_api_call("GET", "/api/radio-stations", 200, description="(Radio Stations)")
        
        # Test music content
        self.test_api_call("GET", "/api/music", 200, description="(Music Content)")
        
        # Test games
        self.test_api_call("GET", "/api/games", 200, description="(Games)")
        
        # Test software
        self.test_api_call("GET", "/api/software", 200, description="(Software)")
        
        # Test ebooks
        self.test_api_call("GET", "/api/ebooks", 200, description="(Ebooks)")

    def test_vip_codes_system(self):
        """Test VIP codes system"""
        if not self.admin_token:
            print("❌ Skipping VIP codes tests - no admin token")
            return

        print("\n👑 Testing VIP Codes System...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test getting VIP codes
        self.test_api_call("GET", "/api/admin/vip-codes", 200, headers=auth_headers, description="(Get VIP Codes)")
        
        # Test generating a VIP code
        self.test_api_call("POST", "/api/admin/vip-codes", 200, 
                          {"type": "vip"}, headers=auth_headers, description="(Generate VIP Code)")

    def test_tmdb_endpoints(self):
        """Test TMDB proxy endpoints"""
        print("\n🎬 Testing TMDB Endpoints...")
        
        # Test trending movies
        self.test_api_call("GET", "/api/tmdb/trending/movies", 200, description="(Trending Movies)")
        
        # Test trending TV
        self.test_api_call("GET", "/api/tmdb/trending/tv", 200, description="(Trending TV)")
        
        # Test popular movies
        self.test_api_call("GET", "/api/tmdb/popular/movies", 200, description="(Popular Movies)")

    def test_discover_endpoints_with_filters(self):
        """Test TMDB discover endpoints with new filter parameters"""
        print("\n🔍 Testing TMDB Discover Endpoints with Filters...")
        
        # Test basic movie discovery
        self.test_api_call("GET", "/api/tmdb/discover/movie", 200, description="(Basic Movie Discovery)")
        
        # Test movie discovery with provider filter (Netflix = 8)
        self.test_api_call("GET", "/api/tmdb/discover/movie?provider=8", 200, description="(Movies with Netflix Provider)")
        
        # Test movie discovery with year filter
        self.test_api_call("GET", "/api/tmdb/discover/movie?year=2023", 200, description="(Movies from 2023)")
        
        # Test movie discovery with sort parameter
        self.test_api_call("GET", "/api/tmdb/discover/movie?sort_by=vote_average.desc", 200, description="(Movies sorted by rating)")
        
        # Test movie discovery with combined filters
        self.test_api_call("GET", "/api/tmdb/discover/movie?provider=8&year=2023&sort_by=popularity.desc", 200, description="(Movies with combined filters)")
        
        # Test basic TV discovery
        self.test_api_call("GET", "/api/tmdb/discover/tv", 200, description="(Basic TV Discovery)")
        
        # Test TV discovery with provider filter (Netflix = 8)
        self.test_api_call("GET", "/api/tmdb/discover/tv?provider=8", 200, description="(TV Shows with Netflix Provider)")
        
        # Test TV discovery with year filter
        self.test_api_call("GET", "/api/tmdb/discover/tv?year=2023", 200, description="(TV Shows from 2023)")
        
        # Test TV discovery with sort parameter
        self.test_api_call("GET", "/api/tmdb/discover/tv?sort_by=vote_average.desc", 200, description="(TV Shows sorted by rating)")
        
        # Test TV discovery with combined filters
        self.test_api_call("GET", "/api/tmdb/discover/tv?provider=8&year=2023&sort_by=popularity.desc", 200, description="(TV Shows with combined filters)")
        
        # Test genre endpoints
        self.test_api_call("GET", "/api/tmdb/genres/movie", 200, description="(Movie Genres)")
        self.test_api_call("GET", "/api/tmdb/genres/tv", 200, description="(TV Genres)")

    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test health check
        self.test_api_call("GET", "/api/health", 200, description="(Health Check)")
        
        # Test feedback stats
        self.test_api_call("GET", "/api/feedback/stats", 200, description="(Feedback Stats)")
        
        # Test public playlists
        self.test_api_call("GET", "/api/playlists/public/discover", 200, description="(Public Playlists)")

    def test_watch_party_removal(self):
        """Test that Watch Party endpoints are removed"""
        print("\n🚫 Testing Watch Party Removal...")
        
        # Test that watch party endpoints should return 404 or 405 (not found/method not allowed)
        self.test_api_call("GET", "/api/watch-party", 404, description="(Watch Party List - Should be removed)")
        self.test_api_call("POST", "/api/watch-party", 404, description="(Create Watch Party - Should be removed)")
        self.test_api_call("GET", "/api/watch-party/my", 404, description="(My Parties - Should be removed)")

    def test_ratings_endpoints(self):
        """Test ratings/counts endpoints for like/dislike functionality"""
        print("\n👍 Testing Ratings Endpoints...")
        
        # Test ratings counts endpoint (should work for any content)
        self.test_api_call("GET", "/api/ratings/counts?content_id=550&content_type=movie", 200, description="(Ratings Counts)")
        
        # Test with different content types
        self.test_api_call("GET", "/api/ratings/counts?content_id=1399&content_type=tv", 200, description="(TV Ratings Counts)")
        
        # Test with missing parameters (should handle gracefully)
        self.test_api_call("GET", "/api/ratings/counts", 200, description="(Ratings Counts - No params)")

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting WaveWatch API Tests...")
        print(f"🔗 Base URL: {self.base_url}")
        
        # Test public endpoints first
        self.test_public_endpoints()
        
        # Test TMDB endpoints
        self.test_tmdb_endpoints()
        
        # Test TMDB discover endpoints with filters
        self.test_discover_endpoints_with_filters()
        
        # Test admin login
        if self.test_admin_login():
            # Test admin endpoints
            self.test_admin_endpoints()
            # Test VIP codes system
            self.test_vip_codes_system()
        
        # Test content endpoints
        self.test_content_endpoints()
        
        # Test Watch Party removal
        self.test_watch_party_removal()
        
        # Test ratings endpoints
        self.test_ratings_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print(f"\n💥 Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WaveWatchAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())