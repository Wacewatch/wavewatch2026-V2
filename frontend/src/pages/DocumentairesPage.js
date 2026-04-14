import React, { useState } from 'react';
import { Play, Clock, Users, Search, Star } from 'lucide-react';

const docs = [
  { id: 1, title: 'Planet Earth II', description: 'Une exploration extraordinaire de la vie sauvage', duration: '360 min', year: 2016, genre: 'Nature', rating: 9.5 },
  { id: 2, title: 'Free Solo', description: "L'ascension perilleuse d'Alex Honnold sur El Capitan", duration: '100 min', year: 2018, genre: 'Sport', rating: 8.2 },
  { id: 3, title: 'Our Planet', description: 'La beaute naturelle de notre planete', duration: '480 min', year: 2019, genre: 'Nature', rating: 9.3 },
  { id: 4, title: 'The Social Dilemma', description: 'Les dangers caches des reseaux sociaux', duration: '94 min', year: 2020, genre: 'Technologie', rating: 7.6 },
  { id: 5, title: "Won't You Be My Neighbor?", description: 'La vie et heritage de Fred Rogers', duration: '94 min', year: 2018, genre: 'Biographie', rating: 8.4 },
  { id: 6, title: 'Cosmos: A Spacetime Odyssey', description: 'Un voyage a travers univers avec Neil deGrasse Tyson', duration: '780 min', year: 2014, genre: 'Science', rating: 9.3 },
];

const genres = ['Tous', 'Nature', 'Science', 'Biographie', 'Sport', 'Technologie'];

export default function DocumentairesPage() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('Tous');
  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) && (genre === 'Tous' || d.genre === genre)).sort((a, b) => b.rating - a.rating);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="documentaires-page">
      <h1 className="text-3xl font-bold mb-2">Documentaires</h1>
      <p className="text-muted-foreground mb-6">Nature, science, histoire et bien plus</p>
      <div className="bg-secondary/30 rounded-xl p-4 mb-8 border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background outline-none" /></div>
        <div className="flex gap-2 flex-wrap">{genres.map(g => <button key={g} onClick={() => setGenre(g)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${genre === g ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(d => (
          <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
            <div className="h-48 bg-gradient-to-br from-blue-900/50 to-green-900/50 flex items-center justify-center relative">
              <Play className="w-12 h-12 text-white/20 group-hover:text-white/50 transition-colors" />
              <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 rounded px-2 py-1 text-xs text-white"><Star className="w-3 h-3 text-yellow-400" />{d.rating}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400">{d.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2"><span>{d.year}</span><span className="px-2 py-0.5 text-xs rounded-full border border-blue-500/50 text-blue-400">{d.genre}</span></div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{d.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.duration}</span></div>
              <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-2"><Play className="w-4 h-4" />Regarder</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
