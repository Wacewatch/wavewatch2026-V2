import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import LikeDislike from '../components/LikeDislike';
import { ListMusic, Globe, Lock, Trash2, Film, Tv, ArrowLeft, Play, Music, Gamepad2, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';

const typeConfig = {
  movie: { icon: Film, label: 'Film', color: 'text-red-400', path: 'movies' },
  tv: { icon: Tv, label: 'Serie', color: 'text-blue-400', path: 'tv-shows' },
  anime: { icon: Tv, label: 'Anime', color: 'text-purple-400', path: 'anime' },
  music: { icon: Music, label: 'Musique', color: 'text-pink-400', path: null },
  game: { icon: Gamepad2, label: 'Jeu', color: 'text-green-400', path: null },
  ebook: { icon: BookOpen, label: 'Ebook', color: 'text-orange-400', path: null },
};

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const PLAYLIST_COLORS = [
    { id: 'default', label: 'Defaut', gradient: '' },
    { id: 'blue', label: 'Bleu', gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)' },
    { id: 'red', label: 'Rouge', gradient: 'linear-gradient(135deg, #5f1e1e, #dc2626)' },
    { id: 'green', label: 'Vert', gradient: 'linear-gradient(135deg, #1e5f3a, #16a34a)' },
    { id: 'purple', label: 'Violet', gradient: 'linear-gradient(135deg, #3a1e5f, #9333ea)' },
    { id: 'orange', label: 'Orange', gradient: 'linear-gradient(135deg, #5f3a1e, #ea580c)' },
    { id: 'pink', label: 'Rose', gradient: 'linear-gradient(135deg, #5f1e4a, #ec4899)' },
    { id: 'gold', label: 'Or (VIP)', gradient: 'linear-gradient(135deg, #5f4e1e, #eab308)', vip: true },
    { id: 'diamond', label: 'Diamant (VIP)', gradient: 'linear-gradient(135deg, #1e4a5f, #06b6d4)', vip: true },
    { id: 'neon', label: 'Neon (VIP)', gradient: 'linear-gradient(135deg, #1e5f1e, #22d3ee)', vip: true },
    { id: 'sunset', label: 'Sunset (VIP+)', gradient: 'linear-gradient(135deg, #ff6b35, #f7931e, #c62828)', vipplus: true },
    { id: 'galaxy', label: 'Galaxy (VIP+)', gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', vipplus: true },
  ];

  useEffect(() => {
    API.get(`/api/playlists/${id}`).then(({ data }) => setPlaylist(data.playlist)).catch(() => navigate('/playlists')).finally(() => setLoading(false));
  }, [id, navigate]);

  const removeItem = async (contentId) => {
    try {
      await API.delete(`/api/playlists/${id}/items/${contentId}`);
      setPlaylist(prev => ({ ...prev, items: prev.items.filter(i => i.content_id !== contentId) }));
      toast({ title: 'Element retire de la playlist' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const changeColor = async (color) => {
    const c = PLAYLIST_COLORS.find(x => x.id === color);
    if (!c) return;
    if (c.vip && !user?.is_vip && !user?.is_admin) { toast({ title: 'Couleur VIP requise', variant: 'destructive' }); return; }
    if (c.vipplus && !user?.is_vip_plus && !user?.is_admin) { toast({ title: 'Couleur VIP+ requise', variant: 'destructive' }); return; }
    try {
      await API.put(`/api/playlists/${id}/colors`, { color, gradient: c.gradient });
      setPlaylist(prev => ({ ...prev, color, gradient: c.gradient }));
      toast({ title: 'Couleur appliquee' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const isOwner = user && playlist && playlist.user_id === user._id;

  if (loading) return <LoadingSpinner />;
  if (!playlist) return <div className="container mx-auto px-4 py-12 text-center">Playlist non trouvee</div>;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="playlist-detail-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="back-btn">
        <ArrowLeft className="w-4 h-4" />Retour
      </button>

      <div className="bg-card border border-border rounded-xl p-6 mb-8" style={playlist.gradient ? { background: playlist.gradient } : {}}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="playlist-title">
              <ListMusic className="w-8 h-8" />{playlist.name}
            </h1>
            {playlist.description && <p className="text-muted-foreground mt-2">{playlist.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {playlist.is_public ? <span className="flex items-center gap-1"><Globe className="w-4 h-4 text-green-400" />Public</span> : <span className="flex items-center gap-1"><Lock className="w-4 h-4" />Prive</span>}
              <span>{playlist.items?.length || 0} element{(playlist.items?.length || 0) !== 1 ? 's' : ''}</span>
              {playlist.username && <span>par {playlist.username}</span>}
            </div>
          </div>
          {isOwner && (
            <button onClick={() => setShowColorPicker(!showColorPicker)} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary" data-testid="color-picker-btn">
              Couleur
            </button>
          )}
        </div>
        {showColorPicker && isOwner && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm font-medium mb-2">Personnaliser la couleur</p>
            <div className="flex flex-wrap gap-2">
              {PLAYLIST_COLORS.map(c => (
                <button key={c.id} onClick={() => changeColor(c.id)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${playlist.color === c.id ? 'border-white ring-2 ring-primary' : 'border-transparent'} ${c.vip || c.vipplus ? 'ring-1 ring-yellow-500/30' : ''}`}
                  style={c.gradient ? { background: c.gradient } : { background: '#333' }}
                  title={c.label} data-testid={`color-${c.id}`} />
              ))}
            </div>
          </div>
        )}
        <div className="mt-3">
          <LikeDislike contentId={parseInt(id) || id.hashCode?.()} contentType="playlist" />
        </div>
      </div>

      {(!playlist.items || playlist.items.length === 0) ? (
        <div className="text-center py-20">
          <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Cette playlist est vide</p>
          <p className="text-sm text-muted-foreground">Ajoutez du contenu depuis les pages de films, series ou anime</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlist.items.map((item, idx) => {
            const cfg = typeConfig[item.content_type] || typeConfig.movie;
            const Icon = cfg.icon;
            const linkTo = cfg.path ? `/${cfg.path}/${item.content_id}` : null;

            const card = (
              <div className="group relative" data-testid={`playlist-item-${item.content_id}`}>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted relative">
                  {item.poster_path ? (
                    <img src={`${TMDB_IMG}/w300${item.poster_path}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Icon className={`w-12 h-12 ${cfg.color} opacity-30`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {linkTo && <Play className="w-10 h-10 text-white" />}
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full bg-black/60 ${cfg.color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  {isOwner && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.content_id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      data-testid={`remove-item-${item.content_id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium mt-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{item.title}</p>
              </div>
            );

            return linkTo ? <Link key={`${item.content_type}-${item.content_id}-${idx}`} to={linkTo}>{card}</Link> : <div key={`${item.content_type}-${item.content_id}-${idx}`}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
