import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Film, Tv, Play, Bell, BellOff, Star, Sparkles, Filter } from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

const FILTER_META = {
  all:       { label: 'Tout',       icon: CalIcon,   hex: '#94a3b8', from: 'from-slate-500/90',  to: 'to-slate-600/90',   ring: 'shadow-slate-500/30' },
  movie:     { label: 'Films',      icon: Film,      hex: '#ef4444', from: 'from-red-500/90',    to: 'to-rose-500/90',    ring: 'shadow-red-500/30' },
  tv:        { label: 'Séries',     icon: Tv,        hex: '#3b82f6', from: 'from-blue-500/90',   to: 'to-indigo-500/90',  ring: 'shadow-blue-500/30' },
  anime:     { label: 'Anime',      icon: Sparkles,  hex: '#a855f7', from: 'from-purple-500/90', to: 'to-fuchsia-500/90', ring: 'shadow-purple-500/30' },
  favorites: { label: 'Mes favoris',icon: Star,      hex: '#f59e0b', from: 'from-amber-500/90',  to: 'to-orange-500/90',  ring: 'shadow-amber-500/30' },
};

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    fetchEvents();
    if (user) fetchFavorites();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const PAGES = 10;
      const promises = [];
      for (let p = 1; p <= PAGES; p++) {
        promises.push(
          API.get(`/api/tmdb/upcoming/movies?page=${p}`).catch(() => ({ data: { results: [] } })),
          API.get(`/api/tmdb/popular/movies?page=${p}`).catch(() => ({ data: { results: [] } })),
          API.get(`/api/tmdb/on-the-air?page=${p}`).catch(() => ({ data: { results: [] } })),
          API.get(`/api/tmdb/discover/tv?sort_by=first_air_date.desc&page=${p}`).catch(() => ({ data: { results: [] } })),
        );
      }
      promises.push(API.get('/api/tmdb/trending/anime').catch(() => ({ data: { results: [] } })));
      promises.push(API.get('/api/tmdb/popular/anime?page=1').catch(() => ({ data: { results: [] } })));
      promises.push(API.get('/api/tmdb/popular/anime?page=2').catch(() => ({ data: { results: [] } })));

      const all = await Promise.all(promises);
      const moviesUpcoming = [];
      const moviesPopular = [];
      const tvOnAir = [];
      const tvDiscover = [];
      for (let p = 0; p < PAGES; p++) {
        moviesUpcoming.push(...(all[p * 4]?.data?.results || []));
        moviesPopular.push(...(all[p * 4 + 1]?.data?.results || []));
        tvOnAir.push(...(all[p * 4 + 2]?.data?.results || []));
        tvDiscover.push(...(all[p * 4 + 3]?.data?.results || []));
      }
      const animePages = all.slice(PAGES * 4);
      const animeResults = animePages.flatMap(r => r?.data?.results || []);

      const dedup = (arr, key = 'id') => {
        const seen = new Set();
        return arr.filter(x => {
          const k = x?.[key];
          if (k == null || seen.has(k)) return false;
          seen.add(k); return true;
        });
      };

      const movieEvents = dedup([...moviesUpcoming, ...moviesPopular]).filter(m => m.release_date).map(m => ({
        id: m.id, title: m.title, date: m.release_date, type: 'movie',
        poster_path: m.poster_path, vote_average: m.vote_average, overview: m.overview,
      }));
      const tvEvents = dedup(tvDiscover).filter(s => s.first_air_date).map(s => ({
        id: s.id, title: s.name, date: s.first_air_date, type: 'tv',
        poster_path: s.poster_path, vote_average: s.vote_average, overview: s.overview,
      }));
      const animeEvents = dedup(animeResults).filter(a => a.first_air_date).map(a => ({
        id: a.id, title: a.name, date: a.first_air_date, type: 'anime',
        poster_path: a.poster_path, vote_average: a.vote_average, overview: a.overview,
      }));
      const onAirEvents = dedup(tvOnAir).filter(s => s.first_air_date).map(s => ({
        id: s.id, title: s.name, date: s.first_air_date, type: 'episode',
        poster_path: s.poster_path, vote_average: s.vote_average, overview: s.overview,
      }));

      const allEvents = [...movieEvents, ...tvEvents, ...animeEvents, ...onAirEvents]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setEvents(allEvents);
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await API.get('/api/user/favorites');
      setFavorites(data.favorites || []);
      const notifRes = await API.get('/api/user/release-notifications').catch(() => ({ data: { notifications: {} } }));
      setNotifications(notifRes.data.notifications || {});
    } catch {}
  };

  const toggleNotification = async (item) => {
    if (!user) {
      toast({ title: 'Connexion requise', variant: 'destructive' });
      return;
    }
    const key = `${item.type}-${item.id}`;
    const isEnabled = notifications[key];
    try {
      await API.post('/api/user/release-notifications', {
        content_id: item.id,
        content_type: item.type,
        title: item.title,
        enabled: !isEnabled,
      });
      setNotifications(prev => ({ ...prev, [key]: !isEnabled }));
      toast({ title: isEnabled ? 'Notification désactivée' : 'Notification activée', description: `Vous serez notifié à la sortie de "${item.title}"` });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return favorites.some(f => f.content_id === e.id && (f.content_type === e.type || (e.type === 'anime' && f.content_type === 'tv')));
    return e.type === filter || (filter === 'tv' && e.type === 'episode');
  });

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const navigateMonth = (dir) => {
    setCurrentDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1)); return d; });
  };

  const getTypeMeta = (type) => {
    switch(type) {
      case 'movie':   return { dot: 'bg-red-500',    text: 'text-red-200',    bg: 'bg-red-500/20',    icon: Film };
      case 'tv':      return { dot: 'bg-blue-500',   text: 'text-blue-200',   bg: 'bg-blue-500/20',   icon: Tv };
      case 'anime':   return { dot: 'bg-purple-500', text: 'text-purple-200', bg: 'bg-purple-500/20', icon: Sparkles };
      case 'episode': return { dot: 'bg-emerald-500',text: 'text-emerald-200',bg: 'bg-emerald-500/20',icon: Play };
      default:        return { dot: 'bg-slate-500',  text: 'text-slate-200',  bg: 'bg-slate-500/20',  icon: Film };
    }
  };

  const isFavorite = (item) => favorites.some(f => f.content_id === item.id);

  const upcoming = filteredEvents.filter(e => new Date(e.date) >= today);

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="calendar-page">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.55), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(168,85,247,0.15) 35%, rgba(236,72,153,0.18) 65%, rgba(245,158,11,0.12))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <CalIcon className="w-3 h-3" />Sorties à venir
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
                  <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #93c5fd 40%, #c4b5fd 70%, #f9a8d4 100%)' }}>
                    Calendrier
                  </span>
                  <span className="block text-white">des <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)' }}>Sorties</span></span>
                </h1>
                <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
                  Reste à jour avec les <span className="text-white font-semibold">films, séries, animes et épisodes</span> à venir. Active des notifications pour ne rien manquer.
                </p>
              </div>

              {/* Legend stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto lg:flex-shrink-0">
                {[
                  { label: 'Films',    hex: '#ef4444', icon: Film,     count: events.filter(e => e.type === 'movie' && new Date(e.date) >= today).length },
                  { label: 'Séries',   hex: '#3b82f6', icon: Tv,       count: events.filter(e => (e.type === 'tv' || e.type === 'episode') && new Date(e.date) >= today).length },
                  { label: 'Anime',    hex: '#a855f7', icon: Sparkles, count: events.filter(e => e.type === 'anime' && new Date(e.date) >= today).length },
                  { label: 'À venir',  hex: '#10b981', icon: CalIcon,  count: events.filter(e => new Date(e.date) >= today).length },
                ].map(s => {
                  const I = s.icon;
                  return (
                    <div key={s.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-3 py-3 group hover:border-white/25 transition-colors">
                      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: s.hex }} />
                      <I className="w-4 h-4 mb-1.5" style={{ color: s.hex }} />
                      <p className="text-xl md:text-2xl font-black tabular-nums" style={{ color: s.hex }}>{s.count}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR FILTRES */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl p-3 md:p-4 mb-5 sticky top-16 z-40 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center gap-2" data-testid="calendar-filters">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />Filtres
            </span>
            {Object.entries(FILTER_META).map(([key, meta]) => {
              const I = meta.icon;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? `bg-gradient-to-br ${meta.from} ${meta.to} text-white shadow-lg ${meta.ring} scale-105` : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300'}`}
                  data-testid={`filter-${key}`}
                >
                  <I className="w-3.5 h-3.5" />{meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CALENDRIER */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/30">
              <div className="relative overflow-hidden p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.3) 50%, rgba(236,72,153,0.3))' }}>
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <h2 className="relative text-white font-black text-lg md:text-xl tracking-tight">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <div className="relative flex gap-2">
                  <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-colors border border-white/20" data-testid="today-btn">Aujourd'hui</button>
                  <button onClick={() => navigateMonth('prev')} className="p-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-colors border border-white/20" data-testid="prev-month-btn"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => navigateMonth('next')} className="p-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-colors border border-white/20" data-testid="next-month-btn"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(d => <div key={d} className="p-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} className="p-1 h-24" />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = getEventsForDate(day);
                    const isToday = date.toDateString() === today.toDateString();
                    const isPast = date < today && !isToday;

                    return (
                      <div key={day} className={`p-1.5 h-24 border rounded-xl transition-all ${
                        isToday ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/15 border-blue-400/60 shadow-lg shadow-blue-500/20' :
                        isPast ? 'bg-white/[0.02] border-white/5 opacity-60' :
                        'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20'
                      }`}>
                        <div className={`text-xs font-bold mb-1 ${isToday ? 'text-blue-300' : 'text-slate-400'}`}>{day}</div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(e => {
                            const m = getTypeMeta(e.type);
                            return (
                              <Link key={`${e.type}-${e.id}`} to={`/${e.type === 'movie' ? 'movies' : e.type === 'anime' ? 'anime' : 'tv-shows'}/${e.id}`}
                                className={`flex items-center gap-1 w-full text-[9px] px-1 py-0.5 rounded ${m.bg} ${m.text} hover:brightness-125 transition-all`}>
                                <span className={`w-1 h-1 rounded-full ${m.dot} flex-shrink-0`} />
                                <span className="truncate">{e.title}</span>
                              </Link>
                            );
                          })}
                          {dayEvents.length > 3 && <div className="text-[9px] text-cyan-400 text-center font-bold">+{dayEvents.length - 3}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LISTE PROCHAINES SORTIES */}
            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/30">
              <div className="relative overflow-hidden p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))' }}>
                <h2 className="relative text-white font-black text-lg flex items-center gap-2"><Sparkles className="w-5 h-5" />Prochaines sorties</h2>
                <span className="relative px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">{upcoming.length}</span>
              </div>
              <div className="p-3 space-y-2 max-h-[700px] overflow-y-auto">
                {upcoming.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <CalIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucun événement à venir</p>
                  </div>
                )}
                {upcoming.map(e => {
                  const m = getTypeMeta(e.type);
                  const I = m.icon;
                  const isFav = isFavorite(e);
                  const hasNotif = notifications[`${e.type}-${e.id}`];

                  return (
                    <div key={`${e.type}-${e.id}`} className="flex items-center gap-3 p-2 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group relative" data-testid={`upcoming-${e.type}-${e.id}`}>
                      <Link to={`/${e.type === 'movie' ? 'movies' : e.type === 'anime' ? 'anime' : 'tv-shows'}/${e.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 ${isFav ? 'ring-2 ring-amber-400/70' : ''}`}>
                          {e.poster_path ? (
                            <img src={`${TMDB_IMG}/w200${e.poster_path}`} alt={e.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                              <I className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${m.bg} ${m.text} border border-white/10`}>
                              <I className="w-2.5 h-2.5" />{e.type === 'movie' ? 'Film' : e.type === 'anime' ? 'Anime' : e.type === 'episode' ? 'Épisode' : 'Série'}
                            </span>
                            {e.vote_average > 0 && (
                              <span className="text-[10px] text-amber-300 flex items-center gap-0.5 font-semibold">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />{e.vote_average.toFixed(1)}
                              </span>
                            )}
                            {isFav && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{e.title}</p>
                          <p className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </Link>

                      {user && (
                        <button
                          onClick={() => toggleNotification(e)}
                          className={`p-2 rounded-full transition-all ${hasNotif ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                          title={hasNotif ? 'Désactiver la notification' : 'M\'alerter à la sortie'}
                          data-testid={`notif-${e.type}-${e.id}`}
                        >
                          {hasNotif ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
