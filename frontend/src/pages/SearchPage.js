import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingGrid } from '../components/Loading';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setLoading(true);
      API.get(`/api/tmdb/search?q=${encodeURIComponent(q)}`).then(({ data }) => setResults(data.results || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="search-page">
      <h1 className="text-3xl font-bold mb-2">Recherche</h1>
      {q && <p className="text-muted-foreground mb-6">Resultats pour "{q}"</p>}
      {!q && (
        <div className="text-center py-20"><Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Recherchez des films, series ou animes</p></div>
      )}
      {loading ? <LoadingGrid count={12} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {results.filter(r => r.media_type !== 'person').map(r => (
            <ContentCard key={`${r.media_type}-${r.id}`} item={r} type={r.media_type === 'tv' ? 'tv' : 'movie'} />
          ))}
        </div>
      )}
      {!loading && q && results.length === 0 && <div className="text-center py-20"><p className="text-xl text-muted-foreground">Aucun resultat trouve</p></div>}
    </div>
  );
}
