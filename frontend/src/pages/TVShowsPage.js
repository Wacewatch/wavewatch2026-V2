import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import ContentCard from '../components/ContentCard';
import ContentGrid from '../components/ContentGrid';
import { LoadingGrid } from '../components/Loading';

export default function TVShowsPage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  useEffect(() => { API.get('/api/tmdb/genres/tv').then(({ data }) => setGenres(data.genres || [])).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const ep = selectedGenre ? `/api/tmdb/discover/tv?genre=${selectedGenre}&page=${page}` : `/api/tmdb/popular/tv?page=${page}`;
    API.get(ep).then(({ data }) => { setShows(data.results || []); setTotalPages(data.total_pages || 1); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, selectedGenre]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="tv-shows-page">
      <h1 className="text-3xl font-bold mb-6">Series TV</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setSelectedGenre(null); setPage(1); }} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!selectedGenre ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>Tous</button>
        {genres.map(g => (
          <button key={g.id} onClick={() => { setSelectedGenre(g.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedGenre === g.id ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g.name}</button>
        ))}
      </div>
      {loading ? <LoadingGrid count={12} /> : <ContentGrid>{shows.map(s => <ContentCard key={s.id} item={s} type="tv" />)}</ContentGrid>}
      <div className="flex justify-center gap-2 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
        <span className="px-4 py-2 text-muted-foreground">Page {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Suivant</button>
      </div>
    </div>
  );
}
