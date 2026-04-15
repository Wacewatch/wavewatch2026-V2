import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { BookOpen, Eye, Search } from 'lucide-react';

export default function EbooksPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/ebooks').then(({ data }) => { const l = data.ebooks || data.items || (Array.isArray(data) ? data : []); setItems(l); }).catch(() => {}); }, []);

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (search && !(i.title || '').toLowerCase().includes(search.toLowerCase()) && !(i.author || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="ebooks-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BookOpen className="w-8 h-8 text-orange-400" />Ebooks</h1>
      <p className="text-muted-foreground mb-6">{items.length} ebook{items.length > 1 ? 's' : ''}</p>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" /></div>
        <div className="flex flex-wrap gap-2">{categories.map(c => (<button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{c === 'all' ? 'Tous' : c}</button>))}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(item => (
          <Link key={item._id || item.id} to={`/ebooks/${item._id || item.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group" data-testid={`ebook-${item._id || item.id}`}>
            <div className="aspect-[2/3] bg-gradient-to-br from-orange-900/30 to-amber-900/30 flex items-center justify-center relative overflow-hidden">
              {(item.cover_url || item.cover) ? <img src={item.cover_url || item.cover} alt={item.title} className="w-full h-full object-cover" /> : <BookOpen className="w-12 h-12 text-orange-400/30" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"><Eye className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            </div>
            <div className="p-3"><h3 className="font-medium text-sm line-clamp-2">{item.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{item.author}</p></div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun ebook.</p>}
    </div>
  );
}
