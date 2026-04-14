import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import ContentCard from '../components/ContentCard';
import ContentGrid from '../components/ContentGrid';
import { LoadingGrid } from '../components/Loading';

export default function AnimePage() {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/tmdb/popular/anime?page=${page}`).then(({ data }) => {
      setAnime(data.results || []); setTotalPages(Math.min(data.total_pages || 1, 500));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="anime-page">
      <h1 className="text-3xl font-bold mb-6">Animes</h1>
      {loading ? <LoadingGrid count={12} /> : <ContentGrid>{anime.map(a => <ContentCard key={a.id} item={a} type="tv" isAnime />)}</ContentGrid>}
      <div className="flex justify-center gap-2 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
        <span className="px-4 py-2 text-muted-foreground">Page {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Suivant</button>
      </div>
    </div>
  );
}
