import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { Download, Search, ChevronDown, Filter, User, Globe, Clock, Film, Tv, ExternalLink, Crown } from 'lucide-react';
import { qualityColor, linkHref, timeAgo } from '../components/DownloadLinksRow';

const QUALITIES = ['', 'FHD', 'HD', '4K', 'SD'];
const LANGUAGES = ['', 'multi', 'truefrench', 'french', 'vostfr', 'vf', 'vo'];
const TYPE_LABELS = { movie: 'Films', tv: 'Séries', anime: 'Animes', episode: 'Épisodes' };
const SORTS = [
  { v: 'created_at.desc', label: 'Plus récents' },
  { v: 'created_at.asc', label: 'Plus anciens' },
  { v: 'profiles(username).asc', label: 'Uploader A→Z' },
  { v: 'profiles(username).desc', label: 'Uploader Z→A' },
  { v: 'quality.asc', label: 'Qualité ↑' },
  { v: 'quality.desc', label: 'Qualité ↓' },
];

function FullLinkCard({ item }) {
  const poster = item.poster_path ? `${TMDB_IMG}/w342${item.poster_path}` : 'https://placehold.co/342x513/1e293b/64748b?text=%3F';
  const isTv = item.media_type === 'tv';
  const isGroup = item.group_type === 'tv_season';
  const episodeLabel = isGroup
    ? (item.episode_count > 1
        ? `S${item.season_number} ${item.episode_range}`
        : `S${item.season_number}${item.episode_range ? ' ' + item.episode_range : ''}`)
    : null;
  const isUploaderAdmin = item.uploader_role === 'admin';
  const qualities = item.qualities || [];
  const languages = item.languages || [];
  const primaryQuality = qualities[0] || item.quality;
  const primaryLang = languages[0] || item.language;
  return (
    <Link to={linkHref(item)} className="group block" data-testid={`dl-item-${item.tmdb_id}-${item.season_number ?? 'movie'}`}>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-[1.02] group-hover:border-primary/40 flex flex-col h-full">
        <div className="aspect-[2/3] overflow-hidden relative">
          <img src={poster} alt={item.title} loading="lazy" className="w-full h-full object-cover" onError={e => { e.target.src = 'https://placehold.co/342x513/1e293b/64748b?text=%3F'; }} />
          {primaryQuality && (
            <div className={`absolute top-2 left-2 text-[11px] font-extrabold px-2 py-0.5 rounded border ${qualityColor(primaryQuality)} shadow-lg`}>
              {String(primaryQuality).toUpperCase()}
              {qualities.length > 1 && <span className="ml-0.5 opacity-80">+{qualities.length - 1}</span>}
            </div>
          )}
          <div className="absolute top-2 right-2 p-1 rounded bg-black/70 backdrop-blur-sm shadow-lg">
            {isTv ? <Tv className="w-3.5 h-3.5 text-white" /> : <Film className="w-3.5 h-3.5 text-white" />}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-2 px-2">
            {episodeLabel && (
              <div className="inline-block text-[11px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 rounded mb-1">
                {episodeLabel}
                {item.episode_count > 1 && <span className="ml-1 opacity-90">· {item.episode_count} ép.</span>}
              </div>
            )}
            <p className="text-[11px] text-white flex items-center gap-1 font-medium drop-shadow"><Clock className="w-3 h-3" />{timeAgo(item.latest_created_at || item.created_at)}</p>
          </div>
        </div>
        <div className="p-2 flex flex-col gap-1.5 flex-1">
          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{item.title}</p>
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-medium">
            {primaryLang && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Globe className="w-2.5 h-2.5" />{String(primaryLang).toUpperCase()}
                {languages.length > 1 && <span className="ml-0.5 opacity-70">+{languages.length - 1}</span>}
              </span>
            )}
            {item.resolution && <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">{item.resolution}</span>}
          </div>
          {/* Uploader */}
          <div className="flex items-center gap-1 text-[10px] mt-auto pt-1 border-t border-border/50">
            {isUploaderAdmin ? <Crown className="w-2.5 h-2.5 text-yellow-400" /> : <User className="w-2.5 h-2.5 text-muted-foreground" />}
            <span className={`truncate ${isUploaderAdmin ? 'text-yellow-400 font-semibold' : 'text-muted-foreground'}`}>{item.uploader_username}</span>
            {item.uploaders_count > 1 && <span className="ml-auto text-muted-foreground">+{item.uploaders_count - 1}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DownloadLinksPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ quality: '', media_type: '', language: '', uploader: '' });
  const [sort, setSort] = useState('created_at.desc');
  const [uploaders, setUploaders] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);

  useEffect(() => {
    API.get('/api/download-links/uploaders').then(({ data }) => setUploaders(data.uploaders || [])).catch(() => {});
    API.get('/api/download-links/media-types').then(({ data }) => setMediaTypes(data.types || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '24', sort });
    if (filters.quality) params.set('quality', filters.quality);
    if (filters.media_type) params.set('media_type', filters.media_type);
    if (filters.language) params.set('language', filters.language);
    if (filters.uploader) params.set('uploader', filters.uploader);
    if (debouncedSearch) params.set('q', debouncedSearch);
    API.get(`/api/download-links?${params.toString()}`)
      .then(({ data }) => { setItems(data.items || []); setHasMore(!!data.has_more); setTotal(data.total || 0); })
      .catch(() => { setItems([]); setHasMore(false); })
      .finally(() => setLoading(false));
  }, [page, sort, filters, debouncedSearch]);

  useEffect(() => { setPage(1); }, [filters, debouncedSearch, sort]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="container mx-auto px-4 py-10 md:py-14" data-testid="download-links-page">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
          <Download className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Liens de téléchargement</h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg">
          {total > 0 ? `${total.toLocaleString('fr-FR')} contenus disponibles` : 'Derniers liens ajoutés par la communauté'}
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-8">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" /> Filtres
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher (titre, source, ww_id)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-border bg-background outline-none text-sm focus:border-primary/50"
              data-testid="dl-search"
            />
          </div>
          <SelectField value={filters.media_type} onChange={v => setFilter('media_type', v)} options={[{ value: '', label: 'Tous les types' }, ...mediaTypes.map(t => ({ value: t, label: TYPE_LABELS[t] || t.charAt(0).toUpperCase() + t.slice(1) }))]} testid="dl-type" />
          <SelectField value={filters.quality} onChange={v => setFilter('quality', v)} options={QUALITIES.map(q => ({ value: q, label: q || 'Toutes qualités' }))} testid="dl-quality" />
          <SelectField value={filters.language} onChange={v => setFilter('language', v)} options={LANGUAGES.map(l => ({ value: l, label: l ? l.toUpperCase() : 'Toutes langues' }))} testid="dl-lang" />
          <SelectField value={filters.uploader} onChange={v => setFilter('uploader', v)} options={[{ value: '', label: 'Tous les uploaders' }, ...uploaders.map(u => ({ value: u.username, label: `${u.username}${u.role === 'admin' ? ' 👑' : ''}` }))]} testid="dl-uploader" />
          <div className="lg:col-span-6">
            <SelectField value={sort} onChange={setSort} options={SORTS.map(s => ({ value: s.v, label: s.label }))} testid="dl-sort" />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="aspect-[2/3] rounded-lg bg-secondary/40 animate-pulse" />))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Download className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun lien trouvé</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map(it => (<FullLinkCard key={it.id} item={it} />))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1 || loading}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition-colors"
              data-testid="dl-prev"
            >
              Précédent
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {Math.max(1, Math.ceil(total / 24))}
            </span>
            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={!hasMore || loading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-colors"
              data-testid="dl-next"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SelectField({ value, onChange, options, testid }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-9 h-10 rounded-lg border border-border bg-background outline-none text-sm focus:border-primary/50 cursor-pointer"
        data-testid={testid}
      >
        {options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
