import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Monitor } from 'lucide-react';

export default function SoftwarePage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/software').then(({ data }) => { const l = data.software || data.items || (Array.isArray(data) ? data : []); setItems(l); }).catch(() => {}); }, []);

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="software-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Monitor className="w-8 h-8 text-blue-400" />Logiciels</h1>
      <p className="text-muted-foreground mb-6">{items.length} logiciel{items.length > 1 ? 's' : ''} - Utilisez la recherche principale pour filtrer</p>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">{categories.map(c => (<button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{c === 'all' ? 'Tous' : c}</button>))}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
          <Link key={item._id || item.id} to={`/logiciels/${item._id || item.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group" data-testid={`software-${item._id || item.id}`}>
            <div className="p-4 flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {(item.icon_url || item.icon) ? <img src={item.icon_url || item.icon} alt="" className="w-full h-full object-contain p-1" /> : <Monitor className="w-8 h-8 text-blue-400/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate group-hover:text-blue-400 transition-colors">{item.name}</h3>
                {item.developer && <p className="text-xs text-muted-foreground">{item.developer}</p>}
                <div className="flex gap-1 mt-1">
                  {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{item.category}</span>}
                  {item.platform && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">{item.platform}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun logiciel.</p>}
    </div>
  );
}
