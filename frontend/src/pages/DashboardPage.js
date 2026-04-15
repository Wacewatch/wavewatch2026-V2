import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { Heart, Eye, ListMusic, Crown, Star, Clock, Award, MessageSquare, Film, Tv, Trophy, ChevronRight, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Zap, Calendar, TrendingUp, BarChart3, Gamepad2, Radio, BookOpen, Monitor } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ favorites: 0, watched: 0, playlists: 0 });
  const [detailedStats, setDetailedStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('history');

  // Collapsible states
  const [statsOpen, setStatsOpen] = useState(true);
  const [likesOpen, setLikesOpen] = useState(true);
  const [detailedOpen, setDetailedOpen] = useState(true);
  const [factsOpen, setFactsOpen] = useState(true);
  const [achievementsOpen, setAchievementsOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      API.get('/api/user/stats').then(({ data }) => setStats(data)).catch(() => {});
      API.get('/api/user/detailed-stats').then(({ data }) => setDetailedStats(data)).catch(() => {});
      API.get('/api/user/history').then(({ data }) => {
        const h = data.history || [];
        setAllHistory(h);
        setHistory(h.slice(0, 12));
      }).catch(() => {});
      API.get('/api/user/favorites').then(({ data }) => setFavorites((data.favorites || []).slice(0, 12))).catch(() => {});
      API.get('/api/user/achievements').then(({ data }) => setAchievements(data.achievements || [])).catch(() => {});
      API.get('/api/staff-messages').then(({ data }) => setMessages((data.messages || []).slice(0, 3))).catch(() => {});
    }
  }, [user]);

  if (authLoading || !user) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalHours = detailedStats ? Math.floor(detailedStats.total_watch_time / 60) : 0;
  const totalMinutes = detailedStats ? detailedStats.total_watch_time % 60 : 0;

  const interestingFacts = [];
  if (detailedStats) {
    if (detailedStats.movies_watched > 0) interestingFacts.push(`Vous avez regarde ${detailedStats.movies_watched} film${detailedStats.movies_watched > 1 ? 's' : ''} sur WaveWatch !`);
    if (detailedStats.shows_watched > 0) interestingFacts.push(`Vous suivez ${detailedStats.shows_watched} serie${detailedStats.shows_watched > 1 ? 's' : ''} differente${detailedStats.shows_watched > 1 ? 's' : ''}.`);
    if (totalHours > 0) interestingFacts.push(`Vous avez passe environ ${totalHours} heures de visionnage. C'est ${Math.floor(totalHours / 24)} jour${Math.floor(totalHours / 24) > 1 ? 's' : ''} complets !`);
    if (detailedStats.total_likes > 0) interestingFacts.push(`Vous avez like ${detailedStats.total_likes} contenu${detailedStats.total_likes > 1 ? 's' : ''}. Vos gouts sont eclectiques !`);
    if (stats.playlists > 0) interestingFacts.push(`Vous avez cree ${stats.playlists} playlist${stats.playlists > 1 ? 's' : ''} personnalisee${stats.playlists > 1 ? 's' : ''}.`);
  }

  const Section = ({ title, icon, isOpen, setIsOpen, children, gradient }) => (
    <div className={`rounded-xl border border-border overflow-hidden ${gradient || 'bg-card'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity" data-testid={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <h2 className="text-lg font-bold flex items-center gap-2">{icon}{title}</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">Bienvenue,</span>
            <span className="font-medium text-blue-400">{user.username}</span>
            {user.is_admin && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>}
            {user.is_vip_plus && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30"><Crown className="w-3 h-3 inline mr-1" />VIP+</span>}
            {user.is_vip && !user.is_vip_plus && <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Crown className="w-3 h-3 inline mr-1" />VIP</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/profile', label: 'Profil', icon: <Crown className="w-4 h-4" /> },
            { to: '/playlists', label: 'Mes Playlists', icon: <Film className="w-4 h-4" /> },
            { to: '/contact-staff', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" /> },
            { to: '/requests', label: 'Demandes', icon: <MessageSquare className="w-4 h-4" /> },
          ].map(l => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm" data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, '-')}`}>
              {l.icon}<span>{l.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <Section title="Statistiques principales" icon={<BarChart3 className="w-5 h-5 text-blue-400" />} isOpen={statsOpen} setIsOpen={setStatsOpen}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><Clock className="w-5 h-5 text-blue-400" /></div>
            <p className="text-2xl font-bold">{totalHours}h {totalMinutes}m</p>
            <p className="text-sm text-muted-foreground">Temps total</p>
          </div>
          <div className="bg-secondary/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><ThumbsUp className="w-5 h-5 text-green-400" /></div>
            <p className="text-2xl font-bold text-green-400">{detailedStats?.total_likes || 0}</p>
            <p className="text-sm text-muted-foreground">Contenus likes</p>
          </div>
          <div className="bg-secondary/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><ThumbsDown className="w-5 h-5 text-red-400" /></div>
            <p className="text-2xl font-bold text-red-400">{detailedStats?.total_dislikes || 0}</p>
            <p className="text-sm text-muted-foreground">Contenus dislikes</p>
          </div>
          <div className="bg-secondary/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><Star className="w-5 h-5 text-yellow-400" /></div>
            <p className="text-2xl font-bold">{stats.favorites}</p>
            <p className="text-sm text-muted-foreground">Favoris</p>
          </div>
        </div>
      </Section>

      {/* Detailed Stats */}
      <Section title="Statistiques detaillees" icon={<TrendingUp className="w-5 h-5 text-green-400" />} isOpen={detailedOpen} setIsOpen={setDetailedOpen}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <Film className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{detailedStats?.movies_watched || 0}</p>
            <p className="text-sm text-red-400/70">Films</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Tv className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-blue-400">{detailedStats?.shows_watched || 0}</p>
            <p className="text-sm text-blue-400/70">Series</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <Eye className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{detailedStats?.episodes_watched || 0}</p>
            <p className="text-sm text-green-400/70">Episodes</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <ListMusic className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-purple-400">{stats.playlists}</p>
            <p className="text-sm text-purple-400/70">Playlists</p>
          </div>
        </div>
      </Section>

      {/* Interesting Facts */}
      {interestingFacts.length > 0 && (
        <Section title="Le saviez-vous ?" icon={<Zap className="w-5 h-5 text-yellow-400" />} isOpen={factsOpen} setIsOpen={setFactsOpen} gradient="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="space-y-3">
            {interestingFacts.map((fact, i) => (
              <div key={i} className="bg-card/60 backdrop-blur-sm p-4 rounded-lg border border-border">
                <p className="text-sm flex items-center gap-2"><span className="text-blue-400 font-bold text-lg">&#x2022;</span>{fact}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Achievements */}
      <Section title={`Succes et Badges (${unlockedCount}/${achievements.length})`} icon={<Trophy className="w-5 h-5 text-yellow-400" />} isOpen={achievementsOpen} setIsOpen={setAchievementsOpen}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border text-center transition-all ${a.unlocked ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-border bg-secondary/20 opacity-50'}`} data-testid={`achievement-${a.id}`}>
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${a.unlocked ? 'bg-yellow-500/20 border-2 border-yellow-500/50' : 'bg-secondary border-2 border-border'}`}>
                <span className="text-lg">{a.unlocked ? <Award className="w-5 h-5 text-yellow-400" /> : '?'}</span>
              </div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Votre avis compte" icon={<MessageSquare className="w-5 h-5 text-green-400" />} isOpen={feedbackOpen} setIsOpen={setFeedbackOpen}>
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">Partagez votre experience et aidez-nous a ameliorer WaveWatch</p>
          <Link to="/contact-staff" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity" data-testid="feedback-btn">
            <MessageSquare className="w-4 h-4" />Envoyer un message
          </Link>
        </div>
      </Section>

      {/* History / Favorites Tabs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="content-tabs">
        <div className="flex border-b border-border">
          <button onClick={() => setActiveTab('history')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="tab-history">
            Historique ({allHistory.length})
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="tab-favorites">
            Favoris ({favorites.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'history' && (
            history.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun historique de visionnage pour le moment.</p> : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {history.map((h, i) => {
                    const imgUrl = h.poster_path ? `${TMDB_IMG}/w300${h.poster_path}` : 'https://placehold.co/300x450/1a1a2e/555?text=No+Image';
                    const link = h.content_type === 'movie' ? `/movies/${h.content_id}` : h.content_type === 'tv' ? `/tv-shows/${h.content_id}` : `/movies/${h.content_id}`;
                    return (
                      <Link key={i} to={link} className="group" data-testid={`history-item-${i}`}>
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                          <img src={imgUrl} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute top-2 right-2"><span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">Vu</span></div>
                        </div>
                        <p className="text-sm font-medium mt-2 line-clamp-2 group-hover:text-blue-400">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.content_type === 'movie' ? 'Film' : 'Serie'}</p>
                      </Link>
                    );
                  })}
                </div>
                {allHistory.length > 12 && (
                  <div className="text-center mt-6">
                    <Link to="/history" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm">
                      Tout voir ({allHistory.length})<ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            )
          )}

          {activeTab === 'favorites' && (
            favorites.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun favori. Ajoutez des contenus depuis leurs pages de details.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {favorites.map((f, i) => {
                  const imgUrl = f.poster_path ? `${TMDB_IMG}/w300${f.poster_path}` : 'https://placehold.co/300x450/1a1a2e/555?text=Favori';
                  const link = f.content_type === 'movie' ? `/movies/${f.content_id}` : f.content_type === 'tv' ? `/tv-shows/${f.content_id}` : `/movies/${f.content_id}`;
                  return (
                    <Link key={i} to={link} className="group" data-testid={`fav-item-${i}`}>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                        <img src={imgUrl} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-2 right-2"><Heart className="w-5 h-5 fill-red-500 text-red-500" /></div>
                        <div className="absolute bottom-2 left-2"><span className="px-2 py-0.5 rounded text-xs bg-secondary/80 backdrop-blur-sm">{f.content_type === 'movie' ? 'Film' : f.content_type === 'tv' ? 'Serie' : 'Autre'}</span></div>
                      </div>
                      <p className="text-sm font-medium mt-2 line-clamp-2 group-hover:text-blue-400">{f.title}</p>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
