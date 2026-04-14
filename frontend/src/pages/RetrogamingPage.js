import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Gamepad2 } from 'lucide-react';

export default function RetrogamingPage() {
  const [games, setGames] = useState([]);
  const [playUrl, setPlayUrl] = useState(null);

  useEffect(() => { API.get('/api/retrogaming').then(({ data }) => setGames(data.games || [])).catch(() => {}); }, []);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="retrogaming-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Gamepad2 className="w-8 h-8" />Retrogaming</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {games.map(g => (
          <button key={g.id} onClick={() => setPlayUrl(g.play_url)} className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
            <div className="w-20 h-20 mx-auto mb-3 rounded-lg overflow-hidden bg-muted">
              <img src={g.cover} alt={g.name} className="w-full h-full object-cover" onError={e => { e.target.src = 'https://placehold.co/200x200/333/ccc?text=Game'; }} />
            </div>
            <h3 className="font-medium text-sm">{g.name}</h3>
            <p className="text-xs text-muted-foreground">{g.console} ({g.year})</p>
          </button>
        ))}
      </div>
      {playUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPlayUrl(null)}>
          <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-3 border-b border-gray-800"><span className="text-white">Retrogaming</span><button onClick={() => setPlayUrl(null)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="aspect-video"><iframe src={playUrl} title="Game" className="w-full h-full" allowFullScreen /></div>
          </div>
        </div>
      )}
    </div>
  );
}
