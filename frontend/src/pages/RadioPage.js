import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Radio as RadioIcon, Play, Pause } from 'lucide-react';

export default function RadioPage() {
  const [stations, setStations] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [audio] = useState(() => typeof Audio !== 'undefined' ? new Audio() : null);

  useEffect(() => { API.get('/api/radio-stations').then(({ data }) => setStations(data.stations || [])).catch(() => {}); }, []);

  const togglePlay = (station) => {
    if (!audio) return;
    if (playing === station.id) { audio.pause(); setPlaying(null); }
    else { audio.src = station.stream_url; audio.play().catch(() => {}); setPlaying(station.id); }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="radio-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><RadioIcon className="w-8 h-8" />Radio FM</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stations.map(s => (
          <div key={s.id} className={`bg-card border rounded-xl p-4 transition-colors ${playing === s.id ? 'border-primary' : 'border-border hover:border-primary/30'}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-white p-1.5 flex-shrink-0 flex items-center justify-center">
                <img src={s.logo} alt={s.name} className="w-full h-full object-contain" onError={e => { e.target.src = 'https://placehold.co/100x100/eee/333?text=FM'; }} />
              </div>
              <div className="flex-1 min-w-0"><h3 className="font-medium truncate">{s.name}</h3><p className="text-xs text-muted-foreground">{s.genre}</p></div>
              {s.stream_url && (
                <button onClick={() => togglePlay(s)} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${playing === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-primary hover:text-primary-foreground'} transition-colors`}>
                  {playing === s.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
