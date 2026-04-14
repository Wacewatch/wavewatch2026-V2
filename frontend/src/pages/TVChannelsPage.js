import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Tv, Radio } from 'lucide-react';

export default function TVChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { API.get('/api/tv-channels').then(({ data }) => setChannels(data.channels || [])).catch(() => {}); }, []);

  const categories = ['all', ...new Set(channels.map(c => c.category))];
  const filtered = filter === 'all' ? channels : channels.filter(c => c.category === filter);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="tv-channels-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Tv className="w-8 h-8" />Chaines TV</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
            {c === 'all' ? 'Toutes' : c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(ch => (
          <div key={ch.id} className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-white p-2 flex items-center justify-center">
              <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain" onError={e => { e.target.src = 'https://placehold.co/100x100/eee/333?text=TV'; }} />
            </div>
            <h3 className="font-medium text-sm">{ch.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{ch.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
