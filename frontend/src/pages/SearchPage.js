import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingGrid } from '../components/Loading';
import { Search, Film, Tv, Users, Filter } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { setPage(1); }, [q]);

  useEffect(() => {
    if (q) {
      setLoading(true);
      API.get(`/api/tmdb/search?q=${encodeURIComponent(q)}&page=${page}`).then(({ data }) => {
        setResults(data.results || []);
        setTotalPages(data.total_pages || 1);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [q, page]);

  const filtered = filter === 'all' ? results : results.filter(r => r.media_type === filter);
  const movies = results.filter(r => r.media_type === 'movie');
  const tvShows = results.filter(r => r.media_type === 'tv');
  const persons = results.filter(r => r.media_type === 'person');

  return (
    <div className="container mx-auto px-4 py-8" data-testid="search-page">
      <h1 className="text-3xl font-bold mb-2">Recherche</h1>
      {q && <p className="text-muted-foreground mb-6">Resultats pour "{q}" ({results.length} sur cette page)</p>}
      {!q && (
        <div className="text-center py-20"><Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Recherchez des films, series ou acteurs</p></div>
      )}

      {q && !loading && results.length > 0 && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="search-filters">
            {[
              { val: 'all', label: 'Tout', count: results.length },
              { val: 'movie', label: 'Films', count: movies.length, icon: <Film className="w-3.5 h-3.5" /> },
              { val: 'tv', label: 'Series', count: tvShows.length, icon: <Tv className="w-3.5 h-3.5" /> },
              { val: 'person', label: 'Acteurs', count: persons.length, icon: <Users className="w-3.5 h-3.5" /> },
            ].map(f => (
              <button key={f.val} onClick={() => setFilter(f.val)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border whitespace-nowrap transition-colors ${filter === f.val ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
                {f.icon}{f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Content results (movies + tv) */}
          {(filter === 'all' || filter === 'movie' || filter === 'tv') && filtered.filter(r => r.media_type !== 'person').length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4">Films et Series</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {filtered.filter(r => r.media_type !== 'person').map(r => (
                  <ContentCard key={`${r.media_type}-${r.id}`} item={r} type={r.media_type === 'tv' ? 'tv' : 'movie'} />
                ))}
              </div>
            </div>
          )}

          {/* Actors results */}
          {(filter === 'all' || filter === 'person') && filtered.filter(r => r.media_type === 'person').length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Acteurs</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filtered.filter(r => r.media_type === 'person').map(p => (
                  <Link key={`person-${p.id}`} to={`/actors/${p.id}`} className="group text-center" data-testid={`person-${p.id}`}>
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                      <img src={p.profile_path ? `${TMDB_IMG}/w300${p.profile_path}` : 'https://placehold.co/300x450/333/ccc?text=?'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-blue-400">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.known_for_department}</p>
                    {p.known_for?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {p.known_for.slice(0, 2).map(k => k.title || k.name).join(', ')}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
              <span className="px-4 py-2 text-muted-foreground">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Suivant</button>
            </div>
          )}
        </>
      )}

      {loading && <LoadingGrid count={12} />}
      {!loading && q && results.length === 0 && <div className="text-center py-20"><p className="text-xl text-muted-foreground">Aucun resultat trouve</p></div>}
    </div>
  );
}
