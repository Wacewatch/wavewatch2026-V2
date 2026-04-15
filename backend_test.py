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

    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test health check
        self.test_api_call("GET", "/api/health", 200, description="(Health Check)")
        
        # Test feedback stats
        self.test_api_call("GET", "/api/feedback/stats", 200, description="(Feedback Stats)")
        
        # Test public playlists
        self.test_api_call("GET", "/api/playlists/public/discover", 200, description="(Public Playlists)")

    def test_watch_party_endpoints(self):
        """Test Watch Party (Soiree Cine) endpoints"""
        if not self.admin_token:
            print("❌ Skipping Watch Party tests - no admin token")
            return

        print("\n🎬 Testing Watch Party Endpoints...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}
        party_id = None
        room_code = None

        # Test 1: List public watch parties (should work without auth)
        self.test_api_call("GET", "/api/watch-party", 200, description="(List Public Parties)")

        # Test 2: Get user's parties (requires auth)
        self.test_api_call("GET", "/api/watch-party/my", 200, headers=auth_headers, description="(Get My Parties)")

        # Test 3: Create a new watch party (requires auth)
        party_data = {
            "title": "Test Movie Night",
            "content_id": 550,  # Fight Club
            "content_type": "movie",
            "content_title": "Fight Club",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "max_guests": 5,
            "is_public": True
        }
        success, response = self.test_api_call("POST", "/api/watch-party", 200, party_data, headers=auth_headers, description="(Create Party)")
        
        if success and response:
            try:
                data = response.json()
                party_id = data.get("party", {}).get("_id")
                room_code = data.get("party", {}).get("room_code")
                print(f"   Created party ID: {party_id}, Room Code: {room_code}")
            except:
                print("   Failed to extract party details")

        if party_id:
            # Test 4: Get party details by ID
            self.test_api_call("GET", f"/api/watch-party/{party_id}", 200, description="(Get Party by ID)")

            # Test 5: Get party details by room code
            if room_code:
                self.test_api_call("GET", f"/api/watch-party/{room_code}", 200, description="(Get Party by Room Code)")

            # Test 6: Send a chat message (requires auth)
            message_data = {"message": "Hello from test!"}
            self.test_api_call("POST", f"/api/watch-party/{party_id}/message", 200, message_data, headers=auth_headers, description="(Send Chat Message)")

            # Test 7: Get chat messages (polling endpoint)
            self.test_api_call("GET", f"/api/watch-party/{party_id}/messages", 200, description="(Get Chat Messages)")

            # Test 8: Update party status (host only)
            status_data = {"status": "playing"}
            self.test_api_call("PUT", f"/api/watch-party/{party_id}/status", 200, status_data, headers=auth_headers, description="(Update Status to Playing)")

            # Test 9: Update status to paused
            status_data = {"status": "paused"}
            self.test_api_call("PUT", f"/api/watch-party/{party_id}/status", 200, status_data, headers=auth_headers, description="(Update Status to Paused)")

            # Test 10: End the party (host only)
            self.test_api_call("DELETE", f"/api/watch-party/{party_id}", 200, headers=auth_headers, description="(End Party)")

        # Test 11: Try to join non-existent party (should fail)
        self.test_api_call("POST", "/api/watch-party/INVALID123/join", 404, headers=auth_headers, description="(Join Invalid Party - Should Fail)")

        # Test 12: Try to get non-existent party (should fail)
        self.test_api_call("GET", "/api/watch-party/INVALID123", 404, description="(Get Invalid Party - Should Fail)")

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting WaveWatch API Tests...")
        print(f"🔗 Base URL: {self.base_url}")
        
        # Test public endpoints first
        self.test_public_endpoints()
        
        # Test TMDB endpoints
        self.test_tmdb_endpoints()
        
        # Test admin login
        if self.test_admin_login():
            # Test admin endpoints
            self.test_admin_endpoints()
            # Test VIP codes system
            self.test_vip_codes_system()
        
        # Test content endpoints
        self.test_content_endpoints()
        
        # Test Watch Party endpoints
        self.test_watch_party_endpoints()
        
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