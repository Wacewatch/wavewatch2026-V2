import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingSpinner, LoadingGrid } from '../components/Loading';
import { Search, Film, ArrowLeft, Star } from 'lucide-react';

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
      {/* Header */}
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

      {/* Films de la collection */}
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

export default function CollectionsPage() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    if (!id) {
      const queries = ['Marvel', 'Star Wars', 'Harry Potter', 'James Bond', 'Fast & Furious', 'Batman', 'X-Men', 'Mission Impossible', 'Jurassic', 'Alien', 'Pirates des Caraibes', 'Toy Story'];
      queries.forEach(q => {
        API.get(`/api/tmdb/collections/search?q=${encodeURIComponent(q)}`).then(({ data }) => {
          if (data.results?.[0]) setPopular(prev => [...prev.filter(p => p.id !== data.results[0].id), data.results[0]]);
        }).catch(() => {});
      });
    }
  }, [id]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    API.get(`/api/tmdb/collections/search?q=${encodeURIComponent(query)}`).then(({ data }) => setCollections(data.results || [])).catch(() => {}).finally(() => setLoading(false));
  };

  // Si un ID est fourni, afficher le detail de la collection
  if (id) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="collections-page">
        <CollectionDetail collectionId={id} />
      </div>
    );
  }

  const allCollections = collections.length > 0 ? collections : popular;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="collections-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Film className="w-8 h-8" />Collections / Sagas</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une collection..." className="w-full pl-12 pr-4 h-12 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" data-testid="collections-search" />
        </div>
      </form>
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {allCollections.map(c => (
            <Link key={c.id} to={`/collections/${c.id}`} className="group" data-testid={`collection-card-${c.id}`}>
              <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
                <div className="relative aspect-[2/3]">
                  {c.poster_path ? (
                    <img src={`${TMDB_IMG}/w300${c.poster_path}`} alt={c.name} className="w-full h-full object-cover" />
                  ) : c.backdrop_path ? (
                    <img src={`${TMDB_IMG}/w300${c.backdrop_path}`} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><Film className="w-12 h-12 text-muted-foreground opacity-30" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-blue-400">{c.name}</h3>
                  {c.overview && <p className="text-xs text-muted-foreground line-clamp-2">{c.overview}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {allCollections.length === 0 && !loading && <p className="text-center py-12 text-muted-foreground">Aucune collection trouvee</p>}
    </div>
  );
}
