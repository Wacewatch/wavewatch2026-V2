import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import TVShowsPage from './pages/TVShowsPage';
import TVShowDetailPage from './pages/TVShowDetailPage';
import AnimePage from './pages/AnimePage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import ActorDetailPage from './pages/ActorDetailPage';
import DirectorDetailPage from './pages/DirectorDetailPage';
import TVChannelsPage from './pages/TVChannelsPage';
import RadioPage from './pages/RadioPage';
import RetrogamingPage from './pages/RetrogamingPage';
import EbooksPage from './pages/EbooksPage';
import SoftwarePage from './pages/SoftwarePage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import DiscoverPlaylistsPage from './pages/DiscoverPlaylistsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import FAQPage from './pages/FAQPage';
import DNSVPNPage from './pages/DNSVPNPage';
import ContactStaffPage from './pages/ContactStaffPage';
import AdminPage from './pages/AdminPage';
import SeasonDetailPage from './pages/SeasonDetailPage';
import EpisodeDetailPage from './pages/EpisodeDetailPage';
import ContentRequestsPage from './pages/ContentRequestsPage';
import CalendarPage from './pages/CalendarPage';
import ChangelogsPage from './pages/ChangelogsPage';
import SpectaclesPage from './pages/SpectaclesPage';
import SportPage from './pages/SportPage';
import DocumentairesPage from './pages/DocumentairesPage';
import ActorsPage from './pages/ActorsPage';
import VIPGamePage from './pages/VIPGamePage';
import WatchHistoryPage from './pages/WatchHistoryPage';
import MusicPage from './pages/MusicPage';
import GamesPage from './pages/GamesPage';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MessagesPage from './pages/MessagesPage';
import MusicDetailPage from './pages/MusicDetailPage';
import GameDetailPage from './pages/GameDetailPage';
import EbookDetailPage from './pages/EbookDetailPage';
import SoftwareDetailPage from './pages/SoftwareDetailPage';
import DownloadLinksPage from './pages/DownloadLinksPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StatusProvider } from './components/ContentCard';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPath = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      window.scrollTo(0, 0);
      prevPath.current = pathname;
    }
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <ScrollToTop />
              <Navigation />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/movies/:id" element={<MovieDetailPage />} />
                  <Route path="/tv-shows" element={<TVShowsPage />} />
                  <Route path="/tv-shows/:id" element={<TVShowDetailPage />} />
                  <Route path="/tv-shows/:id/season/:seasonNumber" element={<SeasonDetailPage />} />
                  <Route path="/tv-shows/:id/season/:seasonNumber/episode/:episodeNumber" element={<EpisodeDetailPage />} />
                  <Route path="/anime" element={<AnimePage />} />
                  <Route path="/anime/:id" element={<AnimeDetailPage />} />
                  <Route path="/anime/:id/season/:seasonNumber" element={<SeasonDetailPage isAnime />} />
                  <Route path="/anime/:id/season/:seasonNumber/episode/:episodeNumber" element={<EpisodeDetailPage isAnime />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/collections/:id" element={<CollectionsPage />} />
                  <Route path="/actors/:id" element={<ActorDetailPage />} />
                  <Route path="/directors/:id" element={<DirectorDetailPage />} />
                  <Route path="/tv-channels" element={<TVChannelsPage />} />
                  <Route path="/radio" element={<RadioPage />} />
                  <Route path="/download-links" element={<DownloadLinksPage />} />
                  <Route path="/retrogaming" element={<RetrogamingPage />} />
                  <Route path="/ebooks" element={<EbooksPage />} />
                  <Route path="/logiciels" element={<SoftwarePage />} />
                  <Route path="/playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
                  <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
                  <Route path="/discover/playlists" element={<DiscoverPlaylistsPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/dns-vpn" element={<DNSVPNPage />} />
                  <Route path="/contact-staff" element={<ContactStaffPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                  <Route path="/requests" element={<ContentRequestsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/changelogs" element={<ChangelogsPage />} />
                  <Route path="/spectacles" element={<SpectaclesPage />} />
                  <Route path="/sport" element={<SportPage />} />
                  <Route path="/documentaires" element={<DocumentairesPage />} />
                  <Route path="/actors" element={<ActorsPage />} />
                  <Route path="/vip-game" element={<VIPGamePage />} />
                  <Route path="/history" element={<WatchHistoryPage />} />
                  <Route path="/music" element={<MusicPage />} />
                  <Route path="/music/:id" element={<MusicDetailPage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/games/:id" element={<GameDetailPage />} />
                  <Route path="/ebooks/:id" element={<EbookDetailPage />} />
                  <Route path="/logiciels/:id" element={<SoftwareDetailPage />} />
                  <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
          </StatusProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
