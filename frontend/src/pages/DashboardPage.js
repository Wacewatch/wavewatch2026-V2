import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { Heart, Eye, ListMusic, Crown, Star, Clock, Award, MessageSquare, Film, Tv, Trophy, ChevronRight, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Zap, Calendar, TrendingUp, BarChart3, Users, Sparkles } from 'lucide-react';
import { ThemedPage, ThemedHero } from '../components/design/ThemedPage';

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

function Section({ title, icon, isOpen, setIsOpen, children, gradient }) {
  return (
    <div className={`rounded-xl border border-border overflow-hidden ${gradient || 'bg-card'}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity" data-testid={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <h2 className="text-lg font-bold flex items-center gap-2">{icon}{title}</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
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

  const displayedReviews = showAllReviews ? communityReviews.reviews : communityReviews.reviews.slice(0, 5);

  // === ENGAGEMENT METRICS ===
  // Activité sur 30 jours (compte d'éléments par jour basé sur l'historique)
  const buildActivityData = () => {
    const days = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    allHistory.forEach(h => {
      if (!h.watched_at) return;
      const key = new Date(h.watched_at).toISOString().slice(0, 10);
      if (key in map) map[key] += 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  };
  const activityData = buildActivityData();
  const maxActivity = Math.max(1, ...activityData.map(d => d.count));
  const totalActivity = activityData.reduce((s, d) => s + d.count, 0);
  const activeDays = activityData.filter(d => d.count > 0).length;
  // Streak (jours consécutifs en partant d'aujourd'hui)
  let streak = 0;
  for (let i = activityData.length - 1; i >= 0; i--) {
    if (activityData[i].count > 0) streak += 1; else break;
  }
  // Meilleur jour
  const bestDay = activityData.reduce((best, d) => d.count > (best?.count || 0) ? d : best, null);
  const bestDayLabel = bestDay && bestDay.count > 0 ? new Date(bestDay.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';

  // Sparkline SVG (path)
  const sparkW = 100, sparkH = 36;
  const sparkPoints = activityData.map((d, i) => {
    const x = (i / (activityData.length - 1)) * sparkW;
    const y = sparkH - (d.count / maxActivity) * sparkH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const sparkArea = `M0,${sparkH} L${sparkPoints.replace(/ /g, ' L')} L${sparkW},${sparkH} Z`;

  // === SYSTÈME DE NIVEAU XP ===
  const totalLikes = (detailedStats?.likes_given || 0);
  const totalPlaylists = (stats?.playlists || 0);
  const xp = Math.floor(
    (detailedStats?.movies_watched || 0) * 10
    + (detailedStats?.shows_watched || 0) * 15
    + totalLikes * 2
    + (stats?.favorites || 0) * 5
    + totalPlaylists * 20
    + totalHours * 0.5
  );
  // Formule : niveau N atteint à N²×100 XP. niveau actuel = floor(sqrt(xp/100))+1
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpForCurrentLevel = (level - 1) * (level - 1) * 100;
  const xpForNextLevel = level * level * 100;
  const progressXP = xp - xpForCurrentLevel;
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressPct = Math.min(100, Math.round((progressXP / neededXP) * 100));

  const getTier = (lvl) => {
    if (lvl >= 36) return { name: 'Diamant',  hex: '#67e8f9', from: '#b9f2ff', to: '#6e9cdb', glow: 'rgba(186, 247, 255, 0.5)' };
    if (lvl >= 21) return { name: 'Platine',  hex: '#a7c5e8', from: '#c8e0f0', to: '#4682b4', glow: 'rgba(167, 197, 232, 0.5)' };
    if (lvl >= 11) return { name: 'Or',       hex: '#fcd34d', from: '#ffd700', to: '#d4af37', glow: 'rgba(252, 211, 77, 0.5)' };
    if (lvl >= 6)  return { name: 'Argent',   hex: '#cbd5e1', from: '#e2e8f0', to: '#94a3b8', glow: 'rgba(203, 213, 225, 0.4)' };
    return                { name: 'Bronze',   hex: '#d97706', from: '#cd7f32', to: '#92400e', glow: 'rgba(217, 119, 6, 0.5)' };
  };
  const tier = getTier(level);

  return (
    <ThemedPage testId="dashboard-page">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <ThemedHero
          badge="Tableau de bord"
          badgeIcon={BarChart3}
          title="Bonjour,"
          subtitle=""
          highlight={user.username}
          description="Suis tes stats, tes succès, tes favoris et garde un œil sur ton activité WaveWatch."
          stats={[
            { icon: Clock,    label: 'Temps total',  value: `${totalHours}h`,                        color: 'hsl(var(--primary))' },
            { icon: Film,     label: 'Films vus',    value: detailedStats?.movies_watched || 0,      color: 'hsl(var(--accent))' },
            { icon: Tv,       label: 'Séries',       value: detailedStats?.shows_watched || 0,       color: 'hsl(var(--ring))' },
            { icon: Trophy,   label: 'Succès',       value: `${unlockedCount}/${achievements.length}`, color: 'hsl(var(--primary))' },
          ]}
        />

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 -mt-3">
          {[
            { to: '/profile', label: 'Profil', icon: <Crown className="w-4 h-4" /> },
            { to: '/playlists', label: 'Mes Playlists', icon: <Film className="w-4 h-4" /> },
            { to: '/messages', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" /> },
            { to: '/requests', label: 'Demandes', icon: <MessageSquare className="w-4 h-4" /> },
          ].map(l => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card/80 backdrop-blur hover:bg-card transition-colors text-sm" data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, '-')}`}>
              {l.icon}<span>{l.label}</span>
            </Link>
          ))}
      </div>

      {/* === NIVEAU UTILISATEUR === */}
      <div className="relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl p-5 md:p-6"
        style={{ borderColor: `${tier.hex}60`, background: `linear-gradient(135deg, ${tier.from}15, transparent 50%, ${tier.to}10)`, boxShadow: `0 12px 40px ${tier.glow}` }}
        data-testid="user-level-card"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: tier.hex }} />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: tier.to }} />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          {/* Badge tier */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: tier.hex }} />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`, boxShadow: `0 12px 32px ${tier.glow}, inset 0 2px 8px rgba(255,255,255,0.2)` }}>
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-black/70">Niveau</span>
                <span className="text-3xl md:text-4xl font-black text-black tabular-nums leading-none drop-shadow">{level}</span>
              </div>
            </div>
            <div className="md:hidden">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: tier.hex }}>{tier.name}</p>
              <p className="text-xl font-black text-foreground tabular-nums">{xp} XP</p>
            </div>
          </div>

          {/* Info & progress */}
          <div className="flex-1 min-w-0">
            <div className="hidden md:flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: tier.hex }}>Rang {tier.name}</p>
                <p className="text-2xl md:text-3xl font-black text-foreground">
                  <span className="tabular-nums">{xp.toLocaleString('fr-FR')}</span>
                  <span className="text-foreground/50 text-base ml-1">XP</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Prochain niveau</p>
                <p className="text-lg font-black text-foreground tabular-nums">{(neededXP - progressXP).toLocaleString('fr-FR')} <span className="text-foreground/50 text-sm">XP restants</span></p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }} data-testid="level-progress">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${tier.from}, ${tier.to})`, boxShadow: `0 0 12px ${tier.glow}` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold mix-blend-difference text-white">
                {progressPct}%
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-foreground/60">
              <span>Niv. {level} ({xpForCurrentLevel.toLocaleString('fr-FR')} XP)</span>
              <span>Niv. {level + 1} ({xpForNextLevel.toLocaleString('fr-FR')} XP)</span>
            </div>

            {/* Quick XP sources */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                { label: '+10 XP / film',     hex: '#3b82f6' },
                { label: '+15 XP / série',    hex: '#a855f7' },
                { label: '+5 XP / favori',    hex: '#ec4899' },
                { label: '+20 XP / playlist', hex: '#10b981' },
              ].map(s => (
                <span key={s.label} className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{ background: `${s.hex}15`, borderColor: `${s.hex}40`, color: s.hex }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === ACTIVITÉ ENGAGEMENT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="activity-block">
        {/* Sparkline 30 days */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-5 group hover:border-primary/30 transition-colors">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(var(--primary))' }} />
          <div className="relative flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">Activité — 30 derniers jours</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: 'hsl(var(--primary))' }}>
                {totalActivity}<span className="text-foreground/50 text-base font-bold ml-1">visionnages</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">Jours actifs</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: 'hsl(var(--accent))' }}>{activeDays}<span className="text-foreground/50 text-sm">/30</span></p>
            </div>
          </div>
          <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkArea} fill="url(#sparkGrad)" />
            <polyline points={sparkPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
            {/* Dots on active days */}
            {activityData.map((d, i) => d.count > 0 ? (
              <circle key={i}
                cx={(i / (activityData.length - 1)) * sparkW}
                cy={sparkH - (d.count / maxActivity) * sparkH}
                r="0.6" fill="hsl(var(--primary))" />
            ) : null)}
          </svg>
          <div className="flex justify-between text-[10px] text-foreground/50 mt-1 font-medium">
            <span>il y a 30j</span>
            <span>aujourd'hui</span>
          </div>
        </div>

        {/* Streak + best day */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-rose-950/30 p-4">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-50" style={{ background: 'hsl(35 95% 55%)' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40 flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200/80">Série en cours</p>
                <p className="text-2xl font-black text-white tabular-nums leading-tight">
                  {streak}<span className="text-base text-amber-200/70 ml-1">j</span>
                </p>
                <p className="text-[10px] text-amber-200/60 truncate">{streak === 0 ? 'Reprends aujourd\'hui !' : streak === 1 ? 'Bonne reprise !' : 'Continue comme ça 🔥'}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/40 via-blue-950/30 to-indigo-950/30 p-4">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-50" style={{ background: 'hsl(190 95% 55%)' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/40 flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-cyan-200/80">Meilleur jour</p>
                <p className="text-lg font-black text-white truncate leading-tight">{bestDayLabel}</p>
                <p className="text-[10px] text-cyan-200/60">{bestDay && bestDay.count > 0 ? `${bestDay.count} visionnages` : 'Pas encore'}</p>
              </div>
            </div>
          </div>
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
    </ThemedPage>
  );
}
