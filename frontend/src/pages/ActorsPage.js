import React, { useState, useEffect } from 'react';
import API, { TMDB_IMG } from '../lib/api';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/Loading';
import { Users, Search, X, Sparkles, Film, Tv, ChevronLeft, ChevronRight } from 'lucide-react';

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

const FALLBACK_GRADIENTS = [
  'from-violet-600 via-fuchsia-600 to-pink-600',
  'from-emerald-500 via-cyan-500 to-blue-600',
  'from-amber-500 via-orange-500 to-red-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-cyan-500 via-blue-500 to-indigo-600',
];

function ActorCard({ a, idx }) {
  const dept = a.known_for_department === 'Acting' ? 'Acteur' : (a.known_for_department || '');
  const known = (a.known_for || []).slice(0, 2).map(k => k.title || k.name).filter(Boolean).join(' · ');
  return (
    <Link to={`/actors/${a.id}`} className="group block relative" data-testid={`actor-card-${a.id}`}>
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 pointer-events-none`} />
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0b1220]/95 group-hover:border-white/30 transition-all duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-[2/3] overflow-hidden">
          {a.profile_path ? (
            <img
              src={`${TMDB_IMG}/w500${a.profile_path}`}
              alt={a.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]} flex items-center justify-center`}>
              <Users className="w-12 h-12 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          {a.popularity > 30 && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-extrabold flex items-center gap-1 shadow-lg shadow-amber-500/40">
              <Sparkles className="w-3 h-3" />HOT
            </span>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-black text-white text-base md:text-lg leading-tight line-clamp-2 drop-shadow-2xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
              {a.name}
            </h3>
          </div>
        </div>
        <div className="p-3 space-y-1">
          {dept && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-semibold">
              <Film className="w-3 h-3" />{dept}
            </span>
          )}
          {known && <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">{known}</p>}
        </div>
      </div>
    </Link>
  );
}

export default function ActorsPage() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    const url = debouncedSearch
      ? `/api/tmdb/search/persons?q=${encodeURIComponent(debouncedSearch)}&page=${page}`
      : `/api/tmdb/popular/persons?page=${page}`;
    API.get(url)
      .then(({ data }) => setActors(data.results || []))
      .catch(() => {
        // Fallback à popular si search endpoint indisponible
        if (debouncedSearch) {
          API.get(`/api/tmdb/popular/persons?page=${page}`)
            .then(({ data }) => {
              const filtered = (data.results || []).filter(a =>
                a.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
              );
              setActors(filtered);
            }).catch(() => setActors([]));
        } else setActors([]);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="actors-page">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.5), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.15) 35%, rgba(59,130,246,0.18) 65%, rgba(6,182,212,0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Users className="w-3 h-3" />Casting
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #f9a8d4 40%, #c4b5fd 70%, #67e8f9 100%)' }}>
                Acteurs
              </span>
              <span className="block text-white">& <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #ec4899, #a855f7, #06b6d4)' }}>Stars</span></span>
            </h1>
            <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
              Explore les acteurs du moment. <span className="text-white font-semibold">Filmographie, séries, animés</span> — clique pour découvrir leur univers.
            </p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl p-3 md:p-4 mb-5 sticky top-16 z-40 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un acteur..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 transition-all"
                data-testid="actors-search-input"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10"><X className="w-3.5 h-3.5 text-slate-400" /></button>
              )}
            </div>
            <span className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-400 font-medium">
              Page <span className="text-white font-bold">{page}</span>
            </span>
          </div>
        </div>

        {/* RESULTS */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0b1220]/80 overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : actors.length === 0 ? (
          <div className="relative overflow-hidden text-center py-16 md:py-20 rounded-3xl border border-white/10 bg-gradient-to-br from-pink-950/30 via-purple-950/20 to-blue-950/30">
            <div className="absolute -top-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.5), transparent 70%)' }} />
            <div className="relative max-w-md mx-auto px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-500 mb-5 shadow-2xl shadow-pink-500/40">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff, #f9a8d4)' }}>
                Aucun acteur trouvé
              </h3>
              <p className="text-slate-400">Affine ta recherche ou explore les acteurs populaires.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {actors.map((a, i) => <ActorCard key={a.id} a={a} idx={i} />)}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && actors.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-10" data-testid="actors-pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" />Précédent
            </button>
            <span className="px-4 py-2 text-sm text-slate-400">Page <span className="text-white font-bold">{page}</span></span>
            <button onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-1.5">
              Suivant<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
