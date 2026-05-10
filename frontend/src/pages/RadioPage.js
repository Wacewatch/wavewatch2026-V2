import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../lib/api';
import { Radio as RadioIcon, Play, Pause, Search, ThumbsUp, ThumbsDown, Heart, ExternalLink, Music, Mic2, Sparkles, X, Zap } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

const GENRE_META = {
  'Pop':           { hex: '#3b82f6' },
  'Pop/Dance':     { hex: '#3b82f6' },
  'Talk/News':     { hex: '#f59e0b' },
  'Électronique':  { hex: '#06b6d4' },
  'Dance/Electro': { hex: '#06b6d4' },
  'Jazz':          { hex: '#a855f7' },
  'Variété':       { hex: '#d946ef' },
  'Rap/Hip-Hop':   { hex: '#ef4444' },
  'Generaliste':   { hex: '#94a3b8' },
};
const DEFAULT = { hex: '#94a3b8' };

const CARD_GRADIENTS = [
  'from-blue-600 via-cyan-500 to-teal-500',
  'from-fuchsia-600 via-purple-600 to-indigo-600',
  'from-emerald-500 via-cyan-500 to-blue-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-amber-500 via-orange-500 to-red-600',
  'from-cyan-500 via-blue-500 to-indigo-600',
];

function RadioCard({ station, isPlaying, onToggle, onFavorite, onVote, userVote, isFavorite, idx }) {
  const genre = station.genre || 'Radio';
  const meta = GENRE_META[genre] || DEFAULT;
  const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  const likes = station.likes || 0;
  const dislikes = station.dislikes || 0;

  return (
    <div className="group relative wv-fade-in" style={{ animationDelay: `${Math.min(idx, 20) * 30}ms` }} data-testid={`radio-card-${station.name}`}>
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} ${isPlaying ? 'opacity-60' : 'opacity-0 group-hover:opacity-50'} blur-xl transition-opacity duration-500 pointer-events-none`} />
      <div className={`relative bg-[#0b1220]/80 backdrop-blur-md border ${isPlaying ? 'border-cyan-400/60' : 'border-white/10 group-hover:border-white/25'} rounded-2xl p-4 transition-all duration-300 flex flex-col gap-3 h-full`}>
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/95 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform"
               style={{ boxShadow: `0 6px 22px ${meta.hex}33` }}>
            {(station.logo || station.logo_url) ? (
              <img src={station.logo || station.logo_url} alt={station.name} className="w-full h-full object-contain"
                   onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">FM</div>'; }} />
            ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">FM</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white truncate">{station.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow" style={{ background: `linear-gradient(135deg, ${meta.hex}, ${meta.hex}aa)` }}>{genre}</span>
              {station.frequency && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">{station.frequency}</span>}
              {isPlaying && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />ON AIR</span>}
            </div>
          </div>
          <button onClick={() => onFavorite(station)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0" data-testid={`fav-radio-${station.name}`}>
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/40 hover:text-white/80'}`} />
          </button>
        </div>

        {station.description && <p className="text-xs text-white/60 line-clamp-2 min-h-[2rem]">{station.description}</p>}
        <p className="text-[11px] text-white/50">{station.country || 'France'}</p>

        <div className="flex items-center justify-center gap-5 py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          <button onClick={() => onVote(station, 'like')} className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-emerald-400' : 'text-white/50 hover:text-emerald-400'}`} data-testid={`like-radio-${station.name}`}>
            <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-emerald-400/30' : ''}`} /> <span className="font-bold tabular-nums">{likes}</span>
          </button>
          <span className="w-px h-4 bg-white/10" />
          <button onClick={() => onVote(station, 'dislike')} className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-rose-400' : 'text-white/50 hover:text-rose-400'}`} data-testid={`dislike-radio-${station.name}`}>
            <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-rose-400/30' : ''}`} /> <span className="font-bold tabular-nums">{dislikes}</span>
          </button>
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={() => onToggle(station)} disabled={!station.stream_url}
                  className={`flex-1 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                    isPlaying ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95'
                  }`}
                  data-testid={`listen-${station.name}`}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Pause' : 'Écouter'}
          </button>
          <QuickPlaylistAdd contentId={station._id || station.id || station.name} contentType="radio" title={station.name} posterPath={station.logo || station.logo_url} inline metadata={{ stream_url: station.stream_url, genre: station.genre }} />
          {station.website_url && (
            <a href={station.website_url} target="_blank" rel="noopener noreferrer" className="h-10 px-2.5 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 text-xs font-bold flex items-center gap-1 transition-colors text-white/80" data-testid={`site-${station.name}`}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RadioPage() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState(null);
  const [audio] = useState(() => (typeof Audio !== 'undefined' ? new Audio() : null));
  const [favorites, setFavorites] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();
  const dSearch = useDebounced(search, 200);

  const loadStations = useCallback(() => {
    API.get('/api/radio-stations').then(({ data }) => setStations(data.stations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadStations();
    if (user) {
      API.get('/api/user/favorites').then(({ data }) => {
        const map = {};
        (data.favorites || []).filter(f => f.content_type === 'radio').forEach(f => { map[String(f.content_id)] = true; });
        setFavorites(map);
      }).catch(() => {});
      API.get('/api/media-votes/mine').then(({ data }) => {
        const vmap = {};
        (data.votes || []).filter(v => v.target_collection === 'radio_stations').forEach(v => { vmap[v.target_id] = v.vote; });
        setUserVotes(vmap);
      }).catch(() => {});
    }
    return () => { if (audio) { audio.pause(); } };
  }, [user, loadStations, audio]);

  const genreCounts = useMemo(() => {
    const m = {};
    stations.forEach(s => { const k = s.genre || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [stations]);
  const genres = useMemo(() => ['all', ...Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a])], [genreCounts]);

  const filtered = useMemo(() => stations.filter(s => {
    if (filter !== 'all' && s.genre !== filter) return false;
    if (dSearch && !(s.name || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [stations, filter, dSearch]);

  const cTotal = useCountUp(stations.length);
  const cGenres = useCountUp(Object.keys(genreCounts).length);
  const cShown = useCountUp(filtered.length);

  const togglePlay = (station) => {
    if (!audio) return;
    const id = station._id || station.id;
    if (playing === id) { audio.pause(); setPlaying(null); }
    else { audio.src = station.stream_url; audio.play().catch(() => toast({ title: 'Flux indisponible', variant: 'destructive' })); setPlaying(id); }
  };

  const handleFavorite = async (st) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = st._id || st.id || st.name;
      await API.post('/api/user/favorites', { content_id: id, content_type: 'radio', title: st.name, poster_path: st.logo || st.logo_url, metadata: { stream_url: st.stream_url, genre: st.genre } });
      setFavorites(p => ({ ...p, [String(id)]: !p[String(id)] }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleVote = async (st, vote) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = st._id;
      const { data } = await API.post(`/api/radio-stations/${id}/vote`, { vote });
      setStations(prev => prev.map(s => s._id === id ? { ...s, likes: data.likes, dislikes: data.dislikes } : s));
      setUserVotes(prev => ({ ...prev, [id]: data.user_vote }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  return (
    <PageWrapper testId="radio-page" accents={['rgba(59,130,246,0.5)', 'rgba(6,182,212,0.45)', 'rgba(168,85,247,0.45)']}>
      <PageHero
        badge="Streaming Live • Radio FM"
        badgeIcon={Mic2}
        title="Radio FM"
        subtitle="en"
        highlight="Direct"
        description="Écoutez vos stations préférées en streaming. Pop, jazz, hip-hop, info, électro — toutes les ondes au creux de votre oreille."
        gradient="rgba(59,130,246,0.18), rgba(6,182,212,0.12) 35%, rgba(168,85,247,0.18) 65%, rgba(99,102,241,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #93c5fd 40%, #67e8f9 70%, #c4b5fd 100%)"
        highlightGradient="linear-gradient(135deg, #3b82f6, #06b6d4, #a855f7)"
        blobColor1="rgba(6,182,212,0.6)"
        blobColor2="rgba(168,85,247,0.55)"
        stats={[
          { icon: RadioIcon, label: 'Stations', value: cTotal, accent: 'rgba(59,130,246,0.7)' },
          { icon: Music, label: 'Genres', value: cGenres, accent: 'rgba(6,182,212,0.7)' },
          { icon: Zap, label: 'Affichées', value: cShown, accent: 'rgba(168,85,247,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher une station..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
                   data-testid="radio-search-input" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {genres.map(g => (
              <Pill key={g} active={filter === g} onClick={() => setFilter(g)} icon={g === 'all' ? Sparkles : undefined}
                    color={g === 'all' ? '#06b6d4' : (GENRE_META[g] || DEFAULT).hex}
                    count={g === 'all' ? stations.length : genreCounts[g]} testId={`radio-pill-${g}`}>
                {g === 'all' ? 'Toutes' : g}
              </Pill>
            ))}
          </div>
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filtered.map((s, i) => (
            <RadioCard key={s._id || s.id || s.name} station={s} idx={i}
                       isPlaying={playing === (s._id || s.id)} onToggle={togglePlay}
                       onFavorite={handleFavorite} onVote={handleVote}
                       userVote={userVotes[s._id]} isFavorite={!!favorites[String(s._id || s.id || s.name)]} />
          ))}
        </div>
      ) : (
        <EmptyState icon={RadioIcon} text="Aucune station trouvée" sub="Essayez d'ajuster vos filtres"
                    gradient="from-blue-950/30 via-cyan-950/20 to-purple-950/30" />
      )}
    </PageWrapper>
  );
}
