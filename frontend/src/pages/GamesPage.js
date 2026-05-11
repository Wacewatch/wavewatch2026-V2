import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Gamepad2, Play, Sparkles, Joystick, Layers, Zap, Search, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

export default function GamesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 200);

  useEffect(() => { API.get('/api/games').then(({ data }) => setItems(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const genreCounts = useMemo(() => {
    const m = {};
    items.forEach(i => { const k = i.genre || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [items]);
  const genres = useMemo(() => ['all', ...Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a])], [genreCounts]);
  const filtered = useMemo(() => items.filter(i => {
    if (filter !== 'all' && i.genre !== filter) return false;
    if (dSearch && !(i.title || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [items, filter, dSearch]);

  const cTotal = useCountUp(items.length);
  const cGenres = useCountUp(Object.keys(genreCounts).length);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="games-page" accents={['rgba(34,197,94,0.55)', 'rgba(16,185,129,0.5)', 'rgba(6,182,212,0.45)']}>
      <PageHero
        badge="Console • PC • Mobile"
        badgeIcon={Joystick}
        title="Jeux Vidéo"
        subtitle="Game"
        highlight="On"
        description="Le catalogue gaming complet : AAA, indés, RPG, FPS, sandbox. Tout ce qu'il faut pour ne plus jamais s'ennuyer."
        gradient="rgba(34,197,94,0.18), rgba(16,185,129,0.12) 35%, rgba(6,182,212,0.18) 65%, rgba(99,102,241,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #86efac 40%, #6ee7b7 70%, #67e8f9 100%)"
        highlightGradient="linear-gradient(135deg, #22c55e, #10b981, #06b6d4)"
        blobColor1="rgba(34,197,94,0.6)"
        blobColor2="rgba(6,182,212,0.55)"
        stats={[
          { icon: Gamepad2, label: 'Jeux', value: cTotal, accent: 'rgba(34,197,94,0.7)' },
          { icon: Layers, label: 'Genres', value: cGenres, accent: 'rgba(16,185,129,0.7)' },
          { icon: Zap, label: 'Affichés', value: cShown, accent: 'rgba(6,182,212,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher un jeu..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          {genres.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {genres.map(g => (
                <Pill key={g} active={filter === g} onClick={() => setFilter(g)} icon={g === 'all' ? Sparkles : undefined}
                      color={g === 'all' ? '#22c55e' : '#10b981'}
                      count={g === 'all' ? items.length : genreCounts[g]}>{g === 'all' ? 'Tous' : g}</Pill>
              ))}
            </div>
          )}
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-2.5 md:gap-3">
          {filtered.map((item, i) => (
            <Link key={item._id} to={`/games/${item._id}`}
                  className="group relative wv-fade-in" style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
                  data-testid={`game-${item._id}`}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-cyan-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none" />
              <div className="relative h-full bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-emerald-400/40 rounded-2xl overflow-hidden transition-all">
                <div className="aspect-[3/4] bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 flex items-center justify-center relative overflow-hidden">
                  {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Gamepad2 className="w-12 h-12 text-emerald-400/40" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold text-xs shadow-2xl">
                        <Play className="w-3.5 h-3.5 fill-current" /> Voir
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                  <p className="text-[11px] text-white/55 truncate">{item.developer}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Gamepad2} text="Aucun jeu" gradient="from-emerald-950/30 via-green-950/20 to-cyan-950/30" />
      )}
    </PageWrapper>
  );
}
