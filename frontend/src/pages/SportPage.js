import React, { useState, useMemo } from 'react';
import { Play, Clock, Calendar, Search, Trophy, Users, Sparkles, Layers, Zap, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, useCountUp, useDebounced } from '../components/design/PageHero';

const sportsContent = [
  { id: 1, title: 'Ligue 1 - PSG vs OM', description: 'Le Classique français en direct', duration: 'Live', date: '2024-01-15', sport: 'Football', type: 'Live', viewers: '2.3M' },
  { id: 2, title: 'NBA Finals 2023', description: 'Les meilleurs moments des finales NBA', duration: '240 min', date: '2023-06-15', sport: 'Basketball', type: 'Replay', viewers: '1.8M' },
  { id: 3, title: 'Roland Garros 2024', description: 'Finale hommes en direct', duration: 'Live', date: '2024-06-09', sport: 'Tennis', type: 'Live', viewers: '5.2M' },
  { id: 4, title: 'Formule 1 - GP de Monaco', description: 'Le Grand Prix le plus prestigieux', duration: '180 min', date: '2024-05-26', sport: 'F1', type: 'Replay', viewers: '3.1M' },
  { id: 5, title: 'Champions League', description: 'Real Madrid vs Manchester City', duration: '120 min', date: '2024-04-17', sport: 'Football', type: 'Replay', viewers: '4.7M' },
  { id: 6, title: 'Tour de France 2024', description: 'Étape des Alpes en direct', duration: 'Live', date: '2024-07-15', sport: 'Cyclisme', type: 'Live', viewers: '892K' },
];

const sports = ['Tous', 'Football', 'Basketball', 'Tennis', 'F1', 'Cyclisme'];

export default function SportPage() {
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('Tous');
  const dSearch = useDebounced(search, 200);

  const filtered = useMemo(() => sportsContent.filter(c => c.title.toLowerCase().includes(dSearch.toLowerCase()) && (sport === 'Tous' || c.sport === sport)), [dSearch, sport]);
  const liveOnes = useMemo(() => sportsContent.filter(c => c.type === 'Live'), []);

  const cTotal = useCountUp(sportsContent.length);
  const cLive = useCountUp(liveOnes.length);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="sport-page" accents={['rgba(34,197,94,0.55)', 'rgba(59,130,246,0.5)', 'rgba(239,68,68,0.45)']}>
      <PageHero
        badge="Live • Replay • Highlights"
        badgeIcon={Trophy}
        title="Sport"
        subtitle="vibrez en"
        highlight="direct"
        description="Football, basket, tennis, F1, cyclisme — tous les événements sportifs majeurs en direct ou en replay."
        gradient="rgba(34,197,94,0.18), rgba(59,130,246,0.12) 35%, rgba(239,68,68,0.18) 65%, rgba(234,88,12,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #86efac 40%, #93c5fd 70%, #fca5a5 100%)"
        highlightGradient="linear-gradient(135deg, #22c55e, #3b82f6, #ef4444)"
        blobColor1="rgba(34,197,94,0.6)"
        blobColor2="rgba(239,68,68,0.55)"
        stats={[
          { icon: Trophy, label: 'Événements', value: cTotal, accent: 'rgba(34,197,94,0.7)' },
          { icon: Zap, label: 'En Direct', value: cLive, accent: 'rgba(239,68,68,0.7)' },
          { icon: Layers, label: 'Affichés', value: cShown, accent: 'rgba(59,130,246,0.7)' },
        ]}
      />

      {/* Live banner */}
      {liveOnes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" /></span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">En Direct</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveOnes.map((c, i) => (
              <div key={c.id} className="relative group wv-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 opacity-50 group-hover:opacity-80 blur-xl transition-opacity pointer-events-none" />
                <div className="relative bg-[#0b1220]/90 backdrop-blur-md border border-red-500/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/30 text-blue-200 border border-blue-500/40 font-bold">{c.sport}</span>
                  </div>
                  <h3 className="font-bold text-base text-white mb-1">{c.title}</h3>
                  <p className="text-xs text-white/60 mb-3">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-white/55"><Users className="w-3 h-3" />{c.viewers}</span>
                    <button className="px-3 h-9 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-red-500/30 hover:scale-[1.02] transition-transform"><Play className="w-3.5 h-3.5 fill-current" />Regarder</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher un événement..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {sports.map(s => (
              <Pill key={s} active={sport === s} onClick={() => setSport(s)} icon={s === 'Tous' ? Sparkles : undefined} color={s === 'Tous' ? '#22c55e' : '#3b82f6'}>{s}</Pill>
            ))}
          </div>
        </div>
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((c, i) => (
          <div key={c.id} className="group relative wv-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-500 to-red-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity pointer-events-none" />
            <div className="relative bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-emerald-400/40 rounded-2xl overflow-hidden transition-all">
              <div className="h-40 bg-gradient-to-br from-blue-900/50 to-emerald-900/50 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <Trophy className="w-14 h-14 text-white/20 group-hover:text-white/50 group-hover:scale-110 transition-all" />
                {c.type === 'Live' ? <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE</span> : <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/40 text-blue-100 border border-blue-400/40">{c.type}</span>}
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white bg-black/60 backdrop-blur rounded-full px-2 py-0.5 font-bold"><Users className="w-3 h-3" />{c.viewers}</span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{c.title}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">{c.sport}</span>
                <p className="text-xs text-white/55 mt-2 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between text-[10px] text-white/50 mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
                </div>
                <button className="w-full mt-3 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform"><Play className="w-3.5 h-3.5 fill-current" />{c.type === 'Live' ? 'Regarder en direct' : 'Regarder'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
