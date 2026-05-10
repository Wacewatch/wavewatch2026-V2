import React, { useState, useMemo } from 'react';
import { Play, Clock, Search, Star, Sparkles, Globe, Layers, Zap, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, useCountUp, useDebounced } from '../components/design/PageHero';

const docs = [
  { id: 1, title: 'Planet Earth II', description: 'Une exploration extraordinaire de la vie sauvage', duration: '360 min', year: 2016, genre: 'Nature', rating: 9.5 },
  { id: 2, title: 'Free Solo', description: "L'ascension périlleuse d'Alex Honnold sur El Capitan", duration: '100 min', year: 2018, genre: 'Sport', rating: 8.2 },
  { id: 3, title: 'Our Planet', description: 'La beauté naturelle de notre planète', duration: '480 min', year: 2019, genre: 'Nature', rating: 9.3 },
  { id: 4, title: 'The Social Dilemma', description: 'Les dangers cachés des réseaux sociaux', duration: '94 min', year: 2020, genre: 'Technologie', rating: 7.6 },
  { id: 5, title: "Won't You Be My Neighbor?", description: 'La vie et héritage de Fred Rogers', duration: '94 min', year: 2018, genre: 'Biographie', rating: 8.4 },
  { id: 6, title: 'Cosmos: A Spacetime Odyssey', description: "Un voyage à travers l'univers avec Neil deGrasse Tyson", duration: '780 min', year: 2014, genre: 'Science', rating: 9.3 },
];

const genres = ['Tous', 'Nature', 'Science', 'Biographie', 'Sport', 'Technologie'];

export default function DocumentairesPage() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('Tous');
  const dSearch = useDebounced(search, 200);

  const filtered = useMemo(() => docs.filter(d => d.title.toLowerCase().includes(dSearch.toLowerCase()) && (genre === 'Tous' || d.genre === genre)).sort((a, b) => b.rating - a.rating), [dSearch, genre]);

  const cTotal = useCountUp(docs.length);
  const cGenres = useCountUp(genres.length - 1);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="documentaires-page" accents={['rgba(20,184,166,0.55)', 'rgba(59,130,246,0.5)', 'rgba(132,204,22,0.45)']}>
      <PageHero
        badge="Reportages • Société • Sciences"
        badgeIcon={Globe}
        title="Documentaires"
        subtitle="apprendre en"
        highlight="images"
        description="Nature, science, histoire, technologie — élargissez vos horizons avec les meilleurs documentaires."
        gradient="rgba(20,184,166,0.18), rgba(59,130,246,0.12) 35%, rgba(132,204,22,0.18) 65%, rgba(168,85,247,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #5eead4 40%, #93c5fd 70%, #bef264 100%)"
        highlightGradient="linear-gradient(135deg, #14b8a6, #3b82f6, #84cc16)"
        blobColor1="rgba(20,184,166,0.6)"
        blobColor2="rgba(59,130,246,0.55)"
        stats={[
          { icon: Globe, label: 'Docs', value: cTotal, accent: 'rgba(20,184,166,0.7)' },
          { icon: Layers, label: 'Genres', value: cGenres, accent: 'rgba(59,130,246,0.7)' },
          { icon: Zap, label: 'Affichés', value: cShown, accent: 'rgba(132,204,22,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-teal-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {genres.map(g => (
              <Pill key={g} active={genre === g} onClick={() => setGenre(g)} icon={g === 'Tous' ? Sparkles : undefined} color={g === 'Tous' ? '#14b8a6' : '#3b82f6'}>{g}</Pill>
            ))}
          </div>
        </div>
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d, i) => (
          <div key={d.id} className="group relative wv-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-500 via-blue-500 to-lime-500 opacity-0 group-hover:opacity-40 blur-xl transition-opacity pointer-events-none" />
            <div className="relative bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-teal-400/40 rounded-2xl overflow-hidden transition-all">
              <div className="h-44 bg-gradient-to-br from-teal-900/40 to-blue-900/40 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(20,184,166,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.4) 0%, transparent 50%)' }} />
                <Play className="w-14 h-14 text-white/20 group-hover:text-white/60 group-hover:scale-110 transition-all" />
                <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-white"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{d.rating}</span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-white truncate group-hover:text-teal-300 transition-colors">{d.title}</h3>
                <div className="flex items-center justify-between text-xs text-white/50 mt-1"><span>{d.year}</span><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">{d.genre}</span></div>
                <p className="text-xs text-white/55 mt-2 line-clamp-2">{d.description}</p>
                <div className="flex items-center justify-between text-[10px] text-white/45 mt-2"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.duration}</span></div>
                <button className="w-full mt-3 h-9 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-transform"><Play className="w-3.5 h-3.5 fill-current" />Regarder</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
