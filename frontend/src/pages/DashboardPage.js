import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { Heart, Eye, ListMusic, Crown, Star, Clock, Award, MessageSquare, Film, Tv, Trophy, ChevronRight, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Zap, Calendar, TrendingUp, BarChart3, Users, Sparkles } from 'lucide-react';

function RatingBar({ label, value, onChange }) {
  const getColor = (i) => {
    if (i <= 3) return value >= i ? 'bg-red-500 border-red-400' : 'bg-red-500/20 border-red-500/30';
    if (i <= 7) return value >= i ? 'bg-yellow-500 border-yellow-400' : 'bg-yellow-500/20 border-yellow-500/30';
    return value >= i ? 'bg-green-500 border-green-400' : 'bg-green-500/20 border-green-500/30';
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-32 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-1">
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <button key={i} onClick={() => onChange(i)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${getColor(i)}`} data-testid={`rating-${label.toLowerCase()}-${i}`}>
            <Star className={`w-3 h-3 ${value >= i ? 'text-white fill-white' : 'text-white/40'}`} />
          </button>
        ))}
      </div>
      <span className="text-sm font-bold w-12 text-right">{value}/10</span>
    </div>
  );
}

function UserBadge({ review }) {
  if (review.is_admin) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>;
  if (review.is_uploader) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Uploader</span>;
  if (review.is_vip_plus) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">VIP+</span>;
  if (review.is_vip) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">VIP</span>;
  return null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ favorites: 0, watched: 0, playlists: 0 });
  const [detailedStats, setDetailedStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('history');

  // Review state
  const [myReview, setMyReview] = useState({ contenu_score: 7, fonctionnalites_score: 7, design_score: 7, message: '' });
  const [communityReviews, setCommunityReviews] = useState({ reviews: [], total_votes: 0, averages: { contenu: 0, fonctionnalites: 0, design: 0 } });
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recsOpen, setRecsOpen] = useState(true);

  // Collapsible states
  const [statsOpen, setStatsOpen] = useState(true);
  const [detailedOpen, setDetailedOpen] = useState(true);
  const [factsOpen, setFactsOpen] = useState(true);
  const [achievementsOpen, setAchievementsOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [communityOpen, setCommunityOpen] = useState(true);

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
      API.get('/api/user/recommendations').then(({ data }) => setRecommendations(data.recommendations || [])).catch(() => {});
      API.get('/api/platform-reviews/mine').then(({ data }) => {
        if (data.review) setMyReview({ contenu_score: data.review.contenu_score, fonctionnalites_score: data.review.fonctionnalites_score, design_score: data.review.design_score, message: data.review.message || '' });
      }).catch(() => {});
    }
    API.get('/api/platform-reviews').then(({ data }) => setCommunityReviews(data)).catch(() => {});
  }, [user]);

  if (authLoading || !user) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalHours = detailedStats ? Math.floor(detailedStats.total_watch_time / 60) : 0;
  const totalMinutes = detailedStats ? detailedStats.total_watch_time % 60 : 0;

  const interestingFacts = [];
  if (detailedStats) {
    if (detailedStats.movies_watched > 0) interestingFacts.push(`Vous avez regarde ${detailedStats.movies_watched} film${detailedStats.movies_watched > 1 ? 's' : ''} sur WaveWatch !`);
    if (detailedStats.shows_watched > 0) interestingFacts.push(`Vous suivez ${detailedStats.shows_watched} serie${detailedStats.shows_watched > 1 ? 's' : ''} differente${detailedStats.shows_watched > 1 ? 's' : ''}.`);
    if (totalHours > 0) interestingFacts.push(`Vous avez passe environ ${totalHours}h de visionnage, soit ${Math.floor(totalHours / 24)} jour${Math.floor(totalHours / 24) > 1 ? 's' : ''} complets !`);
    if (detailedStats.total_likes > 0) interestingFacts.push(`Vous avez like ${detailedStats.total_likes} contenu${detailedStats.total_likes > 1 ? 's' : ''}.`);
    if (stats.playlists > 0) interestingFacts.push(`Vous avez cree ${stats.playlists} playlist${stats.playlists > 1 ? 's' : ''}.`);
  }

  const submitReview = async () => {
    setSavingReview(true);
    try {
      await API.post('/api/platform-reviews', myReview);
      toast({ title: 'Avis enregistre !' });
      const { data } = await API.get('/api/platform-reviews');
      setCommunityReviews(data);
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setSavingReview(false); }
  };

  const Section = ({ title, icon, isOpen, setIsOpen, children, gradient }) => (
    <div className={`rounded-xl border border-border overflow-hidden ${gradient || 'bg-card'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity" data-testid={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <h2 className="text-lg font-bold flex items-center gap-2">{icon}{title}</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );

  const displayedReviews = showAllReviews ? communityReviews.reviews : communityReviews.reviews.slice(0, 5);

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
            { to: '/messages', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" /> },
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
          {[
            { icon: <Clock className="w-5 h-5 text-blue-400" />, val: `${totalHours}h ${totalMinutes}m`, label: 'Temps total' },
            { icon: <ThumbsUp className="w-5 h-5 text-green-400" />, val: detailedStats?.total_likes || 0, label: 'Contenus likes', color: 'text-green-400' },
            { icon: <ThumbsDown className="w-5 h-5 text-red-400" />, val: detailedStats?.total_dislikes || 0, label: 'Contenus dislikes', color: 'text-red-400' },
            { icon: <Star className="w-5 h-5 text-yellow-400" />, val: stats.favorites, label: 'Favoris' },
          ].map((s, i) => (
            <div key={i} className="bg-secondary/30 border border-border rounded-xl p-4">
              <div className="mb-2">{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color || ''}`}>{s.val}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Detailed Stats */}
      <Section title="Statistiques detaillees" icon={<TrendingUp className="w-5 h-5 text-green-400" />} isOpen={detailedOpen} setIsOpen={setDetailedOpen}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Film className="w-6 h-6 text-red-400" />, val: detailedStats?.movies_watched || 0, label: 'Films', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { icon: <Tv className="w-6 h-6 text-blue-400" />, val: detailedStats?.shows_watched || 0, label: 'Series', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { icon: <Eye className="w-6 h-6 text-green-400" />, val: detailedStats?.episodes_watched || 0, label: 'Episodes', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { icon: <ListMusic className="w-6 h-6 text-purple-400" />, val: stats.playlists, label: 'Playlists', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map((s, i) => (
            <div key={i} className={`text-center p-4 rounded-xl border ${s.bg}`}>
              <div className="mx-auto mb-2">{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className={`text-sm ${s.color} opacity-70`}>{s.label}</p>
            </div>
          ))}
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

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Section title="Recommandations pour vous" icon={<Sparkles className="w-5 h-5 text-pink-400" />} isOpen={recsOpen} setIsOpen={setRecsOpen} gradient="bg-gradient-to-r from-pink-500/5 to-purple-500/5 border-pink-500/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendations.map(item => (
              <ContentCard key={item.id} item={item} type={item.title ? 'movie' : 'tv'} />
            ))}
          </div>
        </Section>
      )}

      {/* Votre avis compte */}
      <Section title="Votre avis compte" icon={<Star className="w-5 h-5 text-yellow-400" />} isOpen={feedbackOpen} setIsOpen={setFeedbackOpen}>
        <p className="text-sm text-muted-foreground mb-4">Aidez-nous a ameliorer WaveWatch en partageant votre experience</p>
        <div className="space-y-4">
          <RatingBar label="Contenu" value={myReview.contenu_score} onChange={v => setMyReview(p => ({ ...p, contenu_score: v }))} />
          <RatingBar label="Fonctionnalites" value={myReview.fonctionnalites_score} onChange={v => setMyReview(p => ({ ...p, fonctionnalites_score: v }))} />
          <RatingBar label="Design" value={myReview.design_score} onChange={v => setMyReview(p => ({ ...p, design_score: v }))} />
          <div>
            <label className="text-sm font-medium">Livre d'or</label>
            <textarea value={myReview.message} onChange={e => setMyReview(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Partagez votre experience..."
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="guestbook-textarea" />
          </div>
          <button onClick={submitReview} disabled={savingReview} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-400 transition-all" data-testid="submit-review-btn">
            {savingReview ? 'Enregistrement...' : 'Enregistrer mon avis'}
          </button>
        </div>
      </Section>

      {/* Avis de la communaute */}
      <Section title="Avis de la communaute" icon={<Users className="w-5 h-5 text-cyan-400" />} isOpen={communityOpen} setIsOpen={setCommunityOpen}>
        <p className="text-sm text-muted-foreground mb-4">Notes moyennes basees sur {communityReviews.total_votes} votes</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Contenu', val: communityReviews.averages.contenu },
            { label: 'Fonctionnalites', val: communityReviews.averages.fonctionnalites },
            { label: 'Design', val: communityReviews.averages.design },
          ].map(s => (
            <div key={s.label} className="bg-secondary/30 border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{s.val}/10</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{communityReviews.total_votes} votes</p>
            </div>
          ))}
        </div>
        {communityReviews.reviews.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {displayedReviews.map(r => (
              <div key={r._id} className="bg-secondary/20 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm">{r.username}</span>
                  <UserBadge review={r} />
                  <span className="text-xs text-muted-foreground ml-auto">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''}</span>
                </div>
                {r.message && <p className="text-sm text-muted-foreground">{r.message}</p>}
              </div>
            ))}
          </div>
        )}
        {communityReviews.reviews.length > 5 && (
          <button onClick={() => setShowAllReviews(!showAllReviews)} className="mt-4 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary flex items-center gap-2 mx-auto" data-testid="show-all-reviews">
            {showAllReviews ? 'Masquer' : `Voir tous les messages (${communityReviews.reviews.length})`}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
            history.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun historique pour le moment.</p> : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {history.map((h, i) => {
                    const imgUrl = h.poster_path ? `${TMDB_IMG}/w300${h.poster_path}` : 'https://placehold.co/300x450/1a1a2e/555?text=No+Image';
                    const link = h.content_type === 'movie' ? `/movies/${h.content_id}` : `/tv-shows/${h.content_id}`;
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
                  <div className="text-center mt-6"><Link to="/history" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm">Tout voir ({allHistory.length})<ChevronRight className="w-4 h-4" /></Link></div>
                )}
              </>
            )
          )}
          {activeTab === 'favorites' && (
            favorites.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun favori.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {favorites.map((f, i) => {
                  const imgUrl = f.poster_path ? `${TMDB_IMG}/w300${f.poster_path}` : 'https://placehold.co/300x450/1a1a2e/555?text=Favori';
                  const link = f.content_type === 'movie' ? `/movies/${f.content_id}` : `/tv-shows/${f.content_id}`;
                  return (
                    <Link key={i} to={link} className="group" data-testid={`fav-item-${i}`}>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                        <img src={imgUrl} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-2 right-2"><Heart className="w-5 h-5 fill-red-500 text-red-500" /></div>
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
