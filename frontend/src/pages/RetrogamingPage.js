import React, { useState, useEffect, useMemo } from 'react';
import API from '../lib/api';
import { Gamepad2, Play, Search, Sparkles, Joystick, Layers, Zap, X } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import IframeModal from '../components/IframeModal';
import { PageWrapper, PageHero, FilterBar, Pill, EmptyState, useCountUp, useDebounced } from '../components/design/PageHero';

const CARD_GRADIENTS = [
  'from-emerald-500 via-green-500 to-lime-500',
  'from-cyan-500 via-emerald-500 to-green-500',
  'from-yellow-400 via-amber-500 to-orange-500',
  'from-pink-500 via-fuchsia-500 to-purple-500',
  'from-blue-500 via-cyan-500 to-emerald-500',
  'from-red-500 via-orange-500 to-yellow-500',
];

export default function RetrogamingPage() {
  const [sources, setSources] = useState([]);
  const [playUrl, setPlayUrl] = useState(null);
  const [playName, setPlayName] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 200);

  useEffect(() => {
    API.get('/api/retrogaming').then(({ data }) => {
      setSources(data.sources || data.games || []);
    }).catch(() => {});
  }, []);

  const catCounts = useMemo(() => {
    const m = {};
    sources.forEach(s => { const k = s.category || 'Autre'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [sources]);
  const categories = useMemo(() => ['all', ...Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])], [catCounts]);
  const filtered = useMemo(() => sources.filter(s => {
    if (filter !== 'all' && s.category !== filter) return false;
    if (dSearch && !(s.name || '').toLowerCase().includes(dSearch.toLowerCase())) return false;
    return true;
  }), [sources, filter, dSearch]);

  const cTotal = useCountUp(sources.length);
  const cCats = useCountUp(Object.keys(catCounts).length);
  const cShown = useCountUp(filtered.length);

  const openSource = (source) => {
    if (source.url) {
      setPlayUrl(source.url);
      setPlayName(source.name);
    }
  };

  return (
    <PageWrapper testId="retrogaming-page" accents={['rgba(16,185,129,0.55)', 'rgba(132,204,22,0.5)', 'rgba(6,182,212,0.45)']}>
      <PageHero
        badge="Arcade • Console • Borne"
        badgeIcon={Joystick}
        title="Retrogaming"
        subtitle="néon &"
        highlight="Pixels"
        description="Replongez dans la nostalgie des bornes d'arcade et des consoles cultes. Bornes émulées, jeux flash, classiques old-school — tout en un clic."
        gradient="rgba(16,185,129,0.18), rgba(132,204,22,0.12) 35%, rgba(6,182,212,0.18) 65%, rgba(168,85,247,0.15)"
        titleGradient="linear-gradient(135deg, #fff 0%, #6ee7b7 40%, #bef264 70%, #67e8f9 100%)"
        highlightGradient="linear-gradient(135deg, #10b981, #84cc16, #06b6d4)"
        blobColor1="rgba(16,185,129,0.6)"
        blobColor2="rgba(132,204,22,0.55)"
        stats={[
          { icon: Gamepad2, label: 'Sources', value: cTotal, accent: 'rgba(16,185,129,0.7)' },
          { icon: Layers, label: 'Catégories', value: cCats, accent: 'rgba(132,204,22,0.7)' },
          { icon: Zap, label: 'Affichées', value: cShown, accent: 'rgba(6,182,212,0.7)' },
        ]}
      />

      <FilterBar>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" placeholder="Rechercher une borne..." value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-11 pr-10 h-11 rounded-xl border border-white/10 bg-white/5 outline-none text-sm text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:bg-white/10 transition-colors"
                   data-testid="retro-search-input" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {categories.map(c => (
                <Pill key={c} active={filter === c} onClick={() => setFilter(c)} icon={c === 'all' ? Sparkles : undefined}
                      color={c === 'all' ? '#10b981' : '#84cc16'}
                      count={c === 'all' ? sources.length : catCounts[c]} testId={`retro-pill-${c}`}>
                  {c === 'all' ? 'Toutes' : c}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </FilterBar>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-2.5 md:gap-3">
          {filtered.map((source, i) => {
            const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <button key={source._id || source.id} onClick={() => openSource(source)}
                      className="group relative wv-fade-in text-left"
                      style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
                      data-testid={`retro-source-${source._id || source.id}`}>
                <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none`} />
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 group-hover:border-emerald-400/40 bg-[#0b1220]/80 backdrop-blur-md transition-all duration-300">
                  <div className={`relative aspect-video bg-gradient-to-br ${grad} bg-opacity-10`}>
                    <div className="absolute inset-0 opacity-20"
                         style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                    <div className="absolute inset-0 bg-black/30" />
                    {source.logo_url || source.image_url ? (
                      <img src={source.logo_url || source.image_url} alt={source.name}
                           className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                           onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Gamepad2 className="w-14 h-14 text-white/40 group-hover:text-white/70 transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${grad} text-white font-bold text-xs shadow-2xl`}>
                          <Play className="w-3.5 h-3.5 fill-current" /> Lancer
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <QuickPlaylistAdd contentId={source._id || source.id || source.name} contentType="retrogaming" title={source.name} posterPath={source.logo_url || source.image_url} inline metadata={{ game_url: source.embed_url || source.url }} />
                    </div>
                    {source.is_active === false && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/80 text-white">Inactif</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{source.name}</h3>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {source.category && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">{source.category}</span>
                      )}
                    </div>
                    {source.description && <p className="text-[11px] text-white/55 mt-1 line-clamp-2">{source.description}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Gamepad2} text="Aucune source retrogaming"
                    sub="Les sources seront ajoutées par l'administrateur"
                    gradient="from-emerald-950/30 via-green-950/20 to-cyan-950/30" />
      )}

      {playUrl && (
        <IframeModal src={playUrl} title={playName} onClose={() => setPlayUrl(null)}
                     icon={<Gamepad2 className="w-5 h-5 text-emerald-400" />}
                     showOpenInNewTab borderColor="border-emerald-500/30" />
      )}
    </PageWrapper>
  );
}
