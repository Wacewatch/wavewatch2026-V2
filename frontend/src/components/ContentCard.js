import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, Check, ListMusic } from 'lucide-react';
import { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';

function QuickPlaylistAdd({ contentId, contentType, title, posterPath }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [addedTo, setAddedTo] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: 'Connectez-vous', variant: 'destructive' }); return; }
    if (!open) {
      API.get('/api/playlists').then(({ data }) => {
        setPlaylists(data.playlists || []);
        const s = new Set();
        (data.playlists || []).forEach(p => { if (p.items?.some(i => i.content_id === contentId && i.content_type === contentType)) s.add(p._id); });
        setAddedTo(s);
      }).catch(() => {});
    }
    setOpen(!open);
  };

  const addTo = async (e, pid) => {
    e.preventDefault(); e.stopPropagation();
    if (addedTo.has(pid)) {
      try { await API.delete(`/api/playlists/${pid}/items/${contentId}`); setAddedTo(p => { const n = new Set(p); n.delete(pid); return n; }); toast({ title: 'Retire' }); } catch {}
      return;
    }
    try {
      await API.post(`/api/playlists/${pid}/items`, { content_id: contentId, content_type: contentType, title, poster_path: posterPath });
      setAddedTo(p => new Set(p).add(pid)); toast({ title: 'Ajoute !' });
    } catch {}
  };

  return (
    <div ref={ref} className="absolute bottom-2 right-2 z-10">
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-green-600 transition-all" data-testid={`quick-add-${contentId}`}>
        <Plus className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-52 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="p-2 text-xs font-bold border-b border-border">Ajouter a...</div>
          <div className="max-h-40 overflow-y-auto">
            {playlists.length === 0 ? <p className="text-xs text-muted-foreground p-2">Aucune playlist</p> :
              playlists.map(p => (
                <button key={p._id} onClick={(e) => addTo(e, p._id)} className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-secondary/50 transition-colors text-xs">
                  {addedTo.has(p._id) ? <Check className="w-3 h-3 text-green-400 flex-shrink-0" /> : <ListMusic className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  <span className="truncate">{p.name}</span>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentCard({ item, type = 'movie', isAnime = false }) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  const poster = item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Image';
  const rating = item.vote_average?.toFixed(1) || '0.0';
  const basePath = type === 'movie' ? '/movies' : isAnime ? '/anime' : '/tv-shows';
  const contentType = type === 'movie' ? 'movie' : 'tv';

  return (
    <div className="relative group" data-testid={`content-card-${item.id}`}>
      <Link to={`${basePath}/${item.id}`} className="block">
        <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
          <div className="relative aspect-[2/3]">
            <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{rating}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{year}</p>
          </div>
        </div>
      </Link>
      <QuickPlaylistAdd contentId={item.id} contentType={contentType} title={title} posterPath={item.poster_path} />
    </div>
  );
}
