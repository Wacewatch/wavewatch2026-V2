import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { ListMusic, Plus, Trash2, Globe, Lock, Play, Eye, Film, Tv } from 'lucide-react';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) loadPlaylists(); }, [user]);

  const loadPlaylists = () => { API.get('/api/playlists').then(({ data }) => setPlaylists(data.playlists || [])).catch(() => {}); };

  const createPlaylist = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/playlists', { name, description: desc, is_public: isPublic });
      toast({ title: 'Playlist creee' });
      setShowCreate(false); setName(''); setDesc(''); setIsPublic(false); loadPlaylists();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deletePlaylist = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Supprimer cette playlist ?')) return;
    try { await API.delete(`/api/playlists/${id}`); toast({ title: 'Playlist supprimee' }); loadPlaylists(); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  if (authLoading || !user) return null;

  const colors = ['from-blue-600 to-purple-600', 'from-pink-600 to-red-600', 'from-green-600 to-teal-600', 'from-orange-600 to-yellow-600', 'from-indigo-600 to-blue-600', 'from-purple-600 to-pink-600', 'from-cyan-600 to-blue-600', 'from-rose-600 to-pink-600'];

  return (
    <div className="container mx-auto px-4 py-8" data-testid="playlists-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><ListMusic className="w-8 h-8" />Mes Playlists</h1>
          <p className="text-muted-foreground mt-1">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90" data-testid="create-playlist-btn">
          <Plus className="w-4 h-4" />Creer
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="create-playlist-form">
          <h2 className="font-bold text-lg mb-4">Nouvelle playlist</h2>
          <form onSubmit={createPlaylist} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nom</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ma playlist..." required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none" data-testid="playlist-name-input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optionnel)</label>
              <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description..." className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none" data-testid="playlist-desc-input" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" data-testid="playlist-public-checkbox" />
              <Globe className="w-4 h-4 text-green-400" />
              <span className="text-sm">Rendre publique (visible par tous)</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium" data-testid="submit-playlist-btn">Creer la playlist</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Aucune playlist</p>
          <p className="text-sm text-muted-foreground">Creez une playlist et ajoutez-y vos films et series preferees</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((p, i) => (
            <Link key={p._id} to={`/playlists/${p._id}`} className="group" data-testid={`playlist-card-${p._id}`}>
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg">
                {/* Playlist cover - show up to 4 item posters */}
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
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg drop-shadow-lg">{p.name}</h3>
                      <p className="text-xs text-white/70">{p.items?.length || 0} element{(p.items?.length || 0) !== 1 ? 's' : ''}</p>
                    </div>
                    {p.is_public ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-white/50" />}
                  </div>
                </div>
                <div className="p-4">
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>}
                  {/* Show first few items as pills */}
                  {p.items?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground truncate max-w-[120px]">{item.title}</span>
                      ))}
                      {p.items.length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">+{p.items.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />Voir la playlist</span>
                    <button onClick={(e) => deletePlaylist(e, p._id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`delete-playlist-${p._id}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
