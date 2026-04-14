import React, { useState, useEffect } from 'react';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Search, Film } from 'lucide-react';

export default function CollectionsPage() {
  const [query, setQuery] = useState('');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    ['Marvel','Star Wars','Harry Potter','James Bond','Fast & Furious','Batman'].forEach(q => {
      API.get(`/api/tmdb/collections/search?q=${encodeURIComponent(q)}`).then(({ data }) => {
        if (data.results?.[0]) setPopular(prev => [...prev.filter(p => p.id !== data.results[0].id), data.results[0]]);
      }).catch(() => {});
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    API.get(`/api/tmdb/collections/search?q=${encodeURIComponent(query)}`).then(({ data }) => setCollections(data.results || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const allCollections = collections.length > 0 ? collections : popular;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="collections-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Film className="w-8 h-8" />Collections / Sagas</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une collection..." className="w-full pl-12 pr-4 h-12 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </form>
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allCollections.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
              <div className="aspect-[16/9] bg-muted">{c.backdrop_path && <img src={`${TMDB_IMG}/w500${c.backdrop_path}`} alt={c.name} className="w-full h-full object-cover" />}</div>
              <div className="p-4"><h3 className="font-bold text-lg mb-1">{c.name}</h3><p className="text-sm text-muted-foreground line-clamp-2">{c.overview || 'Decouvrez cette collection'}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
