import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Film, Tv, Play, Filter, Bell, BellOff, Star, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, movie, tv, anime
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState({});

  useEffect(() => { 
    fetchEvents(); 
    if (user) fetchFavorites();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const [moviesRes, tvRes, animeRes, upcomingTvRes] = await Promise.all([
        API.get('/api/tmdb/upcoming/movies'),
        API.get('/api/tmdb/discover/tv?sort_by=first_air_date.desc'),
        API.get('/api/tmdb/trending/anime'),
        API.get('/api/tmdb/on-the-air')
      ]);
      
      const movieEvents = (moviesRes.data.results || []).filter(m => m.release_date).map(m => ({ 
        id: m.id, 
        title: m.title, 
        date: m.release_date, 
        type: 'movie', 
        poster_path: m.poster_path, 
        vote_average: m.vote_average,
        overview: m.overview
      }));
      
      const tvEvents = (tvRes.data.results || []).filter(s => s.first_air_date).map(s => ({ 
        id: s.id, 
        title: s.name, 
        date: s.first_air_date, 
        type: 'tv', 
        poster_path: s.poster_path, 
        vote_average: s.vote_average,
        overview: s.overview
      }));
      
      const animeEvents = (animeRes.data.results || []).filter(a => a.first_air_date).map(a => ({ 
        id: a.id, 
        title: a.name, 
        date: a.first_air_date, 
        type: 'anime', 
        poster_path: a.poster_path, 
        vote_average: a.vote_average,
        overview: a.overview
      }));

      // Episodes à venir des séries en cours
      const onAirEvents = (upcomingTvRes.data.results || []).filter(s => s.first_air_date).map(s => ({ 
        id: s.id, 
        title: s.name, 
        date: s.first_air_date, 
        type: 'episode', 
        poster_path: s.poster_path, 
        vote_average: s.vote_average,
        overview: s.overview
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
      // Charger les paramètres de notification
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
        enabled: !isEnabled
      });
      setNotifications(prev => ({ ...prev, [key]: !isEnabled }));
      toast({ title: isEnabled ? 'Notification desactivee' : 'Notification activee', description: `Vous serez notifie a la sortie de "${item.title}"` });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const monthNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  // Filtrage des événements
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

  const getTypeColor = (type) => {
    switch(type) {
      case 'movie': return { bg: 'bg-red-900/50', text: 'text-red-200', border: 'border-red-500' };
      case 'tv': return { bg: 'bg-blue-900/50', text: 'text-blue-200', border: 'border-blue-500' };
      case 'anime': return { bg: 'bg-purple-900/50', text: 'text-purple-200', border: 'border-purple-500' };
      case 'episode': return { bg: 'bg-green-900/50', text: 'text-green-200', border: 'border-green-500' };
      default: return { bg: 'bg-gray-900/50', text: 'text-gray-200', border: 'border-gray-500' };
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'movie': return <Film className="w-3 h-3 text-red-400" />;
      case 'tv': return <Tv className="w-3 h-3 text-blue-400" />;
      case 'anime': return <Sparkles className="w-3 h-3 text-purple-400" />;
      case 'episode': return <Play className="w-3 h-3 text-green-400" />;
      default: return <Film className="w-3 h-3" />;
    }
  };

  const isFavorite = (item) => favorites.some(f => f.content_id === item.id);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="calendar-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CalIcon className="w-8 h-8 text-blue-400" />Calendrier des sorties
        </h1>
        
        {/* Filtres */}
        <div className="flex flex-wrap gap-2" data-testid="calendar-filters">
          {[
            { id: 'all', label: 'Tout', icon: null },
            { id: 'movie', label: 'Films', icon: <Film className="w-3.5 h-3.5" />, color: 'text-red-400' },
            { id: 'tv', label: 'Series', icon: <Tv className="w-3.5 h-3.5" />, color: 'text-blue-400' },
            { id: 'anime', label: 'Anime', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-purple-400' },
            { id: 'favorites', label: 'Mes favoris', icon: <Star className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
              data-testid={`filter-${f.id}`}
            >
              {f.icon && <span className={f.color}>{f.icon}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs rounded bg-white/20 text-white hover:bg-white/30">Aujourd'hui</button>
              <button onClick={() => navigateMonth('prev')} className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => navigateMonth('next')} className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">{d}</div>)}
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
                  <div key={day} className={`p-1 h-24 border rounded-lg transition-colors ${
                    isToday ? 'bg-blue-900/30 border-blue-500' : 
                    isPast ? 'bg-card/30 border-border/50 opacity-60' : 
                    'border-border bg-card/50 hover:border-primary/30'
                  }`}>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}>{day}</div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map(e => {
                        const colors = getTypeColor(e.type);
                        return (
                          <Link key={`${e.type}-${e.id}`} to={`/${e.type === 'movie' ? 'movies' : e.type === 'anime' ? 'anime' : 'tv-shows'}/${e.id}`}
                            className={`block w-full text-[9px] p-0.5 rounded truncate ${colors.bg} ${colors.text} hover:opacity-80`}>
                            {e.title.length > 10 ? `${e.title.substring(0, 10)}...` : e.title}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des prochaines sorties */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
            <h2 className="text-white font-bold">Prochaines sorties</h2>
            <span className="text-white/70 text-sm">{filteredEvents.filter(e => new Date(e.date) >= today).length} evenements</span>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredEvents.filter(e => new Date(e.date) >= today).slice(0, 50).map(e => {
              const colors = getTypeColor(e.type);
              const isFav = isFavorite(e);
              const hasNotif = notifications[`${e.type}-${e.id}`];
              
              return (
                <div key={`${e.type}-${e.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 group relative">
                  <Link to={`/${e.type === 'movie' ? 'movies' : e.type === 'anime' ? 'anime' : 'tv-shows'}/${e.id}`} className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted border-2 ${isFav ? 'border-yellow-500' : 'border-transparent'}`}>
                      {e.poster_path && <img src={`${TMDB_IMG}/w200${e.poster_path}`} alt={e.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {getTypeIcon(e.type)}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {e.type === 'movie' ? 'Film' : e.type === 'anime' ? 'Anime' : e.type === 'episode' ? 'Episode' : 'Serie'}
                        </span>
                        {e.vote_average > 0 && (
                          <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-yellow-400" />{e.vote_average.toFixed(1)}
                          </span>
                        )}
                        {isFav && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-blue-400">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </Link>
                  
                  {/* Bouton notification */}
                  {user && (
                    <button
                      onClick={() => toggleNotification(e)}
                      className={`p-1.5 rounded-full transition-colors ${hasNotif ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                      title={hasNotif ? 'Desactiver la notification' : 'M\'alerter a la sortie'}
                    >
                      {hasNotif ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
            })}
            
            {filteredEvents.filter(e => new Date(e.date) >= today).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun evenement a venir</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Filter className="w-4 h-4" />Legende</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded" /><span className="text-red-400">Films</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded" /><span className="text-blue-400">Series TV</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-600 rounded" /><span className="text-purple-400">Anime</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-600 rounded" /><span className="text-green-400">Episodes</span></div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="text-yellow-400">Favoris</span></div>
          <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-blue-400" /><span className="text-blue-400">Notification activee</span></div>
        </div>
      </div>
    </div>
  );
}
