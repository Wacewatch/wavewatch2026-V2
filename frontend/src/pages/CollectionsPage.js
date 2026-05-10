import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingSpinner, LoadingGrid } from '../components/Loading';
import { Search, Film, ArrowLeft, Layers, X, ChevronDown, Check, TrendingUp, ArrowDownAZ, ListOrdered } from 'lucide-react';
import { ThemedPage, ThemedHero } from '../components/design/ThemedPage';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularité', icon: TrendingUp },
  { value: 'name',       label: 'Nom (A→Z)',  icon: ArrowDownAZ },
  { value: 'size',       label: 'Nombre de films', icon: ListOrdered },
];

function CollectionDetail({ collectionId }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    API.get(`/api/tmdb/collection/${collectionId}`).then(({ data }) => {
      setCollection(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [collectionId]);

  if (loading) return <LoadingGrid count={8} />;
  if (!collection) return <p className="text-center py-12 text-muted-foreground">Collection introuvable</p>;

  const parts = (collection.parts || []).sort((a, b) => {
    const da = a.release_date || a.first_air_date || '';
    const db = b.release_date || b.first_air_date || '';
    return da.localeCompare(db);
  });

  return (
    <div data-testid="collection-detail">
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        {collection.backdrop_path && (
          <div className="absolute inset-0">
            <img src={`${TMDB_IMG}/original${collection.backdrop_path}`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
          </div>
        )}
        <div className="relative p-6 md:p-10 flex items-center gap-6">
          <button onClick={() => navigate('/collections')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" data-testid="back-to-collections">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {collection.poster_path && (
            <img src={`${TMDB_IMG}/w300${collection.poster_path}`} alt={collection.name} className="w-32 md:w-44 rounded-xl shadow-2xl hidden sm:block" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{collection.name}</h1>
            {collection.overview && <p className="text-white/70 text-sm md:text-base max-w-2xl mb-3">{collection.overview}</p>}
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1"><Film className="w-4 h-4" />{parts.length} films</span>
              {parts.length > 0 && parts[0].release_date && (
                <span>{new Date(parts[0].release_date).getFullYear()} - {parts[parts.length-1].release_date ? new Date(parts[parts.length-1].release_date).getFullYear() : '...'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {parts.map(item => (
          <ContentCard key={item.id} item={{ ...item, media_type: item.media_type || 'movie' }} type={item.media_type === 'tv' ? 'tv' : 'movie'} />
        ))}
      </div>

      {parts.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">Aucun film dans cette collection</p>
      )}
    </div>
  );
}

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
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3.5 py-2.5 rounded-xl border border-border bg-background/50 hover:bg-foreground/5 text-sm font-medium flex items-center gap-2 min-w-[180px] justify-between text-foreground transition-colors"
        data-testid="collections-sort-btn"
      >
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-card shadow-2xl z-50 py-1.5 overflow-hidden">
          {SORT_OPTIONS.map(o => {
            const I = o.icon;
            const active = o.value === value;
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:bg-foreground/5'}`}
                data-testid={`collections-sort-${o.value}`}
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

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

export default function CollectionsPage() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const debouncedQ = useDebounced(query, 350);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('popularity');
  const PER_PAGE = 24;

  useEffect(() => { setPage(1); }, [debouncedQ, sortBy]);

  useEffect(() => {
    if (id) return; // skip when in detail mode
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PER_PAGE),
      sort_by: sortBy,
      q: debouncedQ,
    });
    API.get(`/api/tmdb/collections/popular?${params.toString()}`, { timeout: 90000 })
      .then(({ data }) => {
        setCollections(data.results || []);
        setTotal(data.total || 0);
      })
      .catch(() => { setCollections([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [id, page, sortBy, debouncedQ]);

  if (id) {
    return (
      <ThemedPage testId="collections-page">
        <div className="container mx-auto px-4 py-8">
          <CollectionDetail collectionId={id} />
        </div>
      </ThemedPage>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <ThemedPage testId="collections-page">
      <div className="container mx-auto px-4 py-8">
        <ThemedHero
          badge="Sagas & univers"
          badgeIcon={Layers}
          title="Collections"
          subtitle="& "
          highlight="Sagas"
          description="Explore les plus grandes franchises cinématographiques. Marvel, Star Wars, Harry Potter et bien d'autres."
          stats={[
            { icon: Film, label: 'Collections', value: total, color: 'hsl(var(--primary))' },
          ]}
        />

        <div className="mb-6 sticky top-16 z-40">
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-3 shadow-xl shadow-black/30 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher une collection (Marvel, Star Wars, ...)"
                className="w-full pl-11 pr-9 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder-foreground/40 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                data-testid="collections-search"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-foreground/10"><X className="w-3.5 h-3.5 text-foreground/50" /></button>
              )}
            </div>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-sm">
          <p className="text-foreground/60">
            {loading ? <span className="inline-block w-32 h-4 rounded bg-foreground/10 animate-pulse" /> : (
              <><span className="font-bold text-foreground text-base">{total}</span> collection{total > 1 ? 's' : ''}</>
            )}
          </p>
          {totalPages > 1 && <p className="text-xs text-foreground/50">Page <span className="text-foreground font-semibold">{page}</span> / {totalPages}</p>}
        </div>

        {loading ? <LoadingGrid count={12} /> : collections.length === 0 ? (
          <p className="text-center py-12 text-foreground/50">Aucune collection trouvée</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {collections.map(c => (
              <Link key={c.id} to={`/collections/${c.id}`} className="group" data-testid={`collection-card-${c.id}`}>
                <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
                  <div className="relative aspect-[2/3]">
                    {c.poster_path ? (
                      <img src={`${TMDB_IMG}/w300${c.poster_path}`} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : c.backdrop_path ? (
                      <img src={`${TMDB_IMG}/w300${c.backdrop_path}`} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><Film className="w-12 h-12 text-muted-foreground opacity-30" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {typeof c.movies_count === 'number' && c.movies_count > 0 && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm">
                        {c.movies_count} films
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary">{c.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex justify-center items-center gap-2 mt-10" data-testid="collections-pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-border bg-background/50 hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              ← Précédent
            </button>
            <span className="px-4 py-2 text-sm text-foreground/60">Page <span className="text-foreground font-bold">{page}</span> / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-border bg-background/50 hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              Suivant →
            </button>
          </div>
        )}
      </div>
    </ThemedPage>
  );
}
