import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { BarChart3, Heart, Eye, ListMusic, Crown, Star, Clock, Award, MessageSquare, Film, Tv, Trophy, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ favorites: 0, watched: 0, playlists: 0 });
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      API.get('/api/user/stats').then(({ data }) => setStats(data)).catch(() => {});
      API.get('/api/user/history').then(({ data }) => setHistory((data.history || []).slice(0, 6))).catch(() => {});
      API.get('/api/user/achievements').then(({ data }) => setAchievements(data.achievements || [])).catch(() => {});
      API.get('/api/staff-messages').then(({ data }) => setMessages((data.messages || []).slice(0, 3))).catch(() => {});
    }
  }, [user]);

  if (authLoading || !user) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user.username} !</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Heart className="w-6 h-6 text-red-400" />, label: 'Favoris', value: stats.favorites, to: '/favorites', color: 'border-red-500/30' },
          { icon: <Eye className="w-6 h-6 text-blue-400" />, label: 'Visionnes', value: stats.watched, to: '/history', color: 'border-blue-500/30' },
          { icon: <ListMusic className="w-6 h-6 text-purple-400" />, label: 'Playlists', value: stats.playlists, to: '/playlists', color: 'border-purple-500/30' },
          { icon: <Award className="w-6 h-6 text-yellow-400" />, label: 'Badges', value: `${unlockedCount}/${achievements.length}`, to: '/achievements', color: 'border-yellow-500/30' },
        ].map((s, i) => (
          <Link key={i} to={s.to} className={`bg-card border ${s.color} rounded-xl p-5 hover:scale-105 transition-transform`} data-testid={`stat-${s.label.toLowerCase()}`}>
            <div className="flex items-center justify-between mb-3">{s.icon}<ChevronRight className="w-4 h-4 text-muted-foreground" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Mon Compte</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate ml-2">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_admin ? 'bg-red-500/20 text-red-400' : user.is_vip_plus ? 'bg-purple-500/20 text-purple-400' : user.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {user.is_admin ? 'Admin' : user.is_vip_plus ? 'VIP+' : user.is_vip ? 'VIP' : 'Standard'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ to: '/movies', label: 'Films', icon: <Film className="w-4 h-4" /> }, { to: '/tv-shows', label: 'Series', icon: <Tv className="w-4 h-4" /> },
                { to: '/vip-game', label: 'Jeu VIP', icon: <Trophy className="w-4 h-4 text-yellow-400" /> }, { to: '/leaderboard', label: 'Classement', icon: <Star className="w-4 h-4" /> }
              ].map(a => (
                <Link key={a.to} to={a.to} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-xs">{a.icon}{a.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent history */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" />Historique recent</h2>
            <Link to="/history" className="text-xs text-blue-400 hover:underline">Voir tout</Link>
          </div>
          {history.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Aucun historique</p> : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <Link key={i} to={`/${h.content_type === 'movie' ? 'movies' : 'tv-shows'}/${h.content_id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                    {h.poster_path && <img src={`${TMDB_IMG}/w92${h.poster_path}`} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-blue-400">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.content_type === 'movie' ? 'Film' : 'Serie'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-400" />Mes Messages</h2>
            <Link to="/contact-staff" className="text-xs text-blue-400 hover:underline">Ecrire</Link>
          </div>
          {messages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Aucun message</p> : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{m.subject}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {m.status === 'replied' ? 'Repondu' : 'En attente'}
                    </span>
                  </div>
                  {m.reply && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Reponse: {m.reply}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements preview */}
      {achievements.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" />Realisations ({unlockedCount}/{achievements.length})</h2>
            <Link to="/achievements" className="text-xs text-blue-400 hover:underline">Voir tout</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {achievements.map(a => (
              <div key={a.id} className={`flex-shrink-0 w-20 text-center ${a.unlocked ? '' : 'opacity-40'}`}>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-1 ${a.unlocked ? 'bg-yellow-500/20 border-2 border-yellow-500/50' : 'bg-secondary border-2 border-border'}`}>
                  <span className="text-lg">{a.unlocked ? '✓' : '?'}</span>
                </div>
                <p className="text-[10px] font-medium truncate">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
