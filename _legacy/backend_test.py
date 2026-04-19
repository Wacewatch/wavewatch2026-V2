#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WaveWatchAPITester:
    def __init__(self, base_url="https://code-continu.preview.emergentagent.com"):
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
        
        # Test module order setting (new feature)
        self.test_api_call("GET", "/api/admin/site-settings/module_order", 200, headers=auth_headers, description="(Module Order Settings)")
        
        # Test changelogs endpoint (new feature)
        self.test_api_call("GET", "/api/changelogs", 200, description="(Changelogs API)")
        
        # Test creating a changelog via admin
        changelog_data = {
            "version": "3.1.0",
            "title": "Test Changelog",
            "description": "Testing changelog creation",
            "release_date": "2026-01-20"
        }
        self.test_api_call("POST", "/api/admin/changelogs", 201, data=changelog_data, headers=auth_headers, description="(Create Changelog)")

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

    def test_universal_playlists(self):
        """Test universal playlist functionality with any content type"""
        if not self.admin_token:
            print("❌ Skipping universal playlist tests - no admin token")
            return

        print("\n📋 Testing Universal Playlists...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # First create a test playlist
        success, response = self.test_api_call("POST", "/api/playlists", 200, 
                                             {"name": "Test Universal Playlist", "description": "Testing universal content", "is_public": False}, 
                                             headers=auth_headers, description="(Create Test Playlist)")
        
        if success and response:
            try:
                playlist_data = response.json()
                playlist_id = playlist_data.get("playlist", {}).get("_id")
                
                if playlist_id:
                    # Test adding different content types to playlist
                    content_types = [
                        {"content_id": 550, "content_type": "movie", "title": "Fight Club"},
                        {"content_id": 1399, "content_type": "tv", "title": "Game of Thrones"},
                        {"content_id": "actor_123", "content_type": "actor", "title": "Brad Pitt"},
                        {"content_id": "episode_456", "content_type": "episode", "title": "S01E01"},
                        {"content_id": "music_789", "content_type": "music", "title": "Test Song"},
                        {"content_id": "game_101", "content_type": "game", "title": "Test Game"},
                        {"content_id": "ebook_202", "content_type": "ebook", "title": "Test Book"},
                        {"content_id": "software_303", "content_type": "software", "title": "Test Software"},
                        {"content_id": "tv_channel_404", "content_type": "tv_channel", "title": "Test Channel"},
                        {"content_id": "radio_505", "content_type": "radio", "title": "Test Radio"}
                    ]
                    
                    for content in content_types:
                        self.test_api_call("POST", f"/api/playlists/{playlist_id}/items", 200, 
                                         content, headers=auth_headers, 
                                         description=f"(Add {content['content_type']} to playlist)")
                    
                    # Test removing items with string IDs
                    self.test_api_call("DELETE", f"/api/playlists/{playlist_id}/items/actor_123", 200, 
                                     headers=auth_headers, description="(Remove string ID from playlist)")
                    
                    # Clean up - delete test playlist
                    self.test_api_call("DELETE", f"/api/playlists/{playlist_id}", 200, 
                                     headers=auth_headers, description="(Delete Test Playlist)")
                    
            except Exception as e:
                self.log_test("Universal Playlist Content Addition", False, f"Failed to parse response: {str(e)}")

    def test_grade_hierarchy(self):
        """Test grade hierarchy - admin/uploader users get VIP+VIP+ perks"""
        if not self.admin_token:
            print("❌ Skipping grade hierarchy tests - no admin token")
            return

        print("\n👑 Testing Grade Hierarchy...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test admin user profile (should have is_vip=true and is_vip_plus=true)
        success, response = self.test_api_call("GET", "/api/auth/me", 200, 
                                             headers=auth_headers, description="(Admin User Profile)")
        
        if success and response:
            try:
                user_data = response.json()
                user = user_data.get("user", {})
                
                is_admin = user.get("is_admin", False)
                is_uploader = user.get("is_uploader", False)
                is_vip = user.get("is_vip", False)
                is_vip_plus = user.get("is_vip_plus", False)
                
                # Check grade hierarchy logic
                if is_admin or is_uploader:
                    if is_vip and is_vip_plus:
                        self.log_test("Grade Hierarchy - Admin/Uploader gets VIP+VIP+", True)
                    else:
                        self.log_test("Grade Hierarchy - Admin/Uploader gets VIP+VIP+", False, 
                                    f"Admin/Uploader should have VIP+VIP+ but got vip={is_vip}, vip_plus={is_vip_plus}")
                else:
                    self.log_test("Grade Hierarchy - User Role Check", False, "Test user should be admin or uploader")
                    
            except Exception as e:
                self.log_test("Grade Hierarchy Response Parse", False, f"Failed to parse response: {str(e)}")

    def test_enhanced_playlists_endpoint(self):
        """Test enhanced playlists endpoint with sorting"""
        print("\n🔍 Testing Enhanced Playlists Endpoint...")
        
        # Test enhanced playlists endpoint with different sort options
        sort_options = ["recent", "likes", "size"]
        
        for sort_by in sort_options:
            self.test_api_call("GET", f"/api/playlists/public/enhanced?sort_by={sort_by}", 200, 
                             description=f"(Enhanced Playlists - Sort by {sort_by})")
        
        # Test with pagination
        self.test_api_call("GET", "/api/playlists/public/enhanced?page=1&sort_by=recent", 200, 
                         description="(Enhanced Playlists - With Pagination)")

    def test_movies_adult_content_param(self):
        """Test movies endpoint includes adult content parameter"""
        if not self.admin_token:
            print("❌ Skipping adult content tests - no admin token")
            return

        print("\n🔞 Testing Movies Adult Content Parameter...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test TMDB discover endpoint with include_adult parameter
        self.test_api_call("GET", "/api/tmdb/discover/movie?include_adult=true", 200, 
                         headers=auth_headers, description="(Movies with Adult Content)")
        
        self.test_api_call("GET", "/api/tmdb/discover/movie?include_adult=false", 200, 
                         headers=auth_headers, description="(Movies without Adult Content)")

    def test_playlist_like_dislike_string_id(self):
        """Test playlist like/dislike functionality with string content_id"""
        if not self.admin_token:
            print("❌ Skipping playlist like/dislike tests - no admin token")
            return

        print("\n👍 Testing Playlist Like/Dislike with String ID...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # First create a test playlist
        success, response = self.test_api_call("POST", "/api/playlists", 200, 
                                             {"name": "Test Like Playlist", "description": "Testing like/dislike", "is_public": True}, 
                                             headers=auth_headers, description="(Create Test Playlist for Like/Dislike)")
        
        if success and response:
            try:
                playlist_data = response.json()
                playlist_id = playlist_data.get("playlist", {}).get("_id")
                
                if playlist_id:
                    # Test liking the playlist with string content_id
                    like_data = {
                        "content_id": playlist_id,  # String ID
                        "content_type": "playlist",
                        "rating": "like"
                    }
                    self.test_api_call("POST", "/api/user/ratings", 200, 
                                     like_data, headers=auth_headers, 
                                     description="(Like playlist with string ID)")
                    
                    # Test getting ratings count for the playlist
                    self.test_api_call("GET", f"/api/ratings/counts?content_id={playlist_id}&content_type=playlist", 200, 
                                     description="(Get playlist ratings count)")
                    
                    # Test disliking the playlist
                    dislike_data = {
                        "content_id": playlist_id,
                        "content_type": "playlist", 
                        "rating": "dislike"
                    }
                    self.test_api_call("POST", "/api/user/ratings", 200, 
                                     dislike_data, headers=auth_headers, 
                                     description="(Dislike playlist with string ID)")
                    
                    # Clean up - delete test playlist
                    self.test_api_call("DELETE", f"/api/playlists/{playlist_id}", 200, 
                                     headers=auth_headers, description="(Delete Test Like Playlist)")
                    
            except Exception as e:
                self.log_test("Playlist Like/Dislike String ID", False, f"Failed to parse response: {str(e)}")

    def test_notification_endpoints(self):
        """Test notification endpoints for series subscriptions"""
        if not self.admin_token:
            print("❌ Skipping notification tests - no admin token")
            return

        print("\n🔔 Testing Notification Endpoints...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test series subscription toggle
        test_series_id = 1399  # Game of Thrones
        subscription_data = {
            "series_id": test_series_id,
            "series_name": "Game of Thrones"
        }
        self.test_api_call("POST", "/api/notifications/subscribe-series", 200, 
                         subscription_data, headers=auth_headers, 
                         description="(Subscribe to Series Notifications)")
        
        # Test checking subscription status
        self.test_api_call("GET", f"/api/notifications/check-series/{test_series_id}", 200, 
                         headers=auth_headers, description="(Check Series Subscription Status)")
        
        # Test getting all subscribed series
        self.test_api_call("GET", "/api/notifications/subscribed-series", 200, 
                         headers=auth_headers, description="(Get Subscribed Series)")
        
        # Test checking for new episodes
        self.test_api_call("POST", "/api/notifications/check-new-episodes", 200, 
                         headers=auth_headers, description="(Check New Episodes)")
        
        # Test unsubscribing (toggle again)
        self.test_api_call("POST", "/api/notifications/subscribe-series", 200, 
                         subscription_data, headers=auth_headers, 
                         description="(Unsubscribe from Series Notifications)")

    def test_playlist_metadata_support(self):
        """Test playlist items with metadata field for embed content"""
        if not self.admin_token:
            print("❌ Skipping playlist metadata tests - no admin token")
            return

        print("\n📋 Testing Playlist Metadata Support...")
        auth_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # First create a test playlist
        success, response = self.test_api_call("POST", "/api/playlists", 200, 
                                             {"name": "Test Metadata Playlist", "description": "Testing metadata support", "is_public": False}, 
                                             headers=auth_headers, description="(Create Test Metadata Playlist)")
        
        if success and response:
            try:
                playlist_data = response.json()
                playlist_id = playlist_data.get("playlist", {}).get("_id")
                
                if playlist_id:
                    # Test adding TV channel with metadata
                    tv_channel_data = {
                        "content_id": "test_channel_123",
                        "content_type": "tv_channel",
                        "title": "Test TV Channel",
                        "poster_path": "/test_logo.png",
                        "metadata": {
                            "stream_url": "https://example.com/stream",
                            "category": "News",
                            "country": "FR"
                        }
                    }
                    self.test_api_call("POST", f"/api/playlists/{playlist_id}/items", 200, 
                                     tv_channel_data, headers=auth_headers, 
                                     description="(Add TV Channel with Metadata)")
                    
                    # Test adding radio station with metadata
                    radio_data = {
                        "content_id": "test_radio_456",
                        "content_type": "radio",
                        "title": "Test Radio Station",
                        "poster_path": "/test_radio_logo.png",
                        "metadata": {
                            "stream_url": "https://example.com/radio_stream",
                            "genre": "Pop",
                            "frequency": "101.5 FM"
                        }
                    }
                    self.test_api_call("POST", f"/api/playlists/{playlist_id}/items", 200, 
                                     radio_data, headers=auth_headers, 
                                     description="(Add Radio Station with Metadata)")
                    
                    # Test adding retrogaming with metadata
                    retrogaming_data = {
                        "content_id": "test_game_789",
                        "content_type": "retrogaming",
                        "title": "Test Retro Game",
                        "poster_path": "/test_game_cover.png",
                        "metadata": {
                            "game_url": "https://example.com/game_embed",
                            "platform": "NES",
                            "year": "1985"
                        }
                    }
                    self.test_api_call("POST", f"/api/playlists/{playlist_id}/items", 200, 
                                     retrogaming_data, headers=auth_headers, 
                                     description="(Add Retrogaming with Metadata)")
                    
                    # Test getting playlist to verify metadata is stored
                    success_get, response_get = self.test_api_call("GET", f"/api/playlists/{playlist_id}", 200, 
                                                                 headers=auth_headers, description="(Get Playlist with Metadata)")
                    
                    if success_get and response_get:
                        try:
                            playlist_get_data = response_get.json()
                            items = playlist_get_data.get("playlist", {}).get("items", [])
                            
                            # Check if metadata is preserved
                            metadata_found = False
                            for item in items:
                                if item.get("metadata") and item.get("content_type") in ["tv_channel", "radio", "retrogaming"]:
                                    metadata_found = True
                                    break
                            
                            if metadata_found:
                                self.log_test("Playlist Metadata Preservation", True)
                            else:
                                self.log_test("Playlist Metadata Preservation", False, "Metadata not found in playlist items")
                                
                        except Exception as e:
                            self.log_test("Playlist Metadata Verification", False, f"Failed to parse playlist data: {str(e)}")
                    
                    # Clean up - delete test playlist
                    self.test_api_call("DELETE", f"/api/playlists/{playlist_id}", 200, 
                                     headers=auth_headers, description="(Delete Test Metadata Playlist)")
                    
            except Exception as e:
                self.log_test("Playlist Metadata Support", False, f"Failed to parse response: {str(e)}")

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
        
        # Test universal playlists functionality
        self.test_universal_playlists()
        
        # Test grade hierarchy
        self.test_grade_hierarchy()
        
        # Test enhanced playlists endpoint
        self.test_enhanced_playlists_endpoint()
        
        # Test movies adult content parameter
        self.test_movies_adult_content_param()
        
        # Test playlist like/dislike with string ID
        self.test_playlist_like_dislike_string_id()
        
        # Test notification endpoints
        self.test_notification_endpoints()
        
        # Test playlist metadata support
        self.test_playlist_metadata_support()
        
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