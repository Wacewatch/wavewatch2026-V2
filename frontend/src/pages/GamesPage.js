import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Gamepad2, Play, Search } from 'lucide-react';

export default function GamesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/games').then(({ data }) => setItems(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const genres = ['all', ...new Set(items.map(i => i.genre).filter(Boolean))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.genre !== filter) return false;
    if (search && !(i.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="games-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Gamepad2 className="w-8 h-8 text-green-400" />Jeux</h1>
      <p className="text-muted-foreground mb-6">{items.length} jeu{items.length > 1 ? 'x' : ''}</p>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" /></div>
        <div className="flex flex-wrap gap-2">{genres.map(g => (<button key={g} onClick={() => setFilter(g)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === g ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g === 'all' ? 'Tous' : g}</button>))}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(item => (
          <Link key={item._id} to={`/games/${item._id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group" data-testid={`game-${item._id}`}>
            <div className="aspect-[3/4] bg-gradient-to-br from-green-900/40 to-blue-900/40 flex items-center justify-center relative overflow-hidden">
              {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-12 h-12 text-green-400/30" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"><Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            </div>
            <div className="p-3"><h3 className="font-medium text-sm truncate">{item.title}</h3><p className="text-xs text-muted-foreground truncate">{item.developer}</p></div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun jeu.</p>}
    </div>
  );
}
