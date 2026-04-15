import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Music, Play } from 'lucide-react';

export default function MusicPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/music').then(({ data }) => setItems(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const genres = ['all', ...new Set(items.map(i => i.genre).filter(Boolean))];
  const filtered = filter === 'all' ? items : items.filter(i => i.genre === filter);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="music-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Music className="w-8 h-8 text-purple-400" />Musique</h1>
      <p className="text-muted-foreground mb-6">{items.length} contenu{items.length > 1 ? 's' : ''} musical{items.length > 1 ? 'aux' : ''} - Utilisez la recherche principale pour filtrer</p>
      {genres.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">{genres.map(g => (<button key={g} onClick={() => setFilter(g)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === g ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g === 'all' ? 'Tous' : g}</button>))}</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(item => (
          <Link key={item._id} to={`/music/${item._id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group" data-testid={`music-${item._id}`}>
            <div className="aspect-square bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center relative overflow-hidden">
              {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" /> : <Music className="w-12 h-12 text-purple-400/30" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"><Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            </div>
            <div className="p-3"><h3 className="font-medium text-sm truncate">{item.title}</h3><p className="text-xs text-muted-foreground truncate">{item.artist}</p>{item.genre && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">{item.genre}</span>}</div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun contenu musical.</p>}
    </div>
  );
}
