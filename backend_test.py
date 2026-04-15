#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WaveWatchAPITester:
    def __init__(self, base_url="https://wavewatch-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_notifications_endpoints(self):
        """Test notification endpoints"""
        print("\n📢 Testing Notification Endpoints...")
        
        # Get notifications
        self.run_test("Get Notifications", "GET", "api/notifications", 200)
        
        # Mark all as read
        self.run_test("Mark All Notifications Read", "PUT", "api/notifications/read-all", 200)

    def test_recommendations_endpoint(self):
        """Test user recommendations"""
        return self.run_test("User Recommendations", "GET", "api/user/recommendations", 200)

    def test_playlists_enhanced(self):
        """Test enhanced playlists endpoint"""
        return self.run_test("Enhanced Public Playlists", "GET", "api/playlists/public/enhanced", 200)

    def test_content_endpoints(self):
        """Test content endpoints for Music, Games, Ebooks, Software"""
        print("\n🎵 Testing Content Endpoints...")
        
        # Music
        self.run_test("Get Music Items", "GET", "api/music", 200)
        
        # Games  
        self.run_test("Get Games Items", "GET", "api/games", 200)
        
        # Ebooks
        self.run_test("Get Ebooks Items", "GET", "api/ebooks", 200)
        
        # Software
        self.run_test("Get Software Items", "GET", "api/software", 200)

    def test_tv_channels(self):
        """Test TV channels endpoint"""
        return self.run_test("Get TV Channels", "GET", "api/tv-channels", 200)

    def test_tmdb_endpoints(self):
        """Test TMDB proxy endpoints"""
        print("\n🎬 Testing TMDB Endpoints...")
        
        self.run_test("TMDB Trending Movies", "GET", "api/tmdb/trending/movies", 200)
        self.run_test("TMDB Trending TV", "GET", "api/tmdb/trending/tv", 200)
        self.run_test("TMDB Popular Movies", "GET", "api/tmdb/popular/movies", 200)

    def test_user_endpoints(self):
        """Test user-specific endpoints"""
        print("\n👤 Testing User Endpoints...")
        
        self.run_test("Get User Profile", "GET", "api/auth/me", 200)
        self.run_test("Get User Favorites", "GET", "api/user/favorites", 200)
        self.run_test("Get User History", "GET", "api/user/history", 200)
        self.run_test("Get User Stats", "GET", "api/user/stats", 200)

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n🔧 Testing Admin Endpoints...")
        
        self.run_test("Admin Stats", "GET", "api/admin/stats", 200)
        self.run_test("Admin Enhanced Stats", "GET", "api/admin/enhanced-stats", 200)
        self.run_test("Admin Users List", "GET", "api/admin/users", 200)

def main():
    print("🌊 WaveWatch API Testing Suite")
    print("=" * 50)
    
    # Setup
    tester = WaveWatchAPITester()
    
    # Test health first
    print("\n🏥 Testing Basic Connectivity...")
    success, _ = tester.test_health_check()
    if not success:
        print("❌ Health check failed, stopping tests")
        return 1

    # Test login
    print("\n🔐 Testing Authentication...")
    if not tester.test_login("admin@wavewatch.com", "WaveWatch2026!"):
        print("❌ Login failed, stopping authenticated tests")
        return 1

    # Test all endpoints
    tester.test_notifications_endpoints()
    tester.test_recommendations_endpoint()
    tester.test_playlists_enhanced()
    tester.test_content_endpoints()
    tester.test_tv_channels()
    tester.test_tmdb_endpoints()
    tester.test_user_endpoints()
    tester.test_admin_endpoints()

    # Print results
    print(f"\n📊 Test Results")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())