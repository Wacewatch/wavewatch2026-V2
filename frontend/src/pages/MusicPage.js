import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Music, Play, Sparkles, Disc3, Layers, Zap, Search, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

export default function MusicPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 200);

  useEffect(() => { API.get('/api/music').then(({ data }) => setItems(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  const genreCounts = useMemo(() => {
    const m = {};
    items.forEach(i => { const k = i.genre || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [items]);
  const genres = useMemo(() => ['all', ...Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a])], [genreCounts]);
  const filtered = useMemo(() => items.filter(i => {
    if (filter !== 'all' && i.genre !== filter) return false;
    if (dSearch && !(i.title || '').toLowerCase().includes(dSearch.toLowerCase()) && !(i.artist || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [items, filter, dSearch]);

  const cTotal = useCountUp(items.length);
  const cGenres = useCountUp(Object.keys(genreCounts).length);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="music-page" accents={['rgba(217,70,239,0.55)', 'rgba(168,85,247,0.5)', 'rgba(244,114,182,0.45)']}>
      <PageHero
        badge="Beats • Vibes"
        badgeIcon={Disc3}
        title="Musique"
        subtitle="le son qui"
        highlight="vibe"
        description="Explorez une bibliothèque musicale étendue. Pop, rap, électro, classique, jazz — tous les genres, toutes les émotions."
        gradient="rgba(217,70,239,0.18), rgba(168,85,247,0.12) 35%, rgba(244,114,182,0.18) 65%, rgba(99,102,241,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #f0abfc 40%, #c4b5fd 70%, #f9a8d4 100%)"
        highlightGradient="linear-gradient(135deg, #d946ef, #a855f7, #ec4899)"
        blobColor1="rgba(217,70,239,0.6)"
        blobColor2="rgba(168,85,247,0.55)"
        stats={[
          { icon: Music, label: 'Titres', value: cTotal, accent: 'rgba(217,70,239,0.7)' },
          { icon: Layers, label: 'Genres', value: cGenres, accent: 'rgba(168,85,247,0.7)' },
          { icon: Zap, label: 'Affichés', value: cShown, accent: 'rgba(244,114,182,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Titre ou artiste..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-fuchsia-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          {genres.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {genres.map(g => (
                <Pill key={g} active={filter === g} onClick={() => setFilter(g)} icon={g === 'all' ? Sparkles : undefined}
                      color={g === 'all' ? '#d946ef' : '#a855f7'}
                      count={g === 'all' ? items.length : genreCounts[g]}>{g === 'all' ? 'Tous' : g}</Pill>
              ))}
            </div>
          )}
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {filtered.map((item, i) => (
            <Link key={item._id} to={`/music/${item._id}`}
                  className="group relative wv-fade-in" style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
                  data-testid={`music-${item._id}`}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none" />
              <div className="relative h-full bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-fuchsia-400/40 rounded-2xl overflow-hidden transition-all">
                <div className="aspect-square bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 flex items-center justify-center relative overflow-hidden">
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Music className="w-12 h-12 text-fuchsia-400/40" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold text-xs shadow-2xl">
                        <Play className="w-3.5 h-3.5 fill-current" /> Écouter
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-fuchsia-300 transition-colors">{item.title}</h3>
                  <p className="text-[11px] text-white/55 truncate">{item.artist}</p>
                  {item.genre && <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">{item.genre}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Music} text="Aucun contenu musical" gradient="from-fuchsia-950/30 via-purple-950/20 to-pink-950/30" />
      )}
    </PageWrapper>
  );
}
