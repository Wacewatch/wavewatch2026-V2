import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import {
  Globe, ListMusic, Film, Tv, Users, Eye, ThumbsUp, ThumbsDown, Crown, Shield,
  Search, X, SlidersHorizontal, ChevronDown, Check, LayoutGrid, List as ListIcon,
  Music, Gamepad2, BookOpen, Cpu, Sparkles, TrendingUp, Clock, ArrowDownUp, Flame,
  Plus, Star,
} from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

// ============================================================
// Constants
// ============================================================
const TYPE_META = {
  movie:    { label: 'Films',    icon: Film,     hex: '#ef4444', from: 'from-red-500/90',     to: 'to-rose-500/90',     ring: 'shadow-red-500/30' },
  tv:       { label: 'Séries',   icon: Tv,       hex: '#3b82f6', from: 'from-blue-500/90',    to: 'to-indigo-500/90',   ring: 'shadow-blue-500/30' },
  episode:  { label: 'Épisodes', icon: Tv,       hex: '#3b82f6', from: 'from-blue-500/90',    to: 'to-indigo-500/90',   ring: 'shadow-blue-500/30' },
  music:    { label: 'Musique',  icon: Music,    hex: '#ec4899', from: 'from-pink-500/90',    to: 'to-fuchsia-500/90',  ring: 'shadow-pink-500/30' },
  game:     { label: 'Jeux',     icon: Gamepad2, hex: '#10b981', from: 'from-emerald-500/90', to: 'to-green-500/90',    ring: 'shadow-emerald-500/30' },
  ebook:    { label: 'Ebooks',   icon: BookOpen, hex: '#f59e0b', from: 'from-amber-500/90',   to: 'to-orange-500/90',   ring: 'shadow-amber-500/30' },
  software: { label: 'Logiciels',icon: Cpu,      hex: '#06b6d4', from: 'from-cyan-500/90',    to: 'to-sky-500/90',      ring: 'shadow-cyan-500/30' },
};

const SORT_OPTIONS = [
  { value: 'recent',    label: 'Plus récentes',   icon: Clock },
  { value: 'oldest',    label: 'Plus anciennes',  icon: Clock },
  { value: 'likes',     label: 'Plus aimées',     icon: Flame },
  { value: 'dislikes',  label: 'Plus critiquées', icon: ThumbsDown },
  { value: 'size',      label: 'Plus grandes',    icon: ListMusic },
  { value: 'name',      label: 'Nom (A→Z)',       icon: ArrowDownUp },
];

const ROLE_OPTIONS = [
  { value: 'all',      label: 'Tout le monde', icon: Users,  hex: '#94a3b8' },
  { value: 'staff',    label: 'Staff',         icon: Shield, hex: '#f59e0b' },
  { value: 'vip',      label: 'VIP',           icon: Crown,  hex: '#a855f7' },
  { value: 'standard', label: 'Standard',      icon: Users,  hex: '#64748b' },
];

const FALLBACK_GRADIENTS = [
  'from-violet-600 via-fuchsia-600 to-pink-600',
  'from-emerald-500 via-cyan-500 to-blue-600',
  'from-amber-500 via-orange-500 to-red-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-cyan-500 via-blue-500 to-indigo-600',
];

// ============================================================
// Utilities
// ============================================================
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ============================================================
// Small components
// ============================================================
function UserBadge({ info, size = 'sm' }) {
  if (!info) return null;
  const cls = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  if (info.is_admin)    return <span className={`${cls} rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1 backdrop-blur-sm`}><Shield className="w-2.5 h-2.5" />Admin</span>;
  if (info.is_uploader) return <span className={`${cls} rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1 backdrop-blur-sm`}><Sparkles className="w-2.5 h-2.5" />Uploader</span>;
  if (info.is_vip_plus) return <span className={`${cls} rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1 backdrop-blur-sm`}><Crown className="w-2.5 h-2.5" />VIP+</span>;
  if (info.is_vip)      return <span className={`${cls} rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 backdrop-blur-sm`}><Crown className="w-2.5 h-2.5" />VIP</span>;
  return null;
}

function Avatar({ name, size = 36, hex }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const bg = hex || '#3b82f6';
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0 ring-2 ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${bg}, ${bg}cc)` }}>
      {initial}
    </div>
  );
}

// ============================================================
// Cards
// ============================================================
function PlaylistCover({ playlist, idx, className = '' }) {
  const items = playlist.items || [];
  if (!items.length) {
    return (
      <div className={`bg-gradient-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]} flex items-center justify-center ${className}`}>
        <ListMusic className="w-12 h-12 text-white/40" />
      </div>
    );
  }
  const visible = items.slice(0, Math.min(4, items.length));
  return (
    <div className={`grid grid-cols-2 grid-rows-2 ${className} relative`}>
      {visible.map((it, i) => (
        <div key={i} className="overflow-hidden relative">
          {it.poster_path ? (
            <img
              src={it.poster_path.startsWith('http') ? it.poster_path : `${TMDB_IMG}/w300${it.poster_path}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x450/1e293b/64748b?text=%3F'; }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${FALLBACK_GRADIENTS[(idx + i) % FALLBACK_GRADIENTS.length]} flex items-center justify-center`}>
              <Film className="w-5 h-5 text-white/50" />
            </div>
          )}
        </div>
      ))}
      {visible.length < 4 && Array.from({ length: 4 - visible.length }).map((_, i) => (
        <div key={`f-${i}`} className={`bg-gradient-to-br ${FALLBACK_GRADIENTS[(idx + i + 7) % FALLBACK_GRADIENTS.length]} opacity-70`} />
      ))}
    </div>
  );
}

function PlaylistGridCard({ playlist, idx }) {
  const isStaff = playlist.user_info?.is_admin || playlist.user_info?.is_uploader;
  const isHot = (playlist.likes_count || 0) - (playlist.dislikes_count || 0) >= 5;
  const types = useMemo(() => {
    const set = new Set();
    (playlist.items || []).forEach(it => it.content_type && set.add(it.content_type));
    return Array.from(set).slice(0, 3);
  }, [playlist.items]);

  return (
    <Link to={`/playlists/${playlist._id}`} className="group block relative" data-testid={`discover-playlist-${playlist._id}`}>
      {/* Glow background that animates on hover */}
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]} opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-500 pointer-events-none`} />

      <div className={`relative rounded-2xl overflow-hidden border bg-card/95 transition-all duration-300 group-hover:-translate-y-1 ${isStaff ? 'border-amber-400/50 shadow-lg shadow-amber-500/10' : 'border-white/10 group-hover:border-white/30'}`}>
        {/* Cover with overlay */}
        <div className="relative h-52 overflow-hidden">
          <PlaylistCover playlist={playlist} idx={idx} className="h-full" />
          {/* Strong gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {isStaff && (
                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-extrabold flex items-center gap-1 shadow-lg shadow-amber-500/40">
                  <Sparkles className="w-3 h-3" />STAFF
                </span>
              )}
              {isHot && (
                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-lg shadow-rose-500/40 animate-pulse">
                  <Flame className="w-3 h-3" />HOT
                </span>
              )}
            </div>
            <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-1">
              <ListMusic className="w-3 h-3" />{playlist.items_count || 0}
            </span>
          </div>

          {/* Type bubbles bottom-left */}
          <div className="absolute bottom-3 left-3 flex gap-1">
            {types.map(t => {
              const meta = TYPE_META[t] || TYPE_META.movie;
              const Icon = meta.icon;
              return (
                <span key={t} className={`w-7 h-7 rounded-full bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg ${meta.ring} ring-2 ring-black/40`} title={meta.label}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </span>
              );
            })}
          </div>

          {/* Title */}
          <div className="absolute bottom-3 right-3 left-20 text-right">
            <h3 className="font-black text-white text-lg md:text-xl leading-tight line-clamp-2 drop-shadow-2xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
              {playlist.name}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-2.5">
            <Avatar name={playlist.user_info?.username || playlist.username} size={32} hex={isStaff ? '#f59e0b' : '#3b82f6'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{playlist.user_info?.username || playlist.username || 'Anonyme'}</p>
              <div className="flex items-center gap-1.5"><UserBadge info={playlist.user_info} size="xs" /></div>
            </div>
          </div>

          {playlist.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{playlist.description}</p>
          )}

          {/* Stat strip */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <ThumbsUp className="w-3.5 h-3.5" />{playlist.likes_count || 0}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                <ThumbsDown className="w-3.5 h-3.5" />{playlist.dislikes_count || 0}
              </span>
            </div>
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Explorer<Eye className="w-3.5 h-3.5" />
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
    <Link to={`/playlists/${playlist._id}`} className="group flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-card/90 hover:bg-[#0b1220] hover:border-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-500/10" data-testid={`discover-playlist-${playlist._id}`}>
      <div className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${isStaff ? 'ring-2 ring-amber-400/70 ring-offset-2 ring-offset-black' : ''}`}>
        <PlaylistCover playlist={playlist} idx={idx} className="h-full w-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white truncate">{playlist.name}</h3>
          {isStaff && <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold">STAFF</span>}
          <UserBadge info={playlist.user_info} size="xs" />
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
          <Users className="w-3 h-3" /><span className="font-semibold text-slate-300">{playlist.user_info?.username || 'Anonyme'}</span>
          <span className="text-slate-600">·</span>
          <ListMusic className="w-3 h-3" />{playlist.items_count} élém.
        </p>
        {playlist.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{playlist.description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs font-bold">
        <span className="flex items-center gap-1 text-emerald-400"><ThumbsUp className="w-3.5 h-3.5" />{playlist.likes_count || 0}</span>
        <span className="flex items-center gap-1 text-rose-400"><ThumbsDown className="w-3.5 h-3.5" />{playlist.dislikes_count || 0}</span>
      </div>
    </Link>
  );
}

// ============================================================
// Sort dropdown
// ============================================================
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
        className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium flex items-center gap-2 min-w-[180px] justify-between text-white backdrop-blur-md transition-colors"
        data-testid="sort-dropdown-btn"
      >
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-cyan-400" />{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-white/15 bg-card/98 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 py-1.5 overflow-hidden">
          {SORT_OPTIONS.map(o => {
            const I = o.icon;
            const active = o.value === value;
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-white/5'}`}
                data-testid={`sort-${o.value}`}
              >
                <span className="flex items-center gap-2"><I className="w-4 h-4" />{o.label}</span>
                {active && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main page
// ============================================================
export default function DiscoverPlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total_playlists: 0, total_contributors: 0, total_items: 0, by_type: [] });
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [search, setSearch] = useState('');
  const [creatorRole, setCreatorRole] = useState('all');
  const [contentTypes, setContentTypes] = useState([]);
  const [minItems, setMinItems] = useState(0);
  const debouncedSearch = useDebounced(search, 350);

  const cPlaylists = useCountUp(stats.total_playlists);
  const cContributors = useCountUp(stats.total_contributors);
  const cItems = useCountUp(stats.total_items);

  useEffect(() => {
    API.get('/api/playlists/public/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [sortBy, debouncedSearch, creatorRole, contentTypes, minItems]);

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

  const activeChips = useMemo(() => {
    const chips = [];
    if (debouncedSearch) chips.push({ key: 'q', label: `"${debouncedSearch}"`, clear: () => setSearch('') });
    if (creatorRole !== 'all') {
      const r = ROLE_OPTIONS.find(o => o.value === creatorRole);
      chips.push({ key: 'role', label: r?.label || creatorRole, clear: () => setCreatorRole('all') });
    }
    contentTypes.forEach(t => chips.push({ key: `t-${t}`, label: TYPE_META[t]?.label || t, clear: () => toggleType(t) }));
    if (minItems > 0) chips.push({ key: 'min', label: `≥ ${minItems} items`, clear: () => setMinItems(0) });
    return chips;
  }, [debouncedSearch, creatorRole, contentTypes, minItems]);

  const clearAll = () => { setSearch(''); setCreatorRole('all'); setContentTypes([]); setMinItems(0); setSortBy('recent'); };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)' }} data-testid="discover-playlists-page">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.45), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--ring) / 0.4), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,182,212,0.12) 35%, rgba(59,130,246,0.18) 65%, rgba(168,85,247,0.15))' }}>
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          {/* Glow */}
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" />Communauté
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
                  <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #6ee7b7 40%, #67e8f9 70%, #c4b5fd 100%)' }}>
                    Découvrir
                  </span>
                  <span className="block text-white">des <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #34d399, #06b6d4, #a78bfa)' }}>Playlists</span></span>
                </h1>
                <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
                  Plonge dans les collections partagées par la communauté. <span className="text-white font-semibold">Films, séries, musique, jeux</span> — tout y est, trié pour toi.
                </p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:flex-shrink-0">
                {[
                  { value: cPlaylists,    label: 'Playlists',     hex: '#34d399', icon: ListMusic },
                  { value: cContributors, label: 'Contributeurs', hex: '#22d3ee', icon: Users },
                  { value: cItems,        label: 'Éléments',      hex: '#a78bfa', icon: Star },
                ].map(s => {
                  const I = s.icon;
                  return (
                    <div key={s.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-3 md:px-5 py-4 group hover:border-white/25 transition-colors">
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: s.hex }} />
                      <I className="w-4 h-4 mb-2" style={{ color: s.hex }} />
                      <p className="text-2xl md:text-4xl font-black tabular-nums" style={{ color: s.hex }}>{s.value}</p>
                      <p className="text-[10px] md:text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="relative rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl p-3 md:p-4 mb-5 sticky top-16 z-40 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une playlist..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                data-testid="discover-search-input"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10"><X className="w-3.5 h-3.5 text-slate-400" /></button>
              )}
            </div>

            <SortDropdown value={sortBy} onChange={setSortBy} />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showFilters || activeChips.length > 0 ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/20' : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'}`}
              data-testid="filters-toggle-btn"
            >
              <SlidersHorizontal className="w-4 h-4" />Filtres
              {activeChips.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/40">{activeChips.length}</span>
              )}
            </button>

            <div className="hidden sm:flex rounded-xl border border-white/15 bg-white/5 overflow-hidden" role="group">
              <button onClick={() => setView('grid')} className={`px-3 py-2.5 transition-colors ${view === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-slate-400'}`} data-testid="view-grid-btn"><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView('list')} className={`px-3 py-2.5 transition-colors ${view === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-slate-400'}`} data-testid="view-list-btn"><ListIcon className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="border-t border-white/10 mt-3 pt-3 grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="filters-panel">
              {/* Content type */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full bg-emerald-400" />Type de contenu
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_META).filter(([t]) => t !== 'episode').map(([t, meta]) => {
                    const I = meta.icon;
                    const active = contentTypes.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? `bg-gradient-to-br ${meta.from} ${meta.to} text-white shadow-lg ${meta.ring} scale-105` : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300'}`}
                        data-testid={`type-filter-${t}`}
                      >
                        <I className="w-3.5 h-3.5" />{meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auteur */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full bg-cyan-400" />Auteur
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(o => {
                    const I = o.icon;
                    const active = creatorRole === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setCreatorRole(o.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? 'text-white shadow-lg scale-105' : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300'}`}
                        style={active ? { background: `linear-gradient(135deg, ${o.hex}, ${o.hex}99)`, boxShadow: `0 6px 24px ${o.hex}55` } : {}}
                        data-testid={`role-filter-${o.value}`}
                      >
                        <I className="w-3.5 h-3.5" />{o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Min items */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-purple-400" />Taille minimum
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    {minItems > 0 ? `≥ ${minItems} éléments` : 'Aucune limite'}
                  </span>
                </div>
                <input
                  type="range" min={0} max={50} step={1} value={minItems}
                  onChange={e => setMinItems(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
                  style={{ background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${(minItems / 50) * 100}%, rgba(255,255,255,0.1) ${(minItems / 50) * 100}%, rgba(255,255,255,0.1) 100%)` }}
                  data-testid="min-items-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5"><span>0</span><span>10</span><span>25</span><span>50+</span></div>
              </div>
            </div>
          )}

          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center pt-3 mt-3 border-t border-white/10">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 mr-1 font-semibold">Actifs</span>
              {activeChips.map(c => (
                <button key={c.key} onClick={c.clear} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/25 transition-colors">
                  {c.label}<X className="w-3 h-3" />
                </button>
              ))}
              <button onClick={clearAll} className="text-[11px] text-slate-400 hover:text-white underline-offset-2 hover:underline ml-1">Tout effacer</button>
            </div>
          )}
        </div>

        {/* Results meta */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <p className="text-slate-400">
            {loading ? <span className="inline-block w-32 h-4 rounded bg-white/10 animate-pulse" /> : (
              <><span className="font-bold text-white text-base">{total}</span> playlist{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</>
            )}
          </p>
          {totalPages > 1 && <p className="text-xs text-slate-500">Page <span className="text-white font-semibold">{page}</span> / {totalPages}</p>}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-card/80 overflow-hidden animate-pulse">
                <div className="h-52 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="relative overflow-hidden text-center py-16 md:py-20 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/30 via-cyan-950/20 to-blue-950/30">
            <div className="absolute -top-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.4), transparent 70%)' }} />
            <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.5), transparent 70%)' }} />
            <div className="relative max-w-md mx-auto px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-cyan-500 mb-5 shadow-2xl shadow-cyan-500/40">
                <ListMusic className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff, #67e8f9)' }}>
                {activeChips.length > 0 ? 'Aucune playlist ne correspond' : 'Aucune playlist publique pour le moment'}
              </h3>
              <p className="text-slate-400 mb-6">
                {activeChips.length > 0 ? 'Ajuste tes filtres ou ta recherche pour découvrir d\'autres collections.' : 'Sois le premier à partager ta sélection avec la communauté !'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {activeChips.length > 0 ? (
                  <button onClick={clearAll} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/30 transition-all">
                    Réinitialiser les filtres
                  </button>
                ) : (
                  <Link to="/playlists" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />Créer ma playlist
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {playlists.map((p, i) => <PlaylistGridCard key={p._id} playlist={p} idx={i} />)}
          </div>
        ) : (
          <div className="space-y-2.5">
            {playlists.map((p, i) => <PlaylistListRow key={p._id} playlist={p} idx={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex justify-center items-center gap-2 mt-10" data-testid="discover-pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              ← Précédent
            </button>
            <span className="px-4 py-2 text-sm text-slate-400">Page <span className="text-white font-bold">{page}</span> / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
