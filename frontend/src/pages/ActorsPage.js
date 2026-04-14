import React, { useState, useEffect } from 'react';
import API, { TMDB_IMG } from '../lib/api';
import { Link } from 'react-router-dom';
import { LoadingGrid } from '../components/Loading';
import { Users } from 'lucide-react';

export default function ActorsPage() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/tmdb/popular/persons?page=${page}`).then(({ data }) => setActors(data.results || [])).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="actors-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Users className="w-8 h-8" />Acteurs populaires</h1>
      {loading ? <LoadingGrid count={12} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {actors.map(a => (
            <Link key={a.id} to={`/actors/${a.id}`} className="group text-center">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                <img src={a.profile_path ? `${TMDB_IMG}/w500${a.profile_path}` : 'https://placehold.co/500x750/333/ccc?text=?'} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h3 className="font-medium text-sm group-hover:text-blue-400">{a.name}</h3>
              <p className="text-xs text-muted-foreground">{a.known_for_department}</p>
            </Link>
          ))}
        </div>
      )}
      <div className="flex justify-center gap-2 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
        <span className="px-4 py-2 text-muted-foreground">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Suivant</button>
      </div>
    </div>
  );
}
