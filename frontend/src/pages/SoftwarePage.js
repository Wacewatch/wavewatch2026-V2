import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Monitor, Download, Search, X, ExternalLink } from 'lucide-react';

export default function SoftwarePage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/api/software').then(({ data }) => {
      const list = data.items || data.software || data || [];
      setItems(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (search && !(i.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="software-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Monitor className="w-8 h-8 text-blue-400" />Logiciels</h1>
      <p className="text-muted-foreground mb-6">{items.length} logiciel{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item._id || item.id} onClick={() => setSelected(item)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group" data-testid={`software-${item._id || item.id}`}>
            <div className="p-4 flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {(item.icon_url || item.icon) ? <img src={item.icon_url || item.icon} alt="" className="w-full h-full object-contain p-1" onError={e => { e.target.style.display = 'none'; }} /> : <Monitor className="w-8 h-8 text-blue-400/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate group-hover:text-blue-400 transition-colors">{item.name}</h3>
                {item.developer && <p className="text-xs text-muted-foreground">{item.developer}</p>}
                <div className="flex gap-1 mt-1">
                  {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{item.category}</span>}
                  {item.platform && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">{item.platform}</span>}
                </div>
                {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun logiciel. L'admin peut en ajouter depuis le panneau d'administration.</p>}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                  {(selected.icon_url || selected.icon) ? <img src={selected.icon_url || selected.icon} alt="" className="w-full h-full object-contain p-2" /> : <Monitor className="w-12 h-12 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  {selected.developer && <p className="text-muted-foreground mt-1">{selected.developer}</p>}
                  <div className="flex gap-2 mt-2">
                    {selected.category && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">{selected.category}</span>}
                    {selected.platform && <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">{selected.platform}</span>}
                  </div>
                  {selected.description && <p className="text-sm text-muted-foreground mt-3">{selected.description}</p>}
                  {selected.download_url && (
                    <a href={selected.download_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                      <Download className="w-4 h-4" />Telecharger
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
