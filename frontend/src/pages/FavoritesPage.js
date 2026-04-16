import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Heart, Film, Tv, Play, Music, Gamepad2, BookOpen, Monitor, Radio, Star, User, Trash2, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const TYPE_CONFIG = {
  movie: { icon: Film, label: 'Film', color: 'text-red-400', bg: 'bg-red-500/20', path: 'movies' },
  tv: { icon: Tv, label: 'Serie', color: 'text-blue-400', bg: 'bg-blue-500/20', path: 'tv-shows' },
  episode: { icon: Play, label: 'Episode', color: 'text-cyan-400', bg: 'bg-cyan-500/20', path: null },
  actor: { icon: User, label: 'Acteur', color: 'text-yellow-400', bg: 'bg-yellow-500/20', path: 'actors' },
  music: { icon: Music, label: 'Musique', color: 'text-pink-400', bg: 'bg-pink-500/20', path: 'music' },
  game: { icon: Gamepad2, label: 'Jeu', color: 'text-green-400', bg: 'bg-green-500/20', path: 'games' },
  ebook: { icon: BookOpen, label: 'Ebook', color: 'text-orange-400', bg: 'bg-orange-500/20', path: 'ebooks' },
  software: { icon: Monitor, label: 'Logiciel', color: 'text-teal-400', bg: 'bg-teal-500/20', path: 'software' },
  tv_channel: { icon: Tv, label: 'Chaine TV', color: 'text-indigo-400', bg: 'bg-indigo-500/20', path: 'tv-channels' },
  radio: { icon: Radio, label: 'Radio', color: 'text-amber-400', bg: 'bg-amber-500/20', path: 'radio' },
  playlist: { icon: Heart, label: 'Playlist', color: 'text-purple-400', bg: 'bg-purple-500/20', path: 'playlists' },
};

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      API.get('/api/user/favorites').then(({ data }) => setFavorites(data.favorites || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  const removeFav = async (fav) => {
    try {
      await API.post('/api/user/favorites', { content_id: fav.content_id, content_type: fav.content_type, title: fav.title, poster_path: fav.poster_path });
      setFavorites(prev => prev.filter(f => !(f.content_id === fav.content_id && f.content_type === fav.content_type)));
      toast({ title: 'Retire des favoris' });
    } catch {}
  };

  if (authLoading || !user) return null;

  // Count by type
  const typeCounts = {};
  favorites.forEach(f => { typeCounts[f.content_type] = (typeCounts[f.content_type] || 0) + 1; });
  const types = Object.keys(typeCounts).sort();

  const filtered = typeFilter === 'all' ? favorites : favorites.filter(f => f.content_type === typeFilter);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="favorites-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Heart className="w-8 h-8 text-red-400 fill-red-400" />Mes Favoris</h1>
      <p className="text-muted-foreground mb-6">{favorites.length} elements</p>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${typeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`} data-testid="filter-all">
          Tous ({favorites.length})
        </button>
        {types.map(t => {
          const cfg = TYPE_CONFIG[t] || TYPE_CONFIG.movie;
          const Icon = cfg.icon;
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`} data-testid={`filter-${t}`}>
              <Icon className="w-3.5 h-3.5" />{cfg.label} ({typeCounts[t]})
            </button>
          );
        })}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="text-center py-20"><Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Aucun favori</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(f => {
            const cfg = TYPE_CONFIG[f.content_type] || TYPE_CONFIG.movie;
            const Icon = cfg.icon;
            const posterSrc = f.poster_path ? (f.poster_path.startsWith('http') ? f.poster_path : `${TMDB_IMG}/w300${f.poster_path}`) : null;
            const date = f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : '';

            let linkTo = null;
            if (f.content_type === 'episode' && f.metadata) {
              const m = f.metadata;
              linkTo = `/${m.is_anime ? 'anime' : 'tv-shows'}/${m.series_id}/season/${m.season_number}/episode/${m.episode_number}`;
            } else if (cfg.path) {
              linkTo = `/${cfg.path}/${f.content_id}`;
            }

            const card = (
              <div className="group relative" data-testid={`fav-item-${f.content_id}`}>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted relative">
                  {posterSrc ? (
                    <img src={posterSrc} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Icon className={`w-12 h-12 ${cfg.color} opacity-30`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  {/* Badge type */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full bg-black/60 ${cfg.color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  {/* Remove button */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFav(f); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium mt-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{f.title}</p>
                <p className="text-xs text-muted-foreground">Ajoute le {date}</p>
              </div>
            );

            return linkTo ? <Link key={`${f.content_type}-${f.content_id}`} to={linkTo}>{card}</Link> : <div key={`${f.content_type}-${f.content_id}`}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
