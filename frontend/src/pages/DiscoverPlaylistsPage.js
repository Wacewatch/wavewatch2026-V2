import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import {
  Globe, ListMusic, Film, Tv, Users, Eye, ThumbsUp, ThumbsDown, Crown, Shield,
  Search, X, SlidersHorizontal, ChevronDown, Check, LayoutGrid, List as ListIcon,
  Music, Gamepad2, BookOpen, Cpu, Sparkles, TrendingUp, Clock, ArrowDownUp,
} from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

// ----------------------------------------------------------------------
// Small badges
// ----------------------------------------------------------------------
function UserBadge({ info }) {
  if (!info) return null;
  if (info.is_admin) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">Admin</span>;
  if (info.is_uploader) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">Uploader</span>;
  if (info.is_vip_plus) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1"><Crown className="w-2.5 h-2.5" />VIP+</span>;
  if (info.is_vip) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-semibold flex items-center gap-1"><Crown className="w-2.5 h-2.5" />VIP</span>;
  return null;
}

const TYPE_META = {
  movie: { label: 'Films', icon: Film, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  tv: { label: 'Séries', icon: Tv, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  episode: { label: 'Épisodes', icon: Tv, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  music: { label: 'Musique', icon: Music, color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  game: { label: 'Jeux', icon: Gamepad2, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  ebook: { label: 'Ebooks', icon: BookOpen, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  software: { label: 'Logiciels', icon: Cpu, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
};

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récentes', icon: Clock },
  { value: 'oldest', label: 'Plus anciennes', icon: Clock },
  { value: 'likes', label: 'Plus aimées', icon: ThumbsUp },
  { value: 'dislikes', label: 'Plus critiquées', icon: ThumbsDown },
  { value: 'size', label: 'Plus grandes', icon: ListMusic },
  { value: 'name', label: 'Nom (A→Z)', icon: ArrowDownUp },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'Tous', icon: Users },
  { value: 'staff', label: 'Staff', icon: Shield, desc: 'Admin + Uploader' },
  { value: 'vip', label: 'VIP', icon: Crown },
  { value: 'standard', label: 'Standard', icon: Users },
];

// Hook: debounced value
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ----------------------------------------------------------------------
// Cards
// ----------------------------------------------------------------------
const FALLBACK_GRADIENTS = [
  'from-blue-600 to-purple-600', 'from-pink-600 to-red-600',
  'from-green-600 to-teal-600', 'from-orange-600 to-yellow-600',
  'from-indigo-600 to-blue-600', 'from-purple-600 to-pink-600',
];

function PlaylistCover({ playlist, idx, className = '' }) {
  const items = playlist.items || [];
  if (!items.length) {
    return (
      <div className={`bg-gradient-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]} flex items-center justify-center ${className}`}>
        <ListMusic className="w-12 h-12 text-white/30" />
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-2 ${className}`}>
      {items.slice(0, 4).map((it, i) => (
        <div key={i} className="overflow-hidden">
          {it.poster_path ? (
            <img
              src={it.poster_path.startsWith('http') ? it.poster_path : `${TMDB_IMG}/w200${it.poster_path}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x300/1e293b/64748b?text=%3F'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Film className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
      {items.length < 4 && Array.from({ length: 4 - Math.min(items.length, 4) }).map((_, i) => (
        <div key={`e-${i}`} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80" />
      ))}
    </div>
  );
}

function PlaylistGridCard({ playlist, idx }) {
  const isStaff = playlist.user_info?.is_admin || playlist.user_info?.is_uploader;
  const score = (playlist.likes_count || 0) - (playlist.dislikes_count || 0);
  return (
    <Link to={`/playlists/${playlist._id}`} className="group block" data-testid={`discover-playlist-${playlist._id}`}>
      <div className={`relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isStaff ? 'border-amber-500/40 hover:border-amber-400/60 shadow-amber-500/5' : 'border-border hover:border-primary/40'}`}>
        {isStaff && (
          <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-amber-500/95 text-black text-[10px] font-bold flex items-center gap-1 shadow-lg">
            <Sparkles className="w-3 h-3" />Staff
          </div>
        )}
        <div className="relative h-44 overflow-hidden">
          <PlaylistCover playlist={playlist} idx={idx} className="h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg drop-shadow-lg line-clamp-1">{playlist.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-white/85">
                <Users className="w-3 h-3" />{playlist.user_info?.username || playlist.username || 'Anonyme'}
              </span>
              <UserBadge info={playlist.user_info} />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {playlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(playlist.items || []).slice(0, 3).map((it, i) => {
              const meta = TYPE_META[it.content_type] || TYPE_META.movie;
              const Icon = meta.icon;
              return (
                <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border ${meta.color} truncate max-w-[140px]`}>
                  <Icon className="w-2.5 h-2.5" />{it.title}
                </span>
              );
            })}
            {playlist.items_count > 3 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-secondary text-muted-foreground">
                +{playlist.items_count - 3}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-medium"><ThumbsUp className="w-3 h-3" />{playlist.likes_count || 0}</span>
              <span className="flex items-center gap-1 text-rose-400 font-medium"><ThumbsDown className="w-3 h-3" />{playlist.dislikes_count || 0}</span>
              {score > 5 && <span className="flex items-center gap-1 text-amber-400 font-medium"><TrendingUp className="w-3 h-3" />Hot</span>}
            </div>
            <span className="text-xs text-blue-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <Eye className="w-3 h-3" />Explorer
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlaylistListRow({ playlist, idx }) {
  const isStaff = playlist.user_info?.is_admin || playlist.user_info?.is_uploader;
  return (
    <Link to={`/playlists/${playlist._id}`} className="group flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/30 transition-all" data-testid={`discover-playlist-${playlist._id}`}>
      <div className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${isStaff ? 'ring-2 ring-amber-400/60' : ''}`}>
        <PlaylistCover playlist={playlist} idx={idx} className="h-full w-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold truncate">{playlist.name}</h3>
          {isStaff && <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500/95 text-black font-bold">Staff</span>}
          <UserBadge info={playlist.user_info} />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <Users className="w-3 h-3" />{playlist.user_info?.username || 'Anonyme'} · {playlist.items_count} élém.
        </p>
        {playlist.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{playlist.description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
        <span className="flex items-center gap-1 text-emerald-400 font-medium"><ThumbsUp className="w-3 h-3" />{playlist.likes_count || 0}</span>
        <span className="flex items-center gap-1 text-rose-400 font-medium"><ThumbsDown className="w-3 h-3" />{playlist.dislikes_count || 0}</span>
      </div>
    </Link>
  );
}

// ----------------------------------------------------------------------
// Sort dropdown
// ----------------------------------------------------------------------
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];
  const Icon = current.icon;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-sm flex items-center gap-2 min-w-[180px] justify-between"
        data-testid="sort-dropdown-btn"
      >
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" />{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-2xl z-50 py-1">
          {SORT_OPTIONS.map(o => {
            const I = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors ${o.value === value ? 'text-primary' : ''}`}
                data-testid={`sort-${o.value}`}
              >
                <span className="flex items-center gap-2"><I className="w-4 h-4" />{o.label}</span>
                {o.value === value && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Main page
// ----------------------------------------------------------------------
export default function DiscoverPlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total_playlists: 0, total_contributors: 0, total_items: 0, by_type: [] });
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(true);
  // Filters
  const [sortBy, setSortBy] = useState('recent');
  const [search, setSearch] = useState('');
  const [creatorRole, setCreatorRole] = useState('all');
  const [contentTypes, setContentTypes] = useState([]);
  const [minItems, setMinItems] = useState(0);
  const debouncedSearch = useDebounced(search, 350);

  // Load stats once
  useEffect(() => {
    API.get('/api/playlists/public/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [sortBy, debouncedSearch, creatorRole, contentTypes, minItems]);

  // Fetch playlists on filter change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '20', sort_by: sortBy,
      creator_role: creatorRole, q: debouncedSearch, min_items: String(minItems),
    });
    if (contentTypes.length) params.set('content_type_filter', contentTypes.join(','));
    API.get(`/api/playlists/public/enhanced?${params.toString()}`)
      .then(({ data }) => { setPlaylists(data.playlists || []); setTotal(data.total || 0); })
      .catch(() => { setPlaylists([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, sortBy, debouncedSearch, creatorRole, contentTypes, minItems]);

  const toggleType = (t) => setContentTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (debouncedSearch) chips.push({ key: 'q', label: `"${debouncedSearch}"`, clear: () => setSearch('') });
    if (creatorRole !== 'all') {
      const r = ROLE_OPTIONS.find(o => o.value === creatorRole);
      chips.push({ key: 'role', label: r?.label || creatorRole, clear: () => setCreatorRole('all') });
    }
    contentTypes.forEach(t => chips.push({
      key: `t-${t}`, label: TYPE_META[t]?.label || t, clear: () => toggleType(t),
    }));
    if (minItems > 0) chips.push({ key: 'min', label: `≥ ${minItems} items`, clear: () => setMinItems(0) });
    return chips;
  }, [debouncedSearch, creatorRole, contentTypes, minItems]);

  const clearAll = () => { setSearch(''); setCreatorRole('all'); setContentTypes([]); setMinItems(0); setSortBy('recent'); };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="container mx-auto px-4 py-8" data-testid="discover-playlists-page">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-950/40 via-cyan-950/30 to-blue-950/40 mb-6">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.25), transparent 40%)' }} />
        <div className="relative p-6 md:p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-3">
            <Globe className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Découvrir des Playlists</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">Explorez les collections partagées par la communauté — films, séries, musique, jeux et plus encore.</p>
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-2xl mx-auto">
            {[
              { value: stats.total_playlists, label: 'playlists', color: 'text-emerald-400' },
              { value: stats.total_contributors, label: 'contributeurs', color: 'text-cyan-400' },
              { value: stats.total_items, label: 'éléments', color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-black/30 border border-white/5 px-3 py-3">
                <p className={`text-xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3 md:p-4 mb-4 space-y-3 sticky top-16 z-30">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou description..."
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary/50 transition-colors"
              data-testid="discover-search-input"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            )}
          </div>
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${showFilters ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'}`}
            data-testid="filters-toggle-btn"
          >
            <SlidersHorizontal className="w-4 h-4" />Filtres{activeFilterChips.length > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground font-bold">{activeFilterChips.length}</span>}
          </button>
          <div className="hidden sm:flex rounded-lg border border-border bg-card overflow-hidden" role="group" aria-label="Vue">
            <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === 'grid' ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground'}`} data-testid="view-grid-btn"><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground'}`} data-testid="view-list-btn"><ListIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Expandable filters panel */}
        {showFilters && (
          <div className="border-t border-border/60 pt-3 space-y-3" data-testid="filters-panel">
            {/* Content types */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Type de contenu</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_META).filter(([t]) => t !== 'episode').map(([t, meta]) => {
                  const I = meta.icon;
                  const active = contentTypes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? `${meta.color} ring-1 ring-current` : 'border-border bg-card hover:bg-secondary text-muted-foreground'}`}
                      data-testid={`type-filter-${t}`}
                    >
                      <I className="w-3 h-3" />{meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Creator role */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Auteur</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_OPTIONS.map(o => {
                  const I = o.icon;
                  const active = creatorRole === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setCreatorRole(o.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary text-muted-foreground'}`}
                      title={o.desc || o.label}
                      data-testid={`role-filter-${o.value}`}
                    >
                      <I className="w-3 h-3" />{o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Min items */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>Taille minimum</span>
                <span className="text-primary font-bold">{minItems > 0 ? `≥ ${minItems}` : 'aucun'}</span>
              </p>
              <input
                type="range" min={0} max={50} step={1} value={minItems}
                onChange={e => setMinItems(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-primary"
                data-testid="min-items-slider"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>0</span><span>10</span><span>25</span><span>50+</span></div>
            </div>
          </div>
        )}

        {/* Active chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-border/60">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">Filtres actifs</span>
            {activeFilterChips.map(c => (
              <button key={c.key} onClick={c.clear} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">
                {c.label}<X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1">Tout effacer</button>
          </div>
        )}
      </div>

      {/* Results meta */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <p className="text-muted-foreground">
          {loading ? 'Chargement...' : (
            <><span className="font-semibold text-foreground">{total}</span> playlist{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</>
          )}
        </p>
        {totalPages > 1 && <p className="text-xs text-muted-foreground">Page {page} / {totalPages}</p>}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : playlists.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-card/30">
          <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-semibold mb-1">Aucune playlist ne correspond</p>
          <p className="text-sm text-muted-foreground mb-4">Essayez d'ajuster vos filtres ou votre recherche.</p>
          {activeFilterChips.length > 0 && (
            <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Réinitialiser les filtres</button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {playlists.map((p, i) => <PlaylistGridCard key={p._id} playlist={p} idx={i} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((p, i) => <PlaylistListRow key={p._id} playlist={p} idx={i} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8" data-testid="discover-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary text-sm">Précédent</button>
          <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary text-sm">Suivant</button>
        </div>
      )}
    </div>
  );
}
