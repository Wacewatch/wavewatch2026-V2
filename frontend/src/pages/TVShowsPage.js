import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingGrid } from '../components/Loading';
import { Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight, Sparkles, Tv, Layers, Zap } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, useCountUp } from '../components/design/PageHero';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularité ↓' },
  { value: 'popularity.asc', label: 'Popularité ↑' },
  { value: 'vote_average.desc', label: 'Meilleure note' },
  { value: 'vote_average.asc', label: 'Moins bien noté' },
  { value: 'first_air_date.desc', label: 'Plus récent' },
  { value: 'first_air_date.asc', label: 'Plus ancien' },
];

const POPULAR_PROVIDERS = [
  { id: 8, name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: 337, name: 'Disney+', logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
  { id: 119, name: 'Amazon Prime', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: 350, name: 'Apple TV+', logo: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { id: 381, name: 'Canal+', logo: '/dQeAar5H991VYporEjUspolDarG.jpg' },
  { id: 56, name: 'OCS', logo: '/3E0RkIEQrrGYazs63NMsn3XONT6.jpg' },
  { id: 1899, name: 'Max', logo: '/6Q3ZYUNA9Hsgj6iWnVsw2gR5V6z.jpg' },
  { id: 531, name: 'Paramount+', logo: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' },
  { id: 236, name: 'Crunchyroll', logo: '/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg' },
];

export default function TVShowsPage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [genres, setGenres] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const genreFilter = searchParams.get('genre') || '';
  const sortBy = searchParams.get('sort') || 'popularity.desc';
  const providerFilter = searchParams.get('provider') || '';
  const yearFilter = searchParams.get('year') || '';
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    API.get('/api/tmdb/genres/tv').then(({ data }) => setGenres(data.genres || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let endpoint = `/api/tmdb/discover/tv?page=${page}&sort_by=${sortBy}&per_page=50`;
    if (genreFilter) endpoint += `&genre=${genreFilter}`;
    if (providerFilter) endpoint += `&provider=${providerFilter}`;
    if (yearFilter) endpoint += `&year=${yearFilter}`;
    API.get(endpoint).then(({ data }) => {
      setShows(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, genreFilter, sortBy, providerFilter, yearFilter]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params); setPage(1);
  };
  const clearFilters = () => { setSearchParams({}); setPage(1); };

  const activeGenre = genres.find(g => String(g.id) === genreFilter);
  const activeProvider = POPULAR_PROVIDERS.find(p => String(p.id) === providerFilter);
  const hasFilters = genreFilter || providerFilter || yearFilter || sortBy !== 'popularity.desc';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const cTotalShows = useCountUp(totalResults);
  const cGenres = useCountUp(genres.length);
  const cProviders = useCountUp(POPULAR_PROVIDERS.length);

  const subtitle = useMemo(() => {
    const parts = [];
    if (activeGenre) parts.push(activeGenre.name);
    if (activeProvider) parts.push(`sur ${activeProvider.name}`);
    if (yearFilter) parts.push(yearFilter);
    return parts.join(' • ');
  }, [activeGenre, activeProvider, yearFilter]);

  return (
    <PageWrapper testId="tv-shows-page" accents={['rgba(59,130,246,0.55)', 'rgba(99,102,241,0.5)', 'rgba(168,85,247,0.45)']}>
      <PageHero
        badge={subtitle || 'Catalogue Séries'}
        badgeIcon={Tv}
        title="Séries"
        subtitle="binge-watch en"
        highlight="streaming"
        description="Découvrez les séries qui font le buzz, classez-les par plateforme et plongez dans des sagas inoubliables."
        gradient="rgba(59,130,246,0.18), rgba(99,102,241,0.12) 35%, rgba(168,85,247,0.18) 65%, rgba(244,114,182,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #93c5fd 40%, #c4b5fd 70%, #f9a8d4 100%)"
        highlightGradient="linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)"
        blobColor1="rgba(59,130,246,0.6)"
        blobColor2="rgba(168,85,247,0.55)"
        stats={[
          { icon: Tv, label: 'Séries', value: cTotalShows, accent: 'rgba(59,130,246,0.7)' },
          { icon: Layers, label: 'Plateformes', value: cProviders, accent: 'rgba(99,102,241,0.7)' },
          { icon: Zap, label: 'Genres', value: cGenres, accent: 'rgba(168,85,247,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-white/80 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-400" /> Genres</div>
            <button onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${showFilters ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
                    data-testid="toggle-filters-btn">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres avancés
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            <Pill active={!genreFilter} onClick={() => updateFilter('genre', '')} icon={Sparkles} color="#3b82f6" testId="genre-filter-all">Tous</Pill>
            {genres.map(g => (
              <Pill key={g.id} active={String(g.id) === genreFilter} onClick={() => updateFilter('genre', String(g.id))} color="#6366f1" testId={`genre-filter-${g.id}`}>{g.name}</Pill>
            ))}
          </div>

          {showFilters && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 md:p-4 space-y-4" data-testid="filters-panel">
              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block flex items-center gap-1.5"><Filter className="w-3 h-3" /> Plateforme</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => updateFilter('provider', '')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${!providerFilter ? 'bg-blue-500 text-white border-blue-500' : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/70'}`} data-testid="provider-all">Toutes</button>
                  {POPULAR_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => updateFilter('provider', String(p.id))}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${String(p.id) === providerFilter ? 'bg-blue-500 text-white border-blue-500' : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/70'}`} data-testid={`provider-${p.id}`}>
                      <img src={`${TMDB_IMG}/w45${p.logo}`} alt={p.name} className="w-4 h-4 rounded" />{p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Trier par</label>
                  <select value={sortBy} onChange={e => updateFilter('sort', e.target.value)}
                          className="w-full px-3 h-10 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-blue-500/50" data-testid="sort-select">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>)}
                  </select>
                </div>
                <div className="min-w-[140px]">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Année</label>
                  <select value={yearFilter} onChange={e => updateFilter('year', e.target.value)}
                          className="w-full px-3 h-10 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-blue-500/50" data-testid="year-select">
                    <option value="" className="bg-slate-900">Toutes</option>
                    {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                  </select>
                </div>
                {hasFilters && (
                  <div className="flex items-end">
                    <button onClick={clearFilters} className="flex items-center gap-1 px-3 h-10 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-colors" data-testid="clear-filters-btn">
                      <X className="w-3.5 h-3.5" /> Effacer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterBar>

      {loading ? <LoadingGrid count={20} /> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-2.5 md:gap-3" data-testid="tvshows-grid">
          {shows.map((s, i) => (
            <div key={s.id} className="wv-fade-in" style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}>
              <ContentCard item={s} type="tv" />
            </div>
          ))}
        </div>
      )}

      {!loading && shows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-white/60">Aucune série trouvée avec ces filtres</p>
          <button onClick={clearFilters} className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm">Effacer les filtres</button>
        </div>
      )}

      <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
        <button onClick={() => setPage(1)} disabled={page <= 1} className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-sm font-bold text-white">1</button>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-sm font-bold text-white flex items-center gap-1" data-testid="prev-page-btn">
          <ChevronLeft className="w-4 h-4" /> Préc.
        </button>
        <span className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 font-bold flex items-center">
          Page <span className="mx-1.5 text-white">{page}</span> / {totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="h-10 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 text-sm font-bold text-white flex items-center gap-1 shadow-lg shadow-blue-500/30" data-testid="next-page-btn">
          Suiv. <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </PageWrapper>
  );
}
