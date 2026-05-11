import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import API from '../lib/api';
import {
  Tv, Play, Search, ThumbsUp, ThumbsDown, Heart, ChevronDown, ArrowLeft,
  RefreshCw, Globe, Loader2, Radio, Sparkles, Zap, Layers, X,
} from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import IframeModal from '../components/IframeModal';

// ============================================================
// Constants
// ============================================================
const CATEGORY_META = {
  'Généraliste': { hex: '#3b82f6', from: 'from-blue-500/90', to: 'to-indigo-500/90', ring: 'shadow-blue-500/30' },
  Generaliste:    { hex: '#3b82f6', from: 'from-blue-500/90', to: 'to-indigo-500/90', ring: 'shadow-blue-500/30' },
  Divertissement: { hex: '#8b5cf6', from: 'from-violet-500/90', to: 'to-purple-500/90', ring: 'shadow-violet-500/30' },
  Info:           { hex: '#ef4444', from: 'from-red-500/90', to: 'to-rose-500/90', ring: 'shadow-red-500/30' },
  Sport:          { hex: '#10b981', from: 'from-emerald-500/90', to: 'to-green-500/90', ring: 'shadow-emerald-500/30' },
  Documentaire:   { hex: '#f59e0b', from: 'from-amber-500/90', to: 'to-orange-500/90', ring: 'shadow-amber-500/30' },
  Culture:        { hex: '#a855f7', from: 'from-purple-500/90', to: 'to-fuchsia-500/90', ring: 'shadow-purple-500/30' },
  Premium:        { hex: '#eab308', from: 'from-yellow-500/90', to: 'to-amber-500/90', ring: 'shadow-yellow-500/30' },
  Jeunesse:       { hex: '#ec4899', from: 'from-pink-500/90', to: 'to-rose-500/90', ring: 'shadow-pink-500/30' },
  Musique:        { hex: '#d946ef', from: 'from-fuchsia-500/90', to: 'to-pink-500/90', ring: 'shadow-fuchsia-500/30' },
  Basic:          { hex: '#3b82f6', from: 'from-blue-500/90', to: 'to-indigo-500/90', ring: 'shadow-blue-500/30' },
  Satellite:      { hex: '#06b6d4', from: 'from-cyan-500/90', to: 'to-sky-500/90', ring: 'shadow-cyan-500/30' },
  General:        { hex: '#64748b', from: 'from-slate-500/90', to: 'to-gray-500/90', ring: 'shadow-slate-500/30' },
  'Câble':        { hex: '#6366f1', from: 'from-indigo-500/90', to: 'to-blue-500/90', ring: 'shadow-indigo-500/30' },
};
const DEFAULT_CAT_META = { hex: '#94a3b8', from: 'from-slate-500/90', to: 'to-gray-500/90', ring: 'shadow-slate-500/30' };

const COUNTRY_ISO = {
  France: 'fr', Italy: 'it', Spain: 'es', Portugal: 'pt', Germany: 'de',
  'United Kingdom': 'gb', Belgium: 'be', Netherlands: 'nl', Switzerland: 'ch',
  Albania: 'al', Turkey: 'tr', Arabia: 'sa', Russia: 'ru',
  Romania: 'ro', Poland: 'pl', Bulgaria: 'bg', Balkans: 'rs',
};

const COUNTRY_GRADIENTS = [
  'from-violet-600 via-fuchsia-600 to-pink-600',
  'from-emerald-500 via-cyan-500 to-blue-600',
  'from-amber-500 via-orange-500 to-red-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-cyan-500 via-blue-500 to-indigo-600',
  'from-red-600 via-orange-500 to-amber-500',
  'from-teal-500 via-cyan-500 to-blue-500',
];

// ============================================================
// Hooks
// ============================================================
function useCountUp(target, duration = 900) {
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

function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

// ============================================================
// Small components
// ============================================================
function FlagImg({ country, size = 'lg' }) {
  const iso = COUNTRY_ISO[country];
  const dims = { sm: { cls: 'w-6 h-4', w: 40 }, md: { cls: 'w-9 h-6', w: 80 }, lg: { cls: 'w-16 h-12', w: 160 }, xl: { cls: 'w-24 h-16', w: 240 } };
  const d = dims[size] || dims.lg;
  if (!iso) return <div className={`${d.cls} flex items-center justify-center text-2xl`}>🌍</div>;
  return (
    <img
      src={`https://flagcdn.com/w${d.w}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${d.w * 2}/${iso}.png 2x`}
      alt={country}
      className={`${d.cls} object-cover rounded-md shadow-lg ring-1 ring-black/40`}
      loading="lazy"
    />
  );
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-3 sm:px-4 py-3.5 group hover:border-white/25 transition-colors"
      data-testid={`stat-tile-${label}`}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: `radial-gradient(closest-side, ${accent}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, boxShadow: `0 4px 18px ${accent}55` }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold leading-none tabular-nums">{value.toLocaleString()}</div>
          <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-white/60 mt-1 font-semibold truncate">{label}</div>
        </div>
      </div>
    </div>
  );
}

function CategoryPill({ cat, active, onClick, count }) {
  const meta = CATEGORY_META[cat] || DEFAULT_CAT_META;
  const isAll = cat === 'all';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
        active
          ? isAll
            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/40 scale-105'
            : `bg-gradient-to-br ${meta.from} ${meta.to} text-white shadow-lg ${meta.ring} scale-105`
          : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
      }`}
      data-testid={`cat-pill-${cat}`}
    >
      {isAll ? <Sparkles className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#fff' : meta.hex }} />}
      <span>{isAll ? 'Toutes' : cat}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${active ? 'bg-white/25' : 'bg-white/10'}`}>{count}</span>
      )}
    </button>
  );
}

// ============================================================
// Wavewatch Channel Card (with votes & favorites)
// ============================================================
function ChannelCard({ channel, onWatch, onFavorite, onVote, userVote, isFavorite, idx }) {
  const cat = channel.category || 'Autre';
  const meta = CATEGORY_META[cat] || DEFAULT_CAT_META;
  const likes = channel.likes || 0;
  const dislikes = channel.dislikes || 0;
  const country = channel.country || 'France';
  const grad = COUNTRY_GRADIENTS[idx % COUNTRY_GRADIENTS.length];

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${Math.min(idx, 20) * 30}ms` }}
      data-testid={`channel-card-${channel.name}`}
    >
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none`} />

      <div className="relative bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-white/25 rounded-2xl p-4 transition-all duration-300 flex flex-col gap-3 h-full">
        <div className="flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-xl overflow-hidden bg-white/95 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform"
            style={{ boxShadow: `0 6px 22px ${meta.hex}33` }}
          >
            {(channel.logo || channel.logo_url) ? (
              <img
                src={channel.logo || channel.logo_url}
                alt={channel.name}
                className="w-full h-full object-contain"
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">TV</div>'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">TV</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white truncate">{channel.name}</h3>
            <span
              className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow"
              style={{ background: `linear-gradient(135deg, ${meta.hex}, ${meta.hex}aa)` }}
            >
              {cat}
            </span>
          </div>
          <button
            onClick={() => onFavorite(channel)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
            aria-label="Favori"
            data-testid={`fav-${channel.name}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/40 hover:text-white/80'}`} />
          </button>
        </div>

        <p className="text-xs text-white/60 line-clamp-2 min-h-[2rem]">
          {channel.description || 'Aucune description disponible'}
        </p>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/50 flex items-center gap-1.5"><Globe className="w-3 h-3" /> {country}</span>
          <div className="flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 font-bold">HD</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          <button
            onClick={() => onVote(channel, 'like')}
            className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-emerald-400' : 'text-white/50 hover:text-emerald-400'}`}
            data-testid={`like-${channel.name}`}
          >
            <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-emerald-400/30' : ''}`} />
            <span className="font-bold tabular-nums">{likes}</span>
          </button>
          <span className="w-px h-4 bg-white/10" />
          <button
            onClick={() => onVote(channel, 'dislike')}
            className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-rose-400' : 'text-white/50 hover:text-rose-400'}`}
            data-testid={`dislike-${channel.name}`}
          >
            <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-rose-400/30' : ''}`} />
            <span className="font-bold tabular-nums">{dislikes}</span>
          </button>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onWatch(channel)}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-95"
            data-testid={`watch-${channel.name}`}
          >
            <Play className="w-4 h-4 fill-current" /> Regarder
          </button>
          <QuickPlaylistAdd
            contentId={channel._id || channel.id || channel.name}
            contentType="tv_channel"
            title={channel.name}
            posterPath={channel.logo || channel.logo_url}
            inline
            metadata={{ stream_url: channel.stream_url, category: channel.category }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LiveWatch Channel Card
// ============================================================
function LiveWatchChannelCard({ channel, onWatch, idx }) {
  const cat = channel.category || 'TV';
  const meta = CATEGORY_META[cat] || DEFAULT_CAT_META;
  const grad = COUNTRY_GRADIENTS[idx % COUNTRY_GRADIENTS.length];
  const hasBackup = !!channel.backup_embed_url;
  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${Math.min(idx, 20) * 25}ms` }}
      data-testid={`livewatch-card-${channel.id}`}
    >
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 pointer-events-none`} />
      <div className="relative bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-white/25 rounded-2xl p-3.5 transition-all duration-300 flex flex-col gap-2.5 h-full">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden bg-white/95 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform"
            style={{ boxShadow: `0 4px 16px ${meta.hex}33` }}
          >
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain"
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">TV</div>'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">TV</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-white truncate" title={channel.name}>{channel.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow" style={{ background: `linear-gradient(135deg, ${meta.hex}, ${meta.hex}aa)` }}>{cat}</span>
              {channel.quality && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">{channel.quality}</span>
              )}
              {hasBackup && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">ALT</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onWatch(channel, false)}
            className="flex-1 h-9 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-95"
            data-testid={`livewatch-watch-${channel.id}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Regarder
          </button>
          {hasBackup && (
            <button
              onClick={() => onWatch(channel, true)}
              title="Source alternative (backup)"
              className="h-9 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
              data-testid={`livewatch-alt-${channel.id}`}
            >
              <RefreshCw className="w-3 h-3" /> Alt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Country Card
// ============================================================
function CountryCard({ country, onClick, idx }) {
  const grad = COUNTRY_GRADIENTS[idx % COUNTRY_GRADIENTS.length];
  return (
    <button
      onClick={onClick}
      className="group relative animate-fade-in text-left"
      style={{ animationDelay: `${idx * 40}ms` }}
      data-testid={`country-btn-${country.name}`}
    >
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-500 pointer-events-none`} />
      <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 group-hover:border-white/30 bg-[#0b1220]/80 backdrop-blur-md transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-[0.08] group-hover:opacity-20 transition-opacity`} />
        <div className="relative p-5 flex flex-col items-center gap-3">
          <div className="group-hover:scale-110 transition-transform duration-500">
            <FlagImg country={country.name} size="lg" />
          </div>
          <div className="text-center">
            <div className="font-extrabold text-base md:text-lg text-white tracking-tight">{country.name}</div>
            <div className="text-[11px] text-white/60 mt-1 font-semibold uppercase tracking-wider">
              {country.total.toLocaleString()} chaînes
            </div>
          </div>
          <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${grad} text-white shadow-lg opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all`}>
            <Play className="w-2.5 h-2.5 fill-current" /> Explorer
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// Main page
// ============================================================
export default function TVChannelsPage() {
  // Source toggle: 'wavewatch' (local DB) or 'livewatch' (external API)
  const [source, setSource] = useState('wavewatch');

  // Wavewatch state
  const [channels, setChannels] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();
  const dSearch = useDebounced(search, 200);

  // LiveWatch state
  const [lwCountries, setLwCountries] = useState([]);
  const [lwTotal, setLwTotal] = useState(0);
  const [lwSelectedCountry, setLwSelectedCountry] = useState(null);
  const [lwChannels, setLwChannels] = useState([]);
  const [lwLoading, setLwLoading] = useState(false);
  const [lwSearch, setLwSearch] = useState('');
  const [lwCategory, setLwCategory] = useState('all');
  const [lwSelected, setLwSelected] = useState(null);
  const [lwIframeKey, setLwIframeKey] = useState(0);
  const dLwSearch = useDebounced(lwSearch, 200);

  const channelsListRef = useRef(null);

  const loadChannels = useCallback(() => {
    API.get('/api/tv-channels').then(({ data }) => setChannels(data.channels || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadChannels();
    if (user) {
      API.get('/api/user/favorites').then(({ data }) => {
        const map = {};
        (data.favorites || []).filter(f => f.content_type === 'tv_channel').forEach(f => { map[String(f.content_id)] = true; });
        setFavorites(map);
      }).catch(() => {});
      API.get('/api/media-votes/mine').then(({ data }) => {
        const vmap = {};
        (data.votes || []).filter(v => v.target_collection === 'tv_channels').forEach(v => { vmap[v.target_id] = v.vote; });
        setUserVotes(vmap);
      }).catch(() => {});
    }
  }, [user, loadChannels]);

  useEffect(() => {
    if (source !== 'livewatch' || lwCountries.length > 0) return;
    setLwLoading(true);
    API.get('/api/livewatch/countries')
      .then(({ data }) => {
        const totals = {};
        (data.per_country || []).forEach(p => { totals[p.country] = p.total; });
        const list = (data.countries || []).map(c => ({ name: c, total: totals[c] || 0 }));
        list.sort((a, b) => b.total - a.total);
        setLwCountries(list);
        setLwTotal(data.total || 0);
      })
      .catch(() => toast({ title: 'Impossible de charger les pays LiveWatch', variant: 'destructive' }))
      .finally(() => setLwLoading(false));
  }, [source, lwCountries.length, toast]);

  const loadLwChannels = useCallback((country) => {
    setLwSelectedCountry(country);
    setLwChannels([]);
    setLwSearch('');
    setLwCategory('all');
    setLwLoading(true);
    API.get('/api/livewatch/channels', { params: { country } })
      .then(({ data }) => setLwChannels(data.channels || []))
      .catch(() => toast({ title: 'Impossible de charger les chaînes', variant: 'destructive' }))
      .finally(() => {
        setLwLoading(false);
        setTimeout(() => channelsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      });
  }, [toast]);

  // Wavewatch derived
  const catCounts = useMemo(() => {
    const m = {};
    channels.forEach(c => { const k = c.category || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [channels]);
  const categories = useMemo(() => ['all', ...Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])], [catCounts]);
  const filtered = useMemo(() => channels.filter(c => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (dSearch && !(c.name || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [channels, filter, dSearch]);

  // LiveWatch derived
  const lwCatCounts = useMemo(() => {
    const m = {};
    lwChannels.forEach(c => { const k = c.category || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [lwChannels]);
  const lwCategories = useMemo(() => ['all', ...Object.keys(lwCatCounts).sort((a, b) => lwCatCounts[b] - lwCatCounts[a])], [lwCatCounts]);
  const lwFiltered = useMemo(() => lwChannels.filter(c => {
    if (lwCategory !== 'all' && c.category !== lwCategory) return false;
    if (dLwSearch && !(c.name || '').toLowerCase().includes(dLwSearch.toLowerCase())) return false;
    return true;
  }), [lwChannels, lwCategory, dLwSearch]);

  // Stats animations
  const totalChannels = source === 'wavewatch' ? channels.length : lwTotal;
  const totalCats = source === 'wavewatch' ? Object.keys(catCounts).length : lwCountries.length;
  const totalFiltered = source === 'wavewatch' ? filtered.length : (lwSelectedCountry ? lwFiltered.length : lwTotal);
  const cChannels = useCountUp(totalChannels);
  const cCats = useCountUp(totalCats);
  const cFiltered = useCountUp(totalFiltered);

  // Actions
  const handleFavorite = async (ch) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = ch._id || ch.id || ch.name;
      await API.post('/api/user/favorites', {
        content_id: id, content_type: 'tv_channel', title: ch.name, poster_path: ch.logo || ch.logo_url, metadata: { stream_url: ch.stream_url, category: ch.category }
      });
      setFavorites(p => ({ ...p, [String(id)]: !p[String(id)] }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleVote = async (ch, vote) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = ch._id;
      const { data } = await API.post(`/api/tv-channels/${id}/vote`, { vote });
      setChannels(prev => prev.map(c => c._id === id ? { ...c, likes: data.likes, dislikes: data.dislikes } : c));
      setUserVotes(prev => ({ ...prev, [id]: data.user_vote }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const openLwChannel = (channel, useBackup = false) => setLwSelected({ channel, useBackup });
  const closeLwChannel = () => setLwSelected(null);
  const toggleBackup = () => {
    setLwSelected(s => s ? { ...s, useBackup: !s.useBackup } : s);
    setLwIframeKey(k => k + 1);
  };
  const lwCurrentSrc = lwSelected ? (lwSelected.useBackup ? lwSelected.channel.backup_embed_url : lwSelected.channel.embed_url) : null;

  return (
    <div
      className="relative min-h-screen text-white"
      style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }}
      data-testid="tv-channels-page"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(239,68,68,0.55), transparent 70%)', animation: 'tv-pulse 9s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(244,114,182,0.5), transparent 70%)', animation: 'tv-pulse 11s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.5), transparent 70%)', animation: 'tv-pulse 13s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes tv-pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.15); opacity: 0.55; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out backwards; }
      `}</style>

      <div className="relative container mx-auto px-3 sm:px-4 py-8 md:py-12 max-w-[1400px]">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-6 md:mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(244,114,182,0.12) 35%, rgba(168,85,247,0.18) 65%, rgba(99,102,241,0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(239,68,68,0.6), transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-10 w-96 h-96 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)' }} />

          <div className="relative p-5 sm:p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-widest text-white/85 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> En direct • Live TV
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #fca5a5 40%, #f9a8d4 70%, #c4b5fd 100%)' }}>
                    Chaînes TV
                  </span>
                  <span className="block text-white">
                    en <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #ec4899, #a855f7)' }}>Direct</span>
                  </span>
                </h1>
                <p className="mt-4 text-sm sm:text-base text-white/70 max-w-xl">
                  Plus de 9 000 chaînes du monde entier en streaming live. Sport, infos, divertissement — tout est là, en HD, sans interruption.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:max-w-xl">
                <StatTile icon={Tv}     label="Chaînes"    value={cChannels} accent="rgba(239,68,68,0.7)" />
                <StatTile icon={Globe}  label={source === 'wavewatch' ? 'Catégories' : 'Pays'} value={cCats} accent="rgba(168,85,247,0.7)" />
                <StatTile icon={Zap}    label="Affichées"  value={cFiltered} accent="rgba(244,114,182,0.7)" />
              </div>
            </div>

            {/* Source toggle */}
            <div className="mt-6 sm:mt-8 flex justify-center lg:justify-start" data-testid="source-toggle">
              <div className="inline-flex p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl shadow-black/40">
                <button
                  onClick={() => setSource('wavewatch')}
                  className={`px-4 sm:px-6 h-11 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    source === 'wavewatch'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/40 scale-[1.02]'
                      : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="source-wavewatch-btn"
                >
                  <Layers className="w-4 h-4" /> WaveWatch
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${source === 'wavewatch' ? 'bg-white/25' : 'bg-white/10'}`}>{channels.length}</span>
                </button>
                <button
                  onClick={() => setSource('livewatch')}
                  className={`px-4 sm:px-6 h-11 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    source === 'livewatch'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/40 scale-[1.02]'
                      : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid="source-livewatch-btn"
                >
                  <Globe className="w-4 h-4" /> LiveWatch
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${source === 'livewatch' ? 'bg-white/25' : 'bg-white/10'}`}>{lwTotal || '9k+'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WAVEWATCH */}
        {source === 'wavewatch' && (
          <>
            {/* Sticky filter bar */}
            <div className="sticky top-16 z-40 mb-6 rounded-2xl border border-white/10 bg-[#0b1220]/85 backdrop-blur-xl p-3 md:p-4 shadow-xl shadow-black/40">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Rechercher une chaîne..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-red-500/50 focus:bg-white/10 transition-colors"
                      data-testid="tv-search-input"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                  {categories.map(c => (
                    <CategoryPill key={c} cat={c} active={filter === c} onClick={() => setFilter(c)} count={c === 'all' ? channels.length : catCounts[c]} />
                  ))}
                </div>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                {filtered.map((ch, i) => (
                  <ChannelCard
                    key={ch._id || ch.id || ch.name}
                    channel={ch}
                    idx={i}
                    onWatch={setSelectedChannel}
                    onFavorite={handleFavorite}
                    onVote={handleVote}
                    userVote={userVotes[ch._id]}
                    isFavorite={!!favorites[String(ch._id || ch.id || ch.name)]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Aucune chaîne trouvée" sub="Essayez d'ajuster vos filtres" />
            )}
          </>
        )}

        {/* LIVEWATCH */}
        {source === 'livewatch' && !lwSelectedCountry && (
          <>
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
                <Globe className="w-5 h-5 text-fuchsia-400" /> Choisir un pays
              </h2>
              <span className="text-sm text-white/60">{lwCountries.length} pays</span>
            </div>
            {lwLoading ? (
              <LoaderBlock />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3" data-testid="livewatch-countries-grid">
                {lwCountries.map((c, i) => (
                  <CountryCard key={c.name} country={c} idx={i} onClick={() => loadLwChannels(c.name)} />
                ))}
              </div>
            )}
          </>
        )}

        {source === 'livewatch' && lwSelectedCountry && (
          <>
            <div ref={channelsListRef} className="sticky top-16 z-40 mb-6 rounded-2xl border border-white/10 bg-[#0b1220]/85 backdrop-blur-xl p-3 md:p-4 shadow-xl shadow-black/40">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setLwSelectedCountry(null); setLwChannels([]); }}
                    className="h-10 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-bold flex items-center gap-2 transition-colors"
                    data-testid="livewatch-back-btn"
                  >
                    <ArrowLeft className="w-4 h-4" /> Pays
                  </button>
                  <div className="flex items-center gap-2.5">
                    <FlagImg country={lwSelectedCountry} size="md" />
                    <div>
                      <div className="font-extrabold text-base md:text-lg">{lwSelectedCountry}</div>
                      <div className="text-[11px] text-white/55 font-semibold uppercase tracking-wider">{lwChannels.length} chaînes</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Rechercher une chaîne..."
                      value={lwSearch}
                      onChange={e => setLwSearch(e.target.value)}
                      className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-fuchsia-500/50 focus:bg-white/10 transition-colors"
                      data-testid="livewatch-search-input"
                    />
                    {lwSearch && (
                      <button onClick={() => setLwSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                  {lwCategories.map(c => (
                    <CategoryPill key={c} cat={c} active={lwCategory === c} onClick={() => setLwCategory(c)} count={c === 'all' ? lwChannels.length : lwCatCounts[c]} />
                  ))}
                </div>
              </div>
            </div>

            {lwLoading ? (
              <LoaderBlock />
            ) : lwFiltered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3" data-testid="livewatch-channels-grid">
                {lwFiltered.map((ch, i) => (
                  <LiveWatchChannelCard key={ch.id} channel={ch} idx={i} onWatch={openLwChannel} />
                ))}
              </div>
            ) : (
              <EmptyState text="Aucune chaîne trouvée" sub="Essayez d'ajuster vos filtres" />
            )}
          </>
        )}
      </div>

      {/* WaveWatch player modal */}
      {selectedChannel && (
        <IframeModal
          src={selectedChannel.stream_url}
          title={selectedChannel.name}
          onClose={() => setSelectedChannel(null)}
          icon={(selectedChannel.logo || selectedChannel.logo_url) ? (
            <img src={selectedChannel.logo || selectedChannel.logo_url} alt="" className="h-7 w-auto object-contain bg-white/90 rounded p-0.5" />
          ) : null}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 bg-black">
              {selectedChannel.stream_url ? (
                <iframe src={selectedChannel.stream_url} title={selectedChannel.name} className="w-full h-full block border-0" allowFullScreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                  <Tv className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">Aucun flux disponible</p>
                </div>
              )}
            </div>
            {selectedChannel.description && (
              <div className="shrink-0 p-4 border-t border-white/10 bg-black/80">
                <p className="text-sm text-white/70">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        </IframeModal>
      )}

      {/* LiveWatch player modal */}
      {lwSelected && (
        <IframeModal
          src={lwCurrentSrc}
          title={lwSelected.channel.name}
          onClose={closeLwChannel}
          icon={lwSelected.channel.logo ? (
            <img src={lwSelected.channel.logo} alt="" className="h-7 w-auto object-contain bg-white/90 rounded p-0.5" />
          ) : null}
        >
          <div className="flex flex-col h-full" data-testid="livewatch-player">
            <div className="flex-1 min-h-0 bg-black">
              {lwCurrentSrc ? (
                <iframe
                  key={lwIframeKey}
                  src={lwCurrentSrc}
                  title={lwSelected.channel.name}
                  className="w-full h-full block border-0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  data-testid="livewatch-iframe"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                  <Tv className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">Aucun flux disponible</p>
                </div>
              )}
            </div>
            <div className="shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 border-t border-white/10 bg-black/80 backdrop-blur-sm flex flex-wrap items-center gap-2 sm:gap-3 justify-between">
              <div className="text-[11px] sm:text-xs text-white/65 min-w-0 truncate">
                Source : <span className="font-bold text-white">{lwSelected.useBackup ? 'Backup' : 'Principal'}</span>
                {lwSelected.channel.category && <> • {lwSelected.channel.category}</>}
                {lwSelected.channel.quality && <> • {lwSelected.channel.quality}</>}
              </div>
              {lwSelected.channel.backup_embed_url && (
                <button
                  onClick={toggleBackup}
                  className={`h-9 px-3 sm:px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                    lwSelected.useBackup
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200'
                  }`}
                  data-testid="livewatch-backup-toggle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lwSelected.useBackup ? 'Revenir au principal' : 'Charger lien backup'}</span>
                  <span className="sm:hidden">{lwSelected.useBackup ? 'Principal' : 'Backup'}</span>
                </button>
              )}
            </div>
          </div>
        </IframeModal>
      )}
    </div>
  );
}

function LoaderBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="page-loader">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-fuchsia-600 opacity-30 blur-xl animate-pulse" />
        <Loader2 className="w-12 h-12 text-red-400 animate-spin absolute inset-0 m-auto" />
      </div>
      <p className="mt-4 text-sm text-white/60 font-semibold uppercase tracking-widest">Chargement…</p>
    </div>
  );
}

function EmptyState({ text, sub }) {
  return (
    <div className="relative overflow-hidden text-center py-16 md:py-20 rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/30 via-fuchsia-950/20 to-purple-950/30">
      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-4">
        <Tv className="w-10 h-10 text-white/40" />
      </div>
      <h3 className="text-lg md:text-xl font-extrabold text-white">{text}</h3>
      {sub && <p className="mt-2 text-sm text-white/55">{sub}</p>}
    </div>
  );
}
