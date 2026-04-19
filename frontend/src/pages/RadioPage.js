import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../lib/api';
import { Radio as RadioIcon, Play, Pause, Search, ThumbsUp, ThumbsDown, Heart, ExternalLink, ChevronDown } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const GENRE_COLORS = {
  'Pop': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Pop/Dance': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Talk/News': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Électronique': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Dance/Electro': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Jazz': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Variété': 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  'Rap/Hip-Hop': 'bg-red-500/15 text-red-300 border-red-500/30',
  'Generaliste': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

function RadioCard({ station, isPlaying, onToggle, onFavorite, onVote, userVote, isFavorite }) {
  const genre = station.genre || 'Radio';
  const genreColor = GENRE_COLORS[genre] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  const likes = station.likes || 0;
  const dislikes = station.dislikes || 0;

  return (
    <div className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg ${isPlaying ? 'border-primary/60 shadow-primary/10 shadow-lg' : 'border-border hover:border-primary/40'}`} data-testid={`radio-card-${station.name}`}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/90 p-1 flex-shrink-0 flex items-center justify-center">
          {(station.logo || station.logo_url) ? (
            <img
              src={station.logo || station.logo_url}
              alt={station.name}
              className="w-full h-full object-contain"
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">FM</div>'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">FM</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{station.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${genreColor}`}>{genre}</span>
            {station.frequency && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-border bg-secondary/50 text-foreground">{station.frequency}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onFavorite(station)}
          className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Favori"
          data-testid={`fav-radio-${station.name}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
      </div>

      {station.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{station.description}</p>
      )}

      <p className="text-xs text-muted-foreground">{station.country || 'France'}</p>

      <div className="flex items-center justify-center gap-6 py-2 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm">
        <button
          onClick={() => onVote(station, 'like')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'}`}
          data-testid={`like-radio-${station.name}`}
        >
          <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-green-400/30' : ''}`} />
          <span className="font-semibold text-green-400/90">{likes}</span>
        </button>
        <span className="w-px h-4 bg-border" />
        <button
          onClick={() => onVote(station, 'dislike')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
          data-testid={`dislike-radio-${station.name}`}
        >
          <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-red-400/30' : ''}`} />
          <span className="font-semibold text-red-400/90">{dislikes}</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(station)}
          disabled={!station.stream_url}
          className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
          data-testid={`listen-${station.name}`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlaying ? 'Pause' : 'Écouter'}
        </button>
        <QuickPlaylistAdd
          contentId={station._id || station.id || station.name}
          contentType="radio"
          title={station.name}
          posterPath={station.logo || station.logo_url}
          inline
          metadata={{ stream_url: station.stream_url, genre: station.genre }}
        />
        {station.website_url && (
          <a
            href={station.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary text-sm font-medium flex items-center gap-1.5 transition-colors"
            data-testid={`site-${station.name}`}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Site
          </a>
        )}
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

  const genres = useMemo(() => ['all', ...Array.from(new Set(stations.map(s => s.genre).filter(Boolean)))], [stations]);

  const filtered = useMemo(() => stations.filter(s => {
    if (filter !== 'all' && s.genre !== filter) return false;
    if (search && !(s.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [stations, filter, search]);

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
      await API.post('/api/user/favorites', {
        content_id: id, content_type: 'radio', title: st.name, poster_path: st.logo || st.logo_url, metadata: { stream_url: st.stream_url, genre: st.genre }
      });
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
    <div className="container mx-auto px-4 py-10 md:py-14" data-testid="radio-page">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Radio FM en Direct</h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg">Écoutez vos stations de radio préférées en streaming</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une station..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors"
            data-testid="radio-search-input"
          />
        </div>
        <div className="relative md:w-56">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors cursor-pointer"
            data-testid="radio-genre-filter"
          >
            {genres.map(g => (
              <option key={g} value={g}>{g === 'all' ? 'Tous les genres' : g}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(s => (
          <RadioCard
            key={s._id || s.id || s.name}
            station={s}
            isPlaying={playing === (s._id || s.id)}
            onToggle={togglePlay}
            onFavorite={handleFavorite}
            onVote={handleVote}
            userVote={userVotes[s._id]}
            isFavorite={!!favorites[String(s._id || s.id || s.name)]}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <RadioIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucune station trouvée</p>
        </div>
      )}
    </div>
  );
}
