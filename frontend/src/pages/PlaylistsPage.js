import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { ListMusic, Plus, Trash2, Globe, Lock } from 'lucide-react';

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
      setShowCreate(false); setName(''); setDesc(''); loadPlaylists();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deletePlaylist = async (id) => {
    try { await API.delete(`/api/playlists/${id}`); toast({ title: 'Playlist supprimee' }); loadPlaylists(); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="playlists-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><ListMusic className="w-8 h-8" />Mes Playlists</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90"><Plus className="w-4 h-4" />Creer</button>
      </div>
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <form onSubmit={createPlaylist} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la playlist" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none" />
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optionnel)" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /><span className="text-sm">Playlist publique</span></label>
            <div className="flex gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Creer</button><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border">Annuler</button></div>
          </form>
        </div>
      )}
      {playlists.length === 0 ? (
        <div className="text-center py-20"><ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Aucune playlist</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(p => (
            <div key={p._id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div><h3 className="font-bold text-lg">{p.name}</h3>{p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}</div>
                <button onClick={() => deletePlaylist(p._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                {p.is_public ? <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Public</span> : <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Prive</span>}
                <span>{p.items?.length || 0} elements</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
