import React, { useState, useEffect, useCallback } from 'react';
import API from '../lib/api';
import { Download, Search, ChevronDown, Filter } from 'lucide-react';
import { DownloadLinkCard } from '../components/DownloadLinksRow';

const QUALITIES = ['', 'FHD', 'HD', '4K', 'SD'];
const LANGUAGES = ['', 'multi', 'truefrench', 'french', 'vostfr', 'vf', 'vo'];
const TYPES = [
  { v: '', label: 'Tous' },
  { v: 'movie', label: 'Films' },
  { v: 'tv', label: 'Séries' },
];

export default function DownloadLinksPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ quality: '', media_type: '', language: '' });
  const [sort, setSort] = useState('created_at.desc');

  // Debounce search
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
    if (debouncedSearch) params.set('q', debouncedSearch);
    API.get(`/api/download-links?${params.toString()}`)
      .then(({ data }) => {
        setItems(data.items || []);
        setHasMore(!!data.has_more);
        setTotal(data.total || 0);
      })
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher (titre, source...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-border bg-background outline-none text-sm focus:border-primary/50"
              data-testid="dl-search"
            />
          </div>
          <SelectField
            value={filters.media_type}
            onChange={v => setFilter('media_type', v)}
            options={TYPES.map(t => ({ value: t.v, label: t.label }))}
            testid="dl-type"
          />
          <SelectField
            value={filters.quality}
            onChange={v => setFilter('quality', v)}
            options={QUALITIES.map(q => ({ value: q, label: q || 'Toutes qualités' }))}
            testid="dl-quality"
          />
          <SelectField
            value={filters.language}
            onChange={v => setFilter('language', v)}
            options={LANGUAGES.map(l => ({ value: l, label: l ? l.toUpperCase() : 'Toutes langues' }))}
            testid="dl-lang"
          />
          <SelectField
            value={sort}
            onChange={setSort}
            options={[
              { value: 'created_at.desc', label: 'Plus récents' },
              { value: 'created_at.asc', label: 'Plus anciens' },
            ]}
            testid="dl-sort"
          />
        </div>
      </div>

      {/* Results */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Download className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun lien trouvé</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map(it => (
              <DownloadLinkCard key={`${it.media_type}-${it.tmdb_id}-${it.ww_id}`} item={it} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition-colors"
              data-testid="dl-prev"
            >
              Précédent
            </button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
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
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
