import React, { useState } from 'react';
import { Play, Clock, Calendar, Search, Trophy, Users } from 'lucide-react';

const sportsContent = [
  { id: 1, title: 'Ligue 1 - PSG vs OM', description: 'Le Classique francais en direct', duration: 'Live', date: '2024-01-15', sport: 'Football', type: 'Live', viewers: '2.3M' },
  { id: 2, title: 'NBA Finals 2023', description: 'Les meilleurs moments des finales NBA', duration: '240 min', date: '2023-06-15', sport: 'Basketball', type: 'Replay', viewers: '1.8M' },
  { id: 3, title: 'Roland Garros 2024', description: 'Finale hommes en direct', duration: 'Live', date: '2024-06-09', sport: 'Tennis', type: 'Live', viewers: '5.2M' },
  { id: 4, title: 'Formule 1 - GP de Monaco', description: 'Le Grand Prix le plus prestigieux', duration: '180 min', date: '2024-05-26', sport: 'F1', type: 'Replay', viewers: '3.1M' },
  { id: 5, title: 'Champions League', description: 'Real Madrid vs Manchester City', duration: '120 min', date: '2024-04-17', sport: 'Football', type: 'Replay', viewers: '4.7M' },
  { id: 6, title: 'Tour de France 2024', description: 'Etape des Alpes en direct', duration: 'Live', date: '2024-07-15', sport: 'Cyclisme', type: 'Live', viewers: '892K' },
];

const sports = ['Tous', 'Football', 'Basketball', 'Tennis', 'F1', 'Cyclisme'];

export default function SportPage() {
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('Tous');

  const filtered = sportsContent.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) && (sport === 'Tous' || c.sport === sport));

  return (
    <div className="container mx-auto px-4 py-8" data-testid="sport-page">
      <h1 className="text-3xl font-bold mb-2">Sport</h1>
      <p className="text-muted-foreground mb-6">Suivez vos sports favoris en direct ou en replay</p>
      {/* Live section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><h2 className="text-2xl font-bold">En Direct</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sportsContent.filter(c => c.type === 'Live').map(c => (
            <div key={c.id} className="bg-gradient-to-br from-red-900/40 to-blue-900/40 border border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 text-xs rounded bg-red-600 text-white animate-pulse">LIVE</span><span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">{c.sport}</span></div>
              <h3 className="font-bold text-lg mb-1">{c.title}</h3><p className="text-sm text-muted-foreground mb-3">{c.description}</p>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{c.viewers}</span>
                <button className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-1"><Play className="w-4 h-4" />Regarder</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Filters */}
      <div className="bg-secondary/30 rounded-xl p-4 mb-8 border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background outline-none" /></div>
        <div className="flex gap-2 flex-wrap">{sports.map(s => <button key={s} onClick={() => setSport(s)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${sport === s ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{s}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
            <div className="h-40 bg-gradient-to-br from-blue-900/50 to-gray-900/50 flex items-center justify-center relative">
              <Trophy className="w-12 h-12 text-white/20" />
              {c.type === 'Live' ? <span className="absolute top-3 left-3 px-2 py-0.5 text-xs rounded bg-red-600 text-white animate-pulse">LIVE</span> : <span className="absolute top-3 left-3 px-2 py-0.5 text-xs rounded bg-blue-600 text-white">{c.type}</span>}
              <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white bg-black/60 rounded px-2 py-0.5"><Users className="w-3 h-3" />{c.viewers}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold mb-1 group-hover:text-blue-400">{c.title}</h3>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full border border-blue-500/50 text-blue-400 mb-2">{c.sport}</span>
              <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
              </div>
              <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-2"><Play className="w-4 h-4" />{c.type === 'Live' ? 'Regarder en direct' : 'Regarder'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
