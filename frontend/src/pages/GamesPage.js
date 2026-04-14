import React, { useState } from 'react';
import { Gamepad2, Play, Star, Users, Search } from 'lucide-react';

const games = [
  { id: 1, name: 'Tetris Classique', description: 'Le jeu de puzzle legendaire', category: 'Puzzle', players: '1', rating: 9.0, url: 'https://www.retrogames.onl/play/gb/tetris.html' },
  { id: 2, name: 'Snake', description: 'Le serpent affame', category: 'Arcade', players: '1', rating: 7.5, url: '' },
  { id: 3, name: '2048', description: 'Combinez les tuiles pour atteindre 2048', category: 'Puzzle', players: '1', rating: 8.2, url: '' },
  { id: 4, name: 'Morpion', description: 'Le classique Tic-Tac-Toe', category: 'Strategie', players: '2', rating: 6.5, url: '' },
  { id: 5, name: 'Memory', description: 'Testez votre memoire', category: 'Puzzle', players: '1', rating: 7.8, url: '' },
  { id: 6, name: 'Quiz Cinema', description: 'Testez vos connaissances cinema', category: 'Quiz', players: '1-4', rating: 8.5, url: '' },
  { id: 7, name: 'Devinez le Film', description: 'Devinez le film a partir d\'indices', category: 'Quiz', players: '1-4', rating: 8.0, url: '' },
  { id: 8, name: 'Minesweeper', description: 'Le classique demineur', category: 'Strategie', players: '1', rating: 7.9, url: '' },
];

const categories = ['Tous', 'Puzzle', 'Arcade', 'Strategie', 'Quiz'];

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  const filtered = games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) && (category === 'Tous' || g.category === category));

  return (
    <div className="container mx-auto px-4 py-8" data-testid="games-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Gamepad2 className="w-8 h-8 text-green-400" />Jeux</h1>
      <p className="text-muted-foreground mb-6">Des jeux gratuits directement dans votre navigateur</p>

      <div className="bg-secondary/30 rounded-xl p-4 mb-8 border border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Rechercher un jeu..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background outline-none" data-testid="games-search" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${category === c ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(game => (
          <div key={game.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group" data-testid={`game-card-${game.id}`}>
            <div className="h-40 bg-gradient-to-br from-green-900/50 to-blue-900/50 flex items-center justify-center relative">
              <Gamepad2 className="w-16 h-16 text-white/20 group-hover:text-white/50 transition-colors" />
              <span className="absolute top-3 left-3 px-2 py-0.5 text-xs rounded bg-green-600 text-white">{game.category}</span>
              <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 rounded px-2 py-1 text-xs text-white">
                <Star className="w-3 h-3 text-yellow-400" />{game.rating}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-green-400 transition-colors">{game.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{game.players} joueur{game.players !== '1' ? 's' : ''}</span>
              </div>
              <button className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center justify-center gap-2 transition-colors" data-testid={`play-game-${game.id}`}>
                <Play className="w-4 h-4" />Jouer
              </button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun jeu trouve</p>}
    </div>
  );
}
