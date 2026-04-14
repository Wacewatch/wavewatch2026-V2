import React, { useState } from 'react';
import { Play, Clock, Calendar, MapPin, Search, Star, Users } from 'lucide-react';

const spectacles = [
  { id: 1, title: 'Le Roi Lion', description: 'La comedie musicale Disney au Theatre Mogador', duration: '150 min', date: '2024-03-15', venue: 'Theatre Mogador, Paris', genre: 'Comedie musicale', type: 'Theatre', rating: 9.2, cast: 'Troupe internationale' },
  { id: 2, title: 'Gad Elmaleh - D\'Ailleurs', description: 'Spectacle d\'humour au Palais des Sports', duration: '90 min', date: '2024-02-20', venue: 'Palais des Sports, Paris', genre: 'Humour', type: 'Stand-up', rating: 8.7, cast: 'Gad Elmaleh' },
  { id: 3, title: 'Romeo et Juliette', description: 'Ballet de l\'Opera de Paris', duration: '120 min', date: '2024-01-10', venue: 'Opera Bastille, Paris', genre: 'Ballet', type: 'Danse', rating: 9.5, cast: 'Corps de ballet' },
  { id: 4, title: 'Jamel Comedy Club', description: 'Les nouveaux talents de l\'humour', duration: '110 min', date: '2024-04-05', venue: 'Comedie de Paris', genre: 'Humour', type: 'Stand-up', rating: 7.9, cast: 'Divers humoristes' },
  { id: 5, title: 'La Traviata', description: 'Opera de Giuseppe Verdi', duration: '180 min', date: '2023-12-08', venue: 'Opera Garnier, Paris', genre: 'Opera', type: 'Opera', rating: 9.4, cast: 'Choeurs et orchestre' },
  { id: 6, title: 'Cirque du Soleil - Kooza', description: 'Spectacle acrobatique extraordinaire', duration: '135 min', date: '2024-05-12', venue: 'Chapiteau Pelouse de Reuilly', genre: 'Cirque', type: 'Cirque', rating: 9.1, cast: 'Artistes du Cirque du Soleil' },
];

const genres = ['Tous', 'Theatre', 'Humour', 'Opera', 'Ballet', 'Cirque', 'Comedie musicale'];

export default function SpectaclesPage() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('Tous');

  const filtered = spectacles.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) && (genre === 'Tous' || s.genre === genre)).sort((a, b) => b.rating - a.rating);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="spectacles-page">
      <h1 className="text-3xl font-bold mb-2">Spectacles</h1>
      <p className="text-muted-foreground mb-6">Theatre, opera, ballet, cirque et humour</p>
      <div className="bg-secondary/30 rounded-xl p-4 mb-8 border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background outline-none" /></div>
        <div className="flex gap-2 flex-wrap">{genres.map(g => <button key={g} onClick={() => setGenre(g)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${genre === g ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{g}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
            <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
              <Play className="w-12 h-12 text-white/30 group-hover:text-white/60 transition-colors" />
              <span className="absolute top-3 left-3 px-2 py-1 text-xs rounded bg-purple-600 text-white">{s.type}</span>
              <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 rounded px-2 py-1 text-xs text-white"><Star className="w-3 h-3 text-yellow-400" />{s.rating}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400">{s.title}</h3>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full border border-purple-500/50 text-purple-400 mb-2">{s.genre}</span>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{s.duration}</div>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{new Date(s.date).toLocaleDateString('fr-FR')}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{s.venue}</span></div>
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{s.cast}</div>
              </div>
              <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-2 transition-colors"><Play className="w-4 h-4" />Regarder</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun spectacle trouve</p>}
    </div>
  );
}
