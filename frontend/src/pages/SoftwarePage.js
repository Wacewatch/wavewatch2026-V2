import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Monitor, Sparkles, Cpu, Layers, Zap, Search, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

export default function SoftwarePage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 200);

  useEffect(() => {
    API.get('/api/software').then(({ data }) => {
      const l = data.software || data.items || (Array.isArray(data) ? data : []);
      setItems(l);
    }).catch(() => {});
  }, []);

  const catCounts = useMemo(() => {
    const m = {};
    items.forEach(i => { const k = i.category || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [items]);
  const categories = useMemo(() => ['all', ...Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])], [catCounts]);
  const filtered = useMemo(() => items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (dSearch && !(i.name || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [items, filter, dSearch]);

  const cTotal = useCountUp(items.length);
  const cCats = useCountUp(Object.keys(catCounts).length);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="software-page" accents={['rgba(6,182,212,0.55)', 'rgba(59,130,246,0.5)', 'rgba(99,102,241,0.45)']}>
      <PageHero
        badge="Apps • Outils • Utilitaires"
        badgeIcon={Cpu}
        title="Logiciels"
        subtitle="boostez votre"
        highlight="setup"
        description="Apps de productivité, outils dev, suites créatives, utilitaires système. Tout le software dont vous avez besoin."
        gradient="rgba(6,182,212,0.18), rgba(59,130,246,0.12) 35%, rgba(99,102,241,0.18) 65%, rgba(168,85,247,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #67e8f9 40%, #93c5fd 70%, #c4b5fd 100%)"
        highlightGradient="linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)"
        blobColor1="rgba(6,182,212,0.6)"
        blobColor2="rgba(99,102,241,0.55)"
        stats={[
          { icon: Monitor, label: 'Logiciels', value: cTotal, accent: 'rgba(6,182,212,0.7)' },
          { icon: Layers, label: 'Catégories', value: cCats, accent: 'rgba(59,130,246,0.7)' },
          { icon: Zap, label: 'Affichés', value: cShown, accent: 'rgba(99,102,241,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher un logiciel..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {categories.map(c => (
                <Pill key={c} active={filter === c} onClick={() => setFilter(c)} icon={c === 'all' ? Sparkles : undefined}
                      color={c === 'all' ? '#06b6d4' : '#3b82f6'}
                      count={c === 'all' ? items.length : catCounts[c]}>{c === 'all' ? 'Toutes' : c}</Pill>
              ))}
            </div>
          )}
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
          {filtered.map((item, i) => (
            <Link key={item._id || item.id} to={`/logiciels/${item._id || item.id}`}
                  className="group relative wv-fade-in" style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
                  data-testid={`software-${item._id || item.id}`}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none" />
              <div className="relative h-full bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-cyan-400/40 rounded-2xl p-4 transition-all flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/95 flex-shrink-0 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                  {(item.icon_url || item.icon) ? <img src={item.icon_url || item.icon} alt="" className="w-full h-full object-contain p-1.5" /> : <Monitor className="w-8 h-8 text-cyan-400/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{item.name}</h3>
                  {item.developer && <p className="text-xs text-white/55 truncate">{item.developer}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.category && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">{item.category}</span>}
                    {item.platform && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">{item.platform}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Monitor} text="Aucun logiciel" gradient="from-cyan-950/30 via-blue-950/20 to-indigo-950/30" />
      )}
    </PageWrapper>
  );
}
