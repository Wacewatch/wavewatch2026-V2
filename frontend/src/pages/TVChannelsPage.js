import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Tv, X, Play, Search } from 'lucide-react';

export default function TVChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => { API.get('/api/tv-channels').then(({ data }) => setChannels(data.channels || [])).catch(() => {}); }, []);

  const categories = ['all', ...new Set(channels.map(c => c.category).filter(Boolean))];
  const filtered = channels.filter(c => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-testid="tv-channels-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Tv className="w-8 h-8" />Chaines TV</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
              {c === 'all' ? 'Toutes' : c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(ch => (
          <div key={ch.id || ch._id || ch.name} onClick={() => setSelectedChannel(ch)}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group" data-testid={`channel-${ch.name}`}>
            <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
              {(ch.logo || ch.logo_url) ? (
                <img src={ch.logo || ch.logo_url} alt={ch.name} className="w-full h-full object-contain p-3" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div className={`${(ch.logo || ch.logo_url) ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                <Tv className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3 text-center">
              <h3 className="font-medium text-sm truncate">{ch.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{ch.category}</p>
              {ch.quality && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{ch.quality}</span>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucune chaine trouvee</p>}

      {/* Stream Modal */}
      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedChannel(null)}>
          <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                {(selectedChannel.logo || selectedChannel.logo_url) && (
                  <img src={selectedChannel.logo || selectedChannel.logo_url} alt="" className="h-8 w-auto object-contain" />
                )}
                <div>
                  <h3 className="text-white font-bold">{selectedChannel.name}</h3>
                  <p className="text-xs text-gray-400">{selectedChannel.category} {selectedChannel.country && `- ${selectedChannel.country}`}</p>
                </div>
              </div>
              <button onClick={() => setSelectedChannel(null)} className="text-gray-400 hover:text-white p-1"><X className="w-6 h-6" /></button>
            </div>
            <div className="aspect-video bg-black">
              {(selectedChannel.stream_url) ? (
                <iframe src={selectedChannel.stream_url} title={selectedChannel.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Tv className="w-16 h-16 mb-3" />
                  <p>Aucun flux disponible</p>
                  <p className="text-sm mt-1">Le flux de cette chaine n'est pas encore configure</p>
                </div>
              )}
            </div>
            {selectedChannel.description && (
              <div className="p-4 border-t border-gray-800">
                <p className="text-sm text-gray-400">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
