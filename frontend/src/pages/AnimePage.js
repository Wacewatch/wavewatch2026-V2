import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingGrid } from '../components/Loading';
import { SlidersHorizontal, X, Filter } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularite (decroissant)' },
  { value: 'popularity.asc', label: 'Popularite (croissant)' },
  { value: 'vote_average.desc', label: 'Meilleure note' },
  { value: 'vote_average.asc', label: 'Moins bien note' },
  { value: 'first_air_date.desc', label: 'Plus recent' },
  { value: 'first_air_date.asc', label: 'Plus ancien' },
];

const ANIME_PROVIDERS = [
  { id: 8, name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: 236, name: 'Crunchyroll', logo: '/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg' },
  { id: 337, name: 'Disney+', logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
  { id: 119, name: 'Amazon Prime', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: 21, name: 'ADN', logo: '/tsJvSCNjmETznRzBFEp7IsR7r7A.jpg' },
];

// Anime sub-genres from TMDB
const ANIME_GENRES = [
  { id: 16, name: 'Animation' },
  { id: 10759, name: 'Action & Aventure' },
  { id: 10765, name: 'Sci-Fi & Fantastique' },
  { id: 35, name: 'Comedie' },
  { id: 18, name: 'Drame' },
  { id: 10762, name: 'Enfants' },
  { id: 9648, name: 'Mystere' },
  { id: 10768, name: 'Guerre & Politique' },
];

export default function AnimePage() {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const genreFilter = searchParams.get('genre') || '';
  const sortBy = searchParams.get('sort') || 'popularity.desc';
  const providerFilter = searchParams.get('provider') || '';
  const yearFilter = searchParams.get('year') || '';

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Base anime discovery: animation genre + Japanese origin
    let params = `page=${page}&sort_by=${sortBy}`;
    // Always include animation genre for anime, add extra genre if selected
    if (genreFilter && genreFilter !== '16') {
      params += `&genre=16,${genreFilter}`;
    } else {
      params += '&genre=16';
    }
    if (providerFilter) params += `&provider=${providerFilter}`;
    if (yearFilter) params += `&year=${yearFilter}`;

    API.get(`/api/tmdb/discover/tv?${params}`).then(({ data }) => {
      // Filter to only Japanese anime
      const results = (data.results || []).filter(a =>
        (a.origin_country || []).includes('JP') || (a.original_language === 'ja')
      );
      setAnime(results.length > 0 ? results : data.results || []);
      setTotalPages(data.total_pages || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, genreFilter, sortBy, providerFilter, yearFilter]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  const activeProvider = ANIME_PROVIDERS.find(p => String(p.id) === providerFilter);
  const hasFilters = genreFilter || providerFilter || yearFilter || sortBy !== 'popularity.desc';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="anime-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" data-testid="anime-title">
          Animes {activeProvider ? `sur ${activeProvider.name}` : ''}
        </h1>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
          data-testid="toggle-filters-btn">
          <SlidersHorizontal className="w-4 h-4" />Filtres
          {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
        </button>
      </div>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => updateFilter('genre', '')} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!genreFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`} data-testid="genre-filter-all">Tous</button>
        {ANIME_GENRES.map(g => (
          <button key={g.id} onClick={() => updateFilter('genre', String(g.id))}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${String(g.id) === genreFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`} data-testid={`genre-filter-${g.id}`}>{g.name}</button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border p-4 mb-6 space-y-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} data-testid="filters-panel">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />Plateforme
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateFilter('provider', '')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${!providerFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`} data-testid="provider-all">Toutes</button>
              {ANIME_PROVIDERS.map(p => (
                <button key={p.id} onClick={() => updateFilter('provider', String(p.id))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${String(p.id) === providerFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
                  data-testid={`provider-${p.id}`}>
                  <img src={`${TMDB_IMG}/w45${p.logo}`} alt={p.name} className="w-5 h-5 rounded" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Trier par</label>
              <select value={sortBy} onChange={e => updateFilter('sort', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground outline-none" style={{ borderColor: 'hsl(var(--border))' }}
                data-testid="sort-select">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Annee</label>
              <select value={yearFilter} onChange={e => updateFilter('year', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground outline-none" style={{ borderColor: 'hsl(var(--border))' }}
                data-testid="year-select">
                <option value="">Toutes</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors" data-testid="clear-filters-btn">
                  <X className="w-4 h-4" />Effacer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? <LoadingGrid count={20} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="anime-grid">
          {anime.map(a => <ContentCard key={a.id} item={a} type="tv" isAnime />)}
        </div>
      )}

      {!loading && anime.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">Aucun anime trouve avec ces filtres</p>
          <button onClick={clearFilters} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground">Effacer les filtres</button>
        </div>
      )}

      <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
        <button onClick={() => { setPage(1); }} disabled={page <= 1} className="px-3 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary transition-colors text-sm">1</button>
        <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary transition-colors" data-testid="prev-page-btn">Precedent</button>
        <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} / {totalPages}</span>
        <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary transition-colors" data-testid="next-page-btn">Suivant</button>
      </div>
    </div>
  );
}
