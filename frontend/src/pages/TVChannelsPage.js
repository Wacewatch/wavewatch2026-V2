import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../lib/api';
import { Tv, Play, Search, ThumbsUp, ThumbsDown, Heart, ChevronDown, ArrowLeft, RefreshCw, Globe, Loader2 } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import IframeModal from '../components/IframeModal';

const CATEGORY_COLORS = {
  Generaliste: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Généraliste': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Divertissement: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Info: 'bg-red-500/15 text-red-300 border-red-500/30',
  Sport: 'bg-green-500/15 text-green-300 border-green-500/30',
  Documentaire: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Culture: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Premium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Jeunesse: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  Musique: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  Basic: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Satellite: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  General: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Câble: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

// ISO 3166-1 alpha-2 codes for flagcdn.com (Balkans is not a country -> uses generic globe fallback)
const COUNTRY_ISO = {
  France: 'fr', Italy: 'it', Spain: 'es', Portugal: 'pt', Germany: 'de',
  'United Kingdom': 'gb', Belgium: 'be', Netherlands: 'nl', Switzerland: 'ch',
  Albania: 'al', Turkey: 'tr', Arabia: 'sa', Russia: 'ru',
  Romania: 'ro', Poland: 'pl', Bulgaria: 'bg', Balkans: 'rs',
};

function FlagImg({ country, size = 'lg' }) {
  const iso = COUNTRY_ISO[country];
  const widths = { sm: 'w-6 h-4', md: 'w-9 h-6', lg: 'w-14 h-10' };
  const cdnW = { sm: 40, md: 80, lg: 160 };
  const cls = widths[size] || widths.lg;
  if (!iso) {
    return <div className={`${cls} flex items-center justify-center text-2xl`}>🌍</div>;
  }
  return (
    <img
      src={`https://flagcdn.com/w${cdnW[size]}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${cdnW[size] * 2}/${iso}.png 2x`}
      alt={country}
      className={`${cls} object-cover rounded-sm shadow-md ring-1 ring-black/30`}
      loading="lazy"
    />
  );
}

function ChannelCard({ channel, onWatch, onFavorite, onVote, userVote, isFavorite }) {
  const cat = channel.category || 'Autre';
  const catColor = CATEGORY_COLORS[cat] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  const likes = channel.likes || 0;
  const dislikes = channel.dislikes || 0;
  const country = channel.country ? (channel.country === 'FR' ? 'FR' : channel.country === 'France' ? 'France' : channel.country) : 'France';

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-4"
      data-testid={`channel-card-${channel.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/90 p-1 flex-shrink-0 flex items-center justify-center">
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
          <h3 className="font-bold text-lg truncate">{channel.name}</h3>
          <span className={`inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${catColor}`}>{cat}</span>
        </div>
        <button
          onClick={() => onFavorite(channel)}
          className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Favori"
          data-testid={`fav-${channel.name}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {channel.description || 'Aucune description disponible'}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{country}</span>
        <div className="flex gap-1.5">
          {channel.quality && <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-foreground font-semibold">{channel.quality}</span>}
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">LIVE</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-2 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm">
        <button
          onClick={() => onVote(channel, 'like')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'}`}
          data-testid={`like-${channel.name}`}
        >
          <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-green-400/30' : ''}`} />
          <span className="font-semibold text-green-400/90">{likes}</span>
        </button>
        <span className="w-px h-4 bg-border" />
        <button
          onClick={() => onVote(channel, 'dislike')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
          data-testid={`dislike-${channel.name}`}
        >
          <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-red-400/30' : ''}`} />
          <span className="font-semibold text-red-400/90">{dislikes}</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onWatch(channel)}
          className="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
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
          metadata={{ stream_url: channel.stream_url || channel.embed_url, category: channel.category }}
        />
      </div>
    </div>
  );
}

// LiveWatch-specific channel card (no votes/favorites since channels are external/transient)
function LiveWatchChannelCard({ channel, onWatch }) {
  const cat = channel.category || 'TV';
  const catColor = CATEGORY_COLORS[cat] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  const hasBackup = !!channel.backup_embed_url;
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-3"
      data-testid={`livewatch-card-${channel.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/90 p-1 flex-shrink-0 flex items-center justify-center">
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
          <h3 className="font-semibold text-sm truncate" title={channel.name}>{channel.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border ${catColor}`}>{cat}</span>
            {channel.quality && (
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border bg-secondary border-border text-foreground">{channel.quality}</span>
            )}
            {hasBackup && (
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border bg-amber-500/15 text-amber-300 border-amber-500/30">ALT</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onWatch(channel, false)}
          className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow shadow-red-600/20"
          data-testid={`livewatch-watch-${channel.id}`}
        >
          <Play className="w-4 h-4 fill-current" /> Regarder
        </button>
        {hasBackup && (
          <button
            onClick={() => onWatch(channel, true)}
            title="Source alternative (backup)"
            className="h-10 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            data-testid={`livewatch-alt-${channel.id}`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Alt
          </button>
        )}
      </div>
    </div>
  );
}

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

  // LiveWatch state
  const [lwCountries, setLwCountries] = useState([]);
  const [lwTotal, setLwTotal] = useState(0);
  const [lwSelectedCountry, setLwSelectedCountry] = useState(null);
  const [lwChannels, setLwChannels] = useState([]);
  const [lwLoading, setLwLoading] = useState(false);
  const [lwSearch, setLwSearch] = useState('');
  const [lwCategory, setLwCategory] = useState('all');
  const [lwSelected, setLwSelected] = useState(null); // {channel, useBackup}
  const [lwIframeKey, setLwIframeKey] = useState(0);

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

  // Load LiveWatch countries when switching to that source
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
      .finally(() => setLwLoading(false));
  }, [toast]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(channels.map(c => c.category).filter(Boolean)))], [channels]);

  const filtered = useMemo(() => channels.filter(c => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (search && !(c.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [channels, filter, search]);

  const lwCategories = useMemo(() => ['all', ...Array.from(new Set(lwChannels.map(c => c.category).filter(Boolean)))], [lwChannels]);
  const lwFiltered = useMemo(() => lwChannels.filter(c => {
    if (lwCategory !== 'all' && c.category !== lwCategory) return false;
    if (lwSearch && !(c.name || '').toLowerCase().includes(lwSearch.toLowerCase())) return false;
    return true;
  }), [lwChannels, lwCategory, lwSearch]);

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

  const lwCurrentSrc = lwSelected
    ? (lwSelected.useBackup ? lwSelected.channel.backup_embed_url : lwSelected.channel.embed_url)
    : null;

  return (
    <div className="container mx-auto px-4 py-10 md:py-14" data-testid="tv-channels-page">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Chaînes TV en Direct</h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg">Regardez vos chaînes préférées en streaming direct</p>
      </div>

      {/* Source toggle */}
      <div className="flex justify-center mb-8" data-testid="source-toggle">
        <div className="inline-flex p-1 rounded-xl bg-secondary/60 border border-border">
          <button
            onClick={() => setSource('wavewatch')}
            className={`px-5 md:px-8 h-11 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
              source === 'wavewatch'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="source-wavewatch-btn"
          >
            <Tv className="w-4 h-4" /> WaveWatch
          </button>
          <button
            onClick={() => setSource('livewatch')}
            className={`px-5 md:px-8 h-11 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
              source === 'livewatch'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="source-livewatch-btn"
          >
            <Globe className="w-4 h-4" /> LiveWatch
          </button>
        </div>
      </div>

      {source === 'wavewatch' && (
        <>
          <div className="flex flex-col md:flex-row gap-3 mb-10">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une chaîne..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors"
                data-testid="tv-search-input"
              />
            </div>
            <div className="relative md:w-56">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors cursor-pointer"
                data-testid="tv-category-filter"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'Toutes les catégories' : c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(ch => (
              <ChannelCard
                key={ch._id || ch.id || ch.name}
                channel={ch}
                onWatch={setSelectedChannel}
                onFavorite={handleFavorite}
                onVote={handleVote}
                userVote={userVotes[ch._id]}
                isFavorite={!!favorites[String(ch._id || ch.id || ch.name)]}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Tv className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucune chaîne trouvée</p>
            </div>
          )}
        </>
      )}

      {source === 'livewatch' && (
        <>
          {!lwSelectedCountry && (
            <>
              <div className="text-center mb-6 text-sm text-muted-foreground">
                {lwTotal > 0 && <span data-testid="livewatch-total">{lwTotal.toLocaleString()} chaînes disponibles dans {lwCountries.length} pays</span>}
              </div>
              {lwLoading ? (
                <div className="flex justify-center py-20" data-testid="livewatch-countries-loading">
                  <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="livewatch-countries-grid">
                  {lwCountries.map(c => (
                    <button
                      key={c.name}
                      onClick={() => loadLwChannels(c.name)}
                      className="bg-card border border-border rounded-2xl p-5 hover:border-red-500/60 hover:bg-red-500/5 transition-all duration-300 flex flex-col items-center gap-3 group"
                      data-testid={`country-btn-${c.name}`}
                    >
                      <div className="group-hover:scale-110 transition-transform">
                        <FlagImg country={c.name} size="lg" />
                      </div>
                      <span className="font-bold text-base text-center">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.total} chaînes</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {lwSelectedCountry && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  onClick={() => { setLwSelectedCountry(null); setLwChannels([]); }}
                  className="h-10 px-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-secondary transition-colors flex items-center gap-2 text-sm font-medium"
                  data-testid="livewatch-back-btn"
                >
                  <ArrowLeft className="w-4 h-4" /> Pays
                </button>
                <div className="flex items-center gap-3 text-lg font-bold">
                  <FlagImg country={lwSelectedCountry} size="md" />
                  {lwSelectedCountry}
                  <span className="text-sm text-muted-foreground font-normal">({lwChannels.length} chaînes)</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher une chaîne..."
                    value={lwSearch}
                    onChange={e => setLwSearch(e.target.value)}
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors"
                    data-testid="livewatch-search-input"
                  />
                </div>
                <div className="relative md:w-56">
                  <select
                    value={lwCategory}
                    onChange={e => setLwCategory(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors cursor-pointer"
                    data-testid="livewatch-category-filter"
                  >
                    {lwCategories.map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'Toutes les catégories' : c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {lwLoading ? (
                <div className="flex justify-center py-20" data-testid="livewatch-channels-loading">
                  <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="livewatch-channels-grid">
                  {lwFiltered.map(ch => (
                    <LiveWatchChannelCard key={ch.id} channel={ch} onWatch={openLwChannel} />
                  ))}
                </div>
              )}

              {!lwLoading && lwFiltered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Tv className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Aucune chaîne trouvée</p>
                </div>
              )}
            </>
          )}
        </>
      )}

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
            <div className="flex-1 bg-black">
              {selectedChannel.stream_url ? (
                <div className="w-full h-full sm:aspect-video sm:h-auto">
                  <iframe src={selectedChannel.stream_url} title={selectedChannel.name} className="w-full h-full block" allowFullScreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
                </div>
              ) : (
                <div className="w-full h-full sm:aspect-video sm:h-auto flex flex-col items-center justify-center text-muted-foreground bg-black">
                  <Tv className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">Aucun flux disponible</p>
                  <p className="text-sm mt-1 opacity-70">Le flux de cette chaîne n'est pas encore configuré</p>
                </div>
              )}
            </div>
            {selectedChannel.description && (
              <div className="p-4 border-t border-border bg-card">
                <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        </IframeModal>
      )}

      {/* LiveWatch player modal with backup toggle */}
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
            <div className="flex-1 bg-black">
              {lwCurrentSrc ? (
                <div className="w-full h-full sm:aspect-video sm:h-auto">
                  <iframe
                    key={lwIframeKey}
                    src={lwCurrentSrc}
                    title={lwSelected.channel.name}
                    className="w-full h-full block"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    data-testid="livewatch-iframe"
                  />
                </div>
              ) : (
                <div className="w-full h-full sm:aspect-video sm:h-auto flex flex-col items-center justify-center text-muted-foreground bg-black">
                  <Tv className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">Aucun flux disponible</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border bg-card flex flex-wrap items-center gap-3 justify-between">
              <div className="text-xs text-muted-foreground">
                Source actuelle : <span className="font-semibold text-foreground">{lwSelected.useBackup ? 'Backup' : 'Principal'}</span>
                {lwSelected.channel.category && <> • {lwSelected.channel.category}</>}
                {lwSelected.channel.quality && <> • {lwSelected.channel.quality}</>}
              </div>
              {lwSelected.channel.backup_embed_url && (
                <button
                  onClick={toggleBackup}
                  className={`h-9 px-4 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors ${
                    lwSelected.useBackup
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-secondary hover:bg-secondary/80 border border-border text-foreground'
                  }`}
                  data-testid="livewatch-backup-toggle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {lwSelected.useBackup ? 'Revenir au principal' : 'Charger lien backup'}
                </button>
              )}
            </div>
          </div>
        </IframeModal>
      )}
    </div>
  );
}
