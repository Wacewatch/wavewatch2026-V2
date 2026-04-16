import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Gamepad2, ExternalLink, Play, X, Search, Heart } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function RetrogamingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState([]);
  const [playUrl, setPlayUrl] = useState(null);
  const [playName, setPlayName] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { 
    API.get('/api/retrogaming').then(({ data }) => {
      setSources(data.sources || data.games || []);
    }).catch(() => {}); 
  }, []);

  const categories = ['all', ...new Set(sources.map(s => s.category).filter(Boolean))];
  const filtered = filter === 'all' ? sources : sources.filter(s => s.category === filter);

  const openSource = (source) => {
    if (source.url) {
      setPlayUrl(source.url);
      setPlayName(source.name);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="retrogaming-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-green-400" />Retrogaming
          </h1>
          <p className="text-muted-foreground mt-1">{sources.length} source{sources.length > 1 ? 's' : ''} disponible{sources.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat 
                  ? 'bg-green-600 text-white' 
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              {cat === 'all' ? 'Toutes' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Sources Grid - Like TV Channels */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(source => (
            <button
              key={source._id || source.id}
              onClick={() => openSource(source)}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-green-500/50 transition-all group text-left"
              data-testid={`retro-source-${source._id || source.id}`}
            >
              <div className="aspect-video bg-gradient-to-br from-green-900/40 to-emerald-900/40 flex items-center justify-center relative overflow-hidden">
                {source.logo_url || source.image_url ? (
                  <img 
                    src={source.logo_url || source.image_url} 
                    alt={source.name} 
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" 
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Gamepad2 className="w-16 h-16 text-green-400/30 group-hover:text-green-400/50 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <QuickPlaylistAdd contentId={source._id || source.id || source.name} contentType="retrogaming" title={source.name} posterPath={source.logo_url || source.image_url} inline metadata={{ game_url: source.embed_url || source.url }} />
                </div>
                {source.is_active === false && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs bg-red-500/80 text-white">
                    Inactif
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm truncate group-hover:text-green-400 transition-colors">{source.name}</h3>
                {source.category && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                    {source.category}
                  </span>
                )}
                {source.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Aucune source retrogaming</p>
          <p className="text-sm text-muted-foreground">Les sources seront ajoutees par l'administrateur</p>
        </div>
      )}

      {/* Stream Modal */}
      {playUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPlayUrl(null)}>
          <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden border border-green-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-green-500/20">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{playName}</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={playUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setPlayUrl(null)} 
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-black">
              <iframe 
                src={playUrl} 
                title={playName}
                className="w-full h-full" 
                allowFullScreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
