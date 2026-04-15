import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Music, Play, Pause, Search, X, ExternalLink } from 'lucide-react';

export default function MusicPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/music').then(({ data }) => setItems(data || [])).catch(() => {}); }, []);

  const genres = ['all', ...new Set(items.map(i => i.genre).filter(Boolean))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.genre !== filter) return false;
    if (search && !(i.title || '').toLowerCase().includes(search.toLowerCase()) && !(i.artist || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="music-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Music className="w-8 h-8 text-purple-400" />Musique</h1>
      <p className="text-muted-foreground mb-6">{items.length} contenu{items.length > 1 ? 's' : ''} musical{items.length > 1 ? 'aux' : ''}</p>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map(g => (
            <button key={g} onClick={() => setFilter(g)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === g ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
              {g === 'all' ? 'Tous' : g}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(item => (
          <div key={item._id} onClick={() => setSelected(item)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group" data-testid={`music-${item._id}`}>
            <div className="aspect-square bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center relative overflow-hidden">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              ) : <Music className="w-12 h-12 text-purple-400/30" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{item.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
              {item.genre && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">{item.genre}</span>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun contenu musical. L'admin peut en ajouter depuis le panneau d'administration.</p>}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-48 h-48 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {selected.thumbnail_url ? <img src={selected.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-16 h-16 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selected.title}</h2>
                  <p className="text-lg text-muted-foreground mt-1">{selected.artist}</p>
                  {selected.genre && <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">{selected.genre}</span>}
                  {selected.description && <p className="text-sm text-muted-foreground mt-3">{selected.description}</p>}
                  {selected.streaming_url && (
                    <a href={selected.streaming_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm">
                      <Play className="w-4 h-4" />Ecouter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
