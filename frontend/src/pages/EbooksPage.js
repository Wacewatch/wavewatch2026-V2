import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { BookOpen, Search, X, Download, ExternalLink, Eye } from 'lucide-react';

export default function EbooksPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/api/ebooks').then(({ data }) => {
      const list = data.items || data.ebooks || data || [];
      setItems(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (search && !(i.title || '').toLowerCase().includes(search.toLowerCase()) && !(i.author || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="ebooks-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BookOpen className="w-8 h-8 text-orange-400" />Ebooks</h1>
      <p className="text-muted-foreground mb-6">{items.length} ebook{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}</p>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(item => (
          <div key={item._id || item.id} onClick={() => setSelected(item)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group" data-testid={`ebook-${item._id || item.id}`}>
            <div className="aspect-[2/3] bg-gradient-to-br from-orange-900/30 to-amber-900/30 flex items-center justify-center relative overflow-hidden">
              {(item.cover_url || item.cover) ? (
                <img src={item.cover_url || item.cover} alt={item.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              ) : <BookOpen className="w-12 h-12 text-orange-400/30" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Eye className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.author}</p>
              <div className="flex gap-1 mt-1">
                {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">{item.category}</span>}
                {item.language && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{item.language}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun ebook. L'admin peut en ajouter depuis le panneau d'administration.</p>}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-40 aspect-[2/3] rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {(selected.cover_url || selected.cover) ? <img src={selected.cover_url || selected.cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-16 h-16 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selected.title}</h2>
                  {selected.author && <p className="text-lg text-muted-foreground mt-1">{selected.author}</p>}
                  <div className="flex gap-2 mt-2">
                    {selected.category && <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400">{selected.category}</span>}
                    {selected.language && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">{selected.language}</span>}
                  </div>
                  {selected.description && <p className="text-sm text-muted-foreground mt-3">{selected.description}</p>}
                  <div className="flex gap-3 mt-4">
                    {selected.reading_url && <a href={selected.reading_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm"><Eye className="w-4 h-4" />Lire en ligne</a>}
                    {selected.download_url && <a href={selected.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-600 text-orange-400 hover:bg-orange-900/20 text-sm"><Download className="w-4 h-4" />Telecharger</a>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
