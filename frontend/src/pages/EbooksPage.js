import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { BookOpen, Eye, Sparkles, Library, Layers, Zap, Search, X } from 'lucide-react';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

export default function EbooksPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 200);

  useEffect(() => {
    API.get('/api/ebooks').then(({ data }) => {
      const l = data.ebooks || data.items || (Array.isArray(data) ? data : []);
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
    if (dSearch) {
      const q = dSearch.toLowerCase();
      if (!(i.title || '').toLowerCase().includes(q) && !(i.author || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, filter, dSearch]);

  const cTotal = useCountUp(items.length);
  const cCats = useCountUp(Object.keys(catCounts).length);
  const cShown = useCountUp(filtered.length);

  return (
    <PageWrapper testId="ebooks-page" accents={['rgba(245,158,11,0.55)', 'rgba(234,88,12,0.5)', 'rgba(217,70,239,0.45)']}>
      <PageHero
        badge="Bibliothèque numérique"
        badgeIcon={Library}
        title="Ebooks"
        subtitle="livres &"
        highlight="histoires"
        description="Romans, BD, mangas, essais, manuels — toute la lecture en numérique. Plongez dans des milliers de pages."
        gradient="rgba(245,158,11,0.18), rgba(234,88,12,0.12) 35%, rgba(239,68,68,0.18) 65%, rgba(217,70,239,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #fcd34d 40%, #fdba74 70%, #f0abfc 100%)"
        highlightGradient="linear-gradient(135deg, #f59e0b, #ea580c, #d946ef)"
        blobColor1="rgba(245,158,11,0.6)"
        blobColor2="rgba(217,70,239,0.55)"
        stats={[
          { icon: BookOpen, label: 'Ebooks', value: cTotal, accent: 'rgba(245,158,11,0.7)' },
          { icon: Layers, label: 'Catégories', value: cCats, accent: 'rgba(234,88,12,0.7)' },
          { icon: Zap, label: 'Affichés', value: cShown, accent: 'rgba(217,70,239,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Titre ou auteur..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-amber-500/50 focus:bg-white/10 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {categories.map(c => (
                <Pill key={c} active={filter === c} onClick={() => setFilter(c)} icon={c === 'all' ? Sparkles : undefined}
                      color={c === 'all' ? '#f59e0b' : '#ea580c'}
                      count={c === 'all' ? items.length : catCounts[c]}>{c === 'all' ? 'Toutes' : c}</Pill>
              ))}
            </div>
          )}
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {filtered.map((item, i) => (
            <Link key={item._id || item.id} to={`/ebooks/${item._id || item.id}`}
                  className="group relative wv-fade-in" style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
                  data-testid={`ebook-${item._id || item.id}`}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-fuchsia-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none" />
              <div className="relative h-full bg-[#0b1220]/80 backdrop-blur-md border border-white/10 group-hover:border-amber-400/40 rounded-2xl overflow-hidden transition-all">
                <div className="aspect-[2/3] bg-gradient-to-br from-amber-900/40 to-orange-900/40 flex items-center justify-center relative overflow-hidden">
                  {(item.cover_url || item.cover) ? <img src={item.cover_url || item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <BookOpen className="w-12 h-12 text-amber-400/40" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-2xl">
                        <Eye className="w-3.5 h-3.5" /> Lire
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="font-bold text-sm text-white line-clamp-2 group-hover:text-amber-300 transition-colors">{item.title}</h3>
                  <p className="text-[11px] text-white/55 truncate mt-0.5">{item.author}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={BookOpen} text="Aucun ebook" gradient="from-amber-950/30 via-orange-950/20 to-fuchsia-950/30" />
      )}
    </PageWrapper>
  );
}
