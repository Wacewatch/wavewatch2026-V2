import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Film, Tv, Play } from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const [moviesRes, tvRes] = await Promise.all([
        API.get('/api/tmdb/upcoming/movies'),
        API.get('/api/tmdb/discover/tv?sort_by=first_air_date.desc')
      ]);
      const movieEvents = (moviesRes.data.results || []).filter(m => m.release_date).map(m => ({ id: m.id, title: m.title, date: m.release_date, type: 'movie', poster_path: m.poster_path, vote_average: m.vote_average }));
      const tvEvents = (tvRes.data.results || []).filter(s => s.first_air_date).map(s => ({ id: s.id, title: s.name, date: s.first_air_date, type: 'tv', poster_path: s.poster_path, vote_average: s.vote_average }));
      setEvents([...movieEvents, ...tvEvents].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch {} finally { setLoading(false); }
  };

  const monthNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const navigateMonth = (dir) => {
    setCurrentDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1)); return d; });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="calendar-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><CalIcon className="w-8 h-8 text-blue-400" />Calendrier des sorties</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="flex gap-2">
              <button onClick={() => navigateMonth('prev')} className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => navigateMonth('next')} className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} className="p-1 h-20" />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayEvents = getEventsForDate(day);
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div key={day} className={`p-1 h-20 border rounded-lg ${isToday ? 'bg-blue-900/30 border-blue-500' : 'border-border bg-card/50'}`}>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <Link key={`${e.type}-${e.id}`} to={`/${e.type === 'movie' ? 'movies' : 'tv-shows'}/${e.id}`}
                          className={`block w-full text-[10px] p-0.5 rounded truncate ${e.type === 'movie' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}>
                          {e.type === 'movie' ? <Film className="w-2.5 h-2.5 inline mr-0.5" /> : <Tv className="w-2.5 h-2.5 inline mr-0.5" />}
                          {e.title.length > 8 ? `${e.title.substring(0, 8)}...` : e.title}
                        </Link>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4"><h2 className="text-white font-bold">Prochaines sorties</h2></div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {events.filter(e => new Date(e.date) >= today).slice(0, 30).map(e => (
              <Link key={`${e.type}-${e.id}`} to={`/${e.type === 'movie' ? 'movies' : 'tv-shows'}/${e.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 group">
                <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {e.poster_path && <img src={`${TMDB_IMG}/w200${e.poster_path}`} alt={e.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    {e.type === 'movie' ? <Film className="w-3 h-3 text-red-400" /> : <Tv className="w-3 h-3 text-blue-400" />}
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-blue-400">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded" /><span className="text-red-400">Films</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded" /><span className="text-blue-400">Series TV</span></div>
        </div>
      </div>
    </div>
  );
}
