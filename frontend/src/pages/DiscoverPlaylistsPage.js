import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Globe, ListMusic } from 'lucide-react';

export default function DiscoverPlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  useEffect(() => { API.get('/api/playlists/public/discover').then(({ data }) => setPlaylists(data.playlists || [])).catch(() => {}); }, []);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="discover-playlists-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Globe className="w-8 h-8" />Decouvrir des Playlists</h1>
      {playlists.length === 0 ? (
        <div className="text-center py-20"><ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Aucune playlist publique</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(p => (
            <div key={p._id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Par {p.username}</p>
              {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
              <span className="text-xs text-muted-foreground mt-2 block">{p.items?.length || 0} elements</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
