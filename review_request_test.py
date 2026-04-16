#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ReviewRequestTester:
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
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(description or f"{method} {endpoint}", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test(description or f"{method} {endpoint}", False, str(e))
            return False, {}

    def test_admin_login(self):
        """Test admin authentication"""
        success, response = self.test_api_call(
            "POST", "/api/auth/login",
            data={"email": "admin@wavewatch.com", "password": "WaveWatch2026!"},
            description="Admin Login"
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_movie_similar_api(self):
        """Test movie similar content API for horizontal slider"""
        success, response = self.test_api_call(
            "GET", "/api/tmdb/similar/movies/299536",
            description="Movie 299536 Similar Content API"
        )
        return success

    def test_tv_similar_api(self):
        """Test TV show similar content API for horizontal slider"""
        success, response = self.test_api_call(
            "GET", "/api/tmdb/similar/tv/1399",
            description="TV Show Similar Content API"
        )
        return success

    def test_favorites_string_content_id(self):
        """Test favorites API accepts string content_id for playlists, ebooks, etc"""
        if not self.admin_token:
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test adding playlist to favorites with string ID
        success1, _ = self.test_api_call(
            "POST", "/api/user/favorites",
            data={
                "content_id": "test_playlist_456",
                "content_type": "playlist", 
                "title": "Test Playlist for Favorites",
                "poster_path": "/test.jpg"
            },
            headers=headers,
            description="Add Playlist to Favorites (String ID)"
        )
        
        # Test checking favorite with string ID
        success2, _ = self.test_api_call(
            "GET", "/api/user/favorites/check?content_id=test_playlist_456&content_type=playlist",
            headers=headers,
            description="Check Playlist Favorite (String ID)"
        )
        
        # Test adding ebook to favorites with string ID
        success3, _ = self.test_api_call(
            "POST", "/api/user/favorites",
            data={
                "content_id": "ebook_789",
                "content_type": "ebook", 
                "title": "Test Ebook",
                "poster_path": "/ebook.jpg"
            },
            headers=headers,
            description="Add Ebook to Favorites (String ID)"
        )
        
        return success1 and success2 and success3

    def test_playlist_subscription_apis(self):
        """Test playlist subscription APIs"""
        if not self.admin_token:
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a test playlist first
        success, playlist_response = self.test_api_call(
            "POST", "/api/playlists",
            data={
                "name": "Test Subscription Playlist",
                "description": "For testing subscription",
                "is_public": True
            },
            headers=headers,
            description="Create Test Playlist for Subscription"
        )
        
        if not success:
            return False
            
        playlist_id = playlist_response.get('playlist', {}).get('_id')
        if not playlist_id:
            self.log_test("Get Playlist ID", False, "No playlist ID returned")
            return False
        
        # Test subscription toggle
        success1, _ = self.test_api_call(
            "POST", f"/api/playlists/{playlist_id}/subscribe",
            headers=headers,
            description="Subscribe to Playlist"
        )
        
        # Test subscription check
        success2, _ = self.test_api_call(
            "GET", f"/api/playlists/{playlist_id}/subscribe/check",
            headers=headers,
            description="Check Playlist Subscription Status"
        )
        
        # Clean up
        self.test_api_call(
            "DELETE", f"/api/playlists/{playlist_id}",
            headers=headers,
            description="Delete Test Subscription Playlist"
        )
        
        return success1 and success2

    def test_retrogaming_quickplaylist_support(self):
        """Test retrogaming API for QuickPlaylistAdd support"""
        success, response = self.test_api_call(
            "GET", "/api/retrogaming",
            description="Retrogaming Sources API"
        )
        return success

    def run_review_tests(self):
        """Run all tests for the review request features"""
        print("🚀 Testing Review Request Features...")
        print("=" * 50)
        
        # Test authentication first
        if not self.test_admin_login():
            print("❌ Authentication failed, stopping tests")
            return False

        print(f"\n🎬 Testing Movie/TV Similar Content APIs...")
        self.test_movie_similar_api()
        self.test_tv_similar_api()
        
        print(f"\n❤️ Testing Favorites with String Content IDs...")
        self.test_favorites_string_content_id()
        
        print(f"\n📋 Testing Playlist Subscription APIs...")
        self.test_playlist_subscription_apis()
        
        print(f"\n🎮 Testing Retrogaming API...")
        self.test_retrogaming_quickplaylist_support()
        
        # Print summary
        print(f"\n📊 Review Request Test Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print(f"\n💥 Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ReviewRequestTester()
    success = tester.run_review_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())