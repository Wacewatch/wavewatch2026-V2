import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../lib/api';
import ContentCard from '../components/ContentCard';
import ContentGrid from '../components/ContentGrid';
import { LoadingGrid } from '../components/Loading';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genres, setGenres] = useState([]);
  const [searchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre');

  useEffect(() => {
    API.get('/api/tmdb/genres/movie').then(({ data }) => setGenres(data.genres || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const endpoint = genreFilter
      ? `/api/tmdb/discover/movie?genre=${genreFilter}&page=${page}`
      : `/api/tmdb/popular/movies?page=${page}`;
    API.get(endpoint).then(({ data }) => {
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, genreFilter]);

  const activeGenre = genres.find(g => String(g.id) === genreFilter);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="movies-page">
      <h1 className="text-3xl font-bold mb-6">Films {activeGenre ? `- ${activeGenre.name}` : ''}</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <a href="/movies" className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!genreFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>Tous</a>
        {genres.map(g => (
          <a key={g.id} href={`/movies?genre=${g.id}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${String(g.id) === genreFilter ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g.name}</a>
        ))}
      </div>
      {loading ? <LoadingGrid count={12} /> : (
        <ContentGrid>{movies.map(m => <ContentCard key={m.id} item={m} type="movie" />)}</ContentGrid>
      )}
      <div className="flex justify-center gap-2 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary transition-colors">Precedent</button>
        <span className="px-4 py-2 text-muted-foreground">Page {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary transition-colors">Suivant</button>
      </div>
    </div>
  );
}
