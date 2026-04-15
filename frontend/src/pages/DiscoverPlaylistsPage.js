import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { Globe, ListMusic, Film, Play, Users, Eye } from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

export default function DiscoverPlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/playlists/public/discover?page=${page}`).then(({ data }) => {
      setPlaylists(data.playlists || []);
      setTotal(data.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const colors = ['from-blue-600 to-purple-600', 'from-pink-600 to-red-600', 'from-green-600 to-teal-600', 'from-orange-600 to-yellow-600', 'from-indigo-600 to-blue-600', 'from-purple-600 to-pink-600'];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="discover-playlists-page">
      <div className="text-center mb-8">
        <Globe className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Decouvrir des Playlists</h1>
        <p className="text-muted-foreground">Explorez les playlists partagees par la communaute ({total} playlists publiques)</p>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Aucune playlist publique</p>
          <p className="text-sm text-muted-foreground">Soyez le premier a partager une playlist !</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((p, i) => (
              <Link key={p._id} to={`/playlists/${p._id}`} className="group" data-testid={`discover-playlist-${p._id}`}>
                <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg">
                  <div className="relative h-40 overflow-hidden">
                    {p.items?.length > 0 ? (
                      <div className="grid grid-cols-2 h-full">
                        {p.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="overflow-hidden">
                            {item.poster_path ? (
                              <img src={`${TMDB_IMG}/w200${item.poster_path}`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <Film className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {p.items.length < 4 && Array.from({ length: 4 - Math.min(p.items.length, 4) }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="bg-gradient-to-br from-gray-800 to-gray-900" />
                        ))}
                      </div>
                    ) : (
                      <div className={`h-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center`}>
                        <ListMusic className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-lg drop-shadow-lg">{p.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-white/70 mt-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.username || 'Anonyme'}</span>
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" />{p.items?.length || 0} elements</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>}
                    {p.items?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.items.slice(0, 4).map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground truncate max-w-[100px]">{item.title}</span>
                        ))}
                        {p.items.length > 4 && <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">+{p.items.length - 4}</span>}
                      </div>
                    )}
                    <span className="text-xs text-blue-400 flex items-center gap-1"><Eye className="w-3 h-3" />Voir la playlist</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {total > 20 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
              <span className="px-4 py-2 text-muted-foreground">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-border hover:bg-secondary">Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
