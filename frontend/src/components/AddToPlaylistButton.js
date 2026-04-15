import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';
import { Plus, Check, ListMusic, Lock } from 'lucide-react';

export default function AddToPlaylistButton({ contentId, contentType, title, posterPath }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedTo, setAddedTo] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/playlists');
      setPlaylists(data.playlists || []);
      const already = new Set();
      (data.playlists || []).forEach(p => {
        if (p.items?.some(i => i.content_id === contentId && i.content_type === contentType)) {
          already.add(p._id);
        }
      });
      setAddedTo(already);
    } catch {} finally { setLoading(false); }
  };

  const toggleOpen = () => {
    if (!user) { toast({ title: 'Connectez-vous pour utiliser les playlists', variant: 'destructive' }); return; }
    if (!open) loadPlaylists();
    setOpen(!open);
    setCreating(false);
  };

  const addToPlaylist = async (playlistId) => {
    if (addedTo.has(playlistId)) {
      try {
        await API.delete(`/api/playlists/${playlistId}/items/${contentId}`);
        setAddedTo(prev => { const n = new Set(prev); n.delete(playlistId); return n; });
        toast({ title: 'Retire de la playlist' });
      } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
      return;
    }
    try {
      await API.post(`/api/playlists/${playlistId}/items`, { content_id: contentId, content_type: contentType, title, poster_path: posterPath });
      setAddedTo(prev => new Set(prev).add(playlistId));
      toast({ title: 'Ajoute a la playlist' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const createAndAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { data } = await API.post('/api/playlists', { name: newName.trim(), description: '', is_public: false });
      const pid = data.playlist?._id;
      if (pid) {
        await API.post(`/api/playlists/${pid}/items`, { content_id: contentId, content_type: contentType, title, poster_path: posterPath });
        toast({ title: `Playlist "${newName}" creee et contenu ajoute` });
        setAddedTo(prev => new Set(prev).add(pid));
      }
      setNewName('');
      setCreating(false);
      loadPlaylists();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleOpen}
        className="px-5 py-2.5 rounded-lg border border-green-600 text-green-400 hover:bg-green-900/20 flex items-center gap-2 transition-colors"
        data-testid="add-to-playlist-btn">
        <Plus className="w-5 h-5" />Playlist
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden" data-testid="playlist-dropdown">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-bold">Ajouter a une playlist</span>
            <button onClick={() => setCreating(!creating)} className="text-xs text-blue-400 hover:underline">{creating ? 'Annuler' : '+ Nouvelle'}</button>
          </div>
          {creating && (
            <form onSubmit={createAndAdd} className="p-3 border-b border-border flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom..." className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input bg-background outline-none" autoFocus />
              <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground">Creer</button>
            </form>
          )}
          <div className="max-h-64 overflow-y-auto">
            {loading ? <p className="text-center py-4 text-sm text-muted-foreground">Chargement...</p> :
              playlists.length === 0 ? <p className="text-center py-4 text-sm text-muted-foreground">Aucune playlist</p> :
                playlists.map(p => (
                  <button key={p._id} onClick={() => addToPlaylist(p._id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                    data-testid={`playlist-option-${p._id}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${addedTo.has(p._id) ? 'bg-green-500/20' : 'bg-secondary'}`}>
                      {addedTo.has(p._id) ? <Check className="w-4 h-4 text-green-400" /> : <ListMusic className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.items?.length || 0} elements {p.is_public ? '' : '(prive)'}</p>
                    </div>
                    {!p.is_public && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
