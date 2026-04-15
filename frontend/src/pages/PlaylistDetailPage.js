import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import LikeDislike from '../components/LikeDislike';
import { ListMusic, Globe, Lock, Trash2, Film, Tv, ArrowLeft, Play, Music, Gamepad2, BookOpen, Crown, Upload, Sparkles, Image, Settings, Edit3, Check, Share2, Copy } from 'lucide-react';

const typeConfig = {
  movie: { icon: Film, label: 'Film', color: 'text-red-400', path: 'movies' },
  tv: { icon: Tv, label: 'Serie', color: 'text-blue-400', path: 'tv-shows' },
  anime: { icon: Tv, label: 'Anime', color: 'text-purple-400', path: 'anime' },
  music: { icon: Music, label: 'Musique', color: 'text-pink-400', path: null },
  game: { icon: Gamepad2, label: 'Jeu', color: 'text-green-400', path: null },
  ebook: { icon: BookOpen, label: 'Ebook', color: 'text-orange-400', path: null },
};

// Badge de type de playlist
function PlaylistBadge({ userInfo }) {
  if (!userInfo) return null;
  
  if (userInfo.is_admin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        <Crown className="w-3 h-3" />Admin
      </span>
    );
  }
  if (userInfo.is_vip_plus) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
        <Sparkles className="w-3 h-3" />VIP+
      </span>
    );
  }
  if (userInfo.is_vip) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <Crown className="w-3 h-3" />VIP
      </span>
    );
  }
  if (userInfo.is_uploader) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
        <Upload className="w-3 h-3" />Uploader
      </span>
    );
  }
  return null;
}

// Couleurs de playlist avec animations VIP
const PLAYLIST_COLORS = [
  // Standard (tous)
  { id: 'default', label: 'Defaut', gradient: '', category: 'standard' },
  { id: 'blue', label: 'Bleu', gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)', category: 'standard' },
  { id: 'red', label: 'Rouge', gradient: 'linear-gradient(135deg, #5f1e1e, #dc2626)', category: 'standard' },
  { id: 'green', label: 'Vert', gradient: 'linear-gradient(135deg, #1e5f3a, #16a34a)', category: 'standard' },
  { id: 'purple', label: 'Violet', gradient: 'linear-gradient(135deg, #3a1e5f, #9333ea)', category: 'standard' },
  { id: 'orange', label: 'Orange', gradient: 'linear-gradient(135deg, #5f3a1e, #ea580c)', category: 'standard' },
  { id: 'pink', label: 'Rose', gradient: 'linear-gradient(135deg, #5f1e4a, #ec4899)', category: 'standard' },
  
  // VIP exclusif
  { id: 'gold', label: 'Or', gradient: 'linear-gradient(135deg, #92400e, #fbbf24, #92400e)', vip: true, category: 'vip', animation: 'shimmer' },
  { id: 'diamond', label: 'Diamant', gradient: 'linear-gradient(135deg, #0e7490, #22d3ee, #0e7490)', vip: true, category: 'vip', animation: 'shimmer' },
  { id: 'emerald', label: 'Emeraude', gradient: 'linear-gradient(135deg, #065f46, #10b981, #065f46)', vip: true, category: 'vip', animation: 'pulse' },
  { id: 'ruby', label: 'Rubis', gradient: 'linear-gradient(135deg, #9f1239, #fb7185, #9f1239)', vip: true, category: 'vip', animation: 'glow' },
  { id: 'sapphire', label: 'Saphir', gradient: 'linear-gradient(135deg, #1e3a8a, #60a5fa, #1e3a8a)', vip: true, category: 'vip', animation: 'glow' },
  
  // VIP+ exclusif
  { id: 'sunset', label: 'Sunset', gradient: 'linear-gradient(135deg, #ff6b35, #f7931e, #c62828)', vipplus: true, category: 'vip+', animation: 'rainbow' },
  { id: 'galaxy', label: 'Galaxy', gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', vipplus: true, category: 'vip+', animation: 'stars' },
  { id: 'aurora', label: 'Aurore', gradient: 'linear-gradient(45deg, #00c6ff, #0072ff, #7209b7, #f72585)', vipplus: true, category: 'vip+', animation: 'aurora' },
  { id: 'cosmic', label: 'Cosmique', gradient: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)', vipplus: true, category: 'vip+', animation: 'cosmic' },
  { id: 'neon', label: 'Neon', gradient: 'linear-gradient(135deg, #00ff87, #60efff)', vipplus: true, category: 'vip+', animation: 'neon' },
];

// Animations CSS pour les playlists VIP
const playlistAnimations = `
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes aurora {
    0%, 100% { filter: hue-rotate(0deg); }
    50% { filter: hue-rotate(30deg); }
  }
  @keyframes neon-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 135, 0.3), 0 0 40px rgba(96, 239, 255, 0.2); }
    50% { box-shadow: 0 0 30px rgba(0, 255, 135, 0.5), 0 0 60px rgba(96, 239, 255, 0.4); }
  }
  @keyframes stars {
    0% { background-position: 0 0; }
    100% { background-position: 100px 100px; }
  }
  .playlist-shimmer { background-size: 200% auto; animation: shimmer 3s linear infinite; }
  .playlist-aurora { animation: aurora 5s ease-in-out infinite; }
  .playlist-neon { animation: neon-glow 2s ease-in-out infinite; }
  .playlist-cosmic { background-size: 400% 400%; animation: shimmer 8s ease infinite; }
  .playlist-glow:hover { box-shadow: 0 0 30px rgba(255,255,255,0.3); transition: box-shadow 0.3s ease; }
  .playlist-pulse { animation: pulse 2s ease-in-out infinite; }
`;

// Icones de playlist
const PLAYLIST_ICONS = [
  { id: 'music', label: 'Musique', icon: '🎵' },
  { id: 'movie', label: 'Film', icon: '🎬' },
  { id: 'fire', label: 'Feu', icon: '🔥' },
  { id: 'star', label: 'Etoile', icon: '⭐' },
  { id: 'heart', label: 'Coeur', icon: '❤️' },
  { id: 'thunder', label: 'Eclair', icon: '⚡' },
  { id: 'skull', label: 'Crane', icon: '💀' },
  { id: 'gem', label: 'Diamant', icon: '💎' },
  { id: 'crown', label: 'Couronne', icon: '👑' },
  { id: 'rocket', label: 'Fusee', icon: '🚀' },
  { id: 'ghost', label: 'Fantome', icon: '👻' },
  { id: 'alien', label: 'Alien', icon: '👽' },
  { id: 'popcorn', label: 'Popcorn', icon: '🍿' },
  { id: 'tv', label: 'TV', icon: '📺' },
  { id: 'game', label: 'Jeu', icon: '🎮' },
  { id: 'rainbow', label: 'Arc-en-ciel', icon: '🌈' },
];

// Images de couverture predefinies
const COVER_PRESETS = [
  { id: 'action', label: 'Action', url: 'https://image.tmdb.org/t/p/w780/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg' },
  { id: 'scifi', label: 'Sci-Fi', url: 'https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg' },
  { id: 'horror', label: 'Horreur', url: 'https://image.tmdb.org/t/p/w780/bckxSN9T9A5KDoeOLOR1FUblDYN.jpg' },
  { id: 'romance', label: 'Romance', url: 'https://image.tmdb.org/t/p/w780/5wDBVictqfBGCTgJBEuJLnTPuv6.jpg' },
  { id: 'anime', label: 'Anime', url: 'https://image.tmdb.org/t/p/w780/jBJWaqoSCiARWtfV0GlqHrcdiJq.jpg' },
  { id: 'comedy', label: 'Comedie', url: 'https://image.tmdb.org/t/p/w780/cyecB7godJ6kNHGONFjUyVN9OX5.jpg' },
];

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [customizeTab, setCustomizeTab] = useState('colors');

  useEffect(() => {
    // Inject animations CSS
    if (!document.getElementById('playlist-animations')) {
      const style = document.createElement('style');
      style.id = 'playlist-animations';
      style.textContent = playlistAnimations;
      document.head.appendChild(style);
    }
    
    API.get(`/api/playlists/${id}`).then(({ data }) => {
      setPlaylist(data.playlist);
      setCoverUrl(data.playlist?.cover_url || '');
    }).catch(() => navigate('/playlists')).finally(() => setLoading(false));
  }, [id, navigate]);

  const removeItem = async (contentId) => {
    try {
      await API.delete(`/api/playlists/${id}/items/${contentId}`);
      setPlaylist(prev => ({ ...prev, items: prev.items.filter(i => i.content_id !== contentId) }));
      toast({ title: 'Element retire de la playlist' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const changeColor = async (colorId) => {
    const c = PLAYLIST_COLORS.find(x => x.id === colorId);
    if (!c) return;
    if (c.vip && !user?.is_vip && !user?.is_vip_plus && !user?.is_admin) { 
      toast({ title: 'Couleur VIP requise', description: 'Devenez VIP pour débloquer cette couleur', variant: 'destructive' }); 
      return; 
    }
    if (c.vipplus && !user?.is_vip_plus && !user?.is_admin) { 
      toast({ title: 'Couleur VIP+ requise', description: 'Devenez VIP+ pour débloquer cette couleur exclusive', variant: 'destructive' }); 
      return; 
    }
    try {
      await API.put(`/api/playlists/${id}/customize`, { color: colorId, gradient: c.gradient, animation: c.animation || null });
      setPlaylist(prev => ({ ...prev, color: colorId, gradient: c.gradient, animation: c.animation }));
      toast({ title: 'Style applique !' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const saveCoverUrl = async () => {
    if (!user?.is_vip && !user?.is_vip_plus && !user?.is_admin) {
      toast({ title: 'Fonctionnalite VIP', description: 'Les images de couverture sont reservees aux VIP', variant: 'destructive' });
      return;
    }
    try {
      await API.put(`/api/playlists/${id}/customize`, { cover_url: coverUrl });
      setPlaylist(prev => ({ ...prev, cover_url: coverUrl }));
      toast({ title: 'Image de couverture mise a jour !' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const saveNameDesc = async () => {
    try {
      await API.put(`/api/playlists/${id}/customize`, { name: editName || playlist.name, description: editDesc });
      setPlaylist(prev => ({ ...prev, name: editName || prev.name, description: editDesc }));
      setEditingName(false);
      setEditingDesc(false);
      toast({ title: 'Playlist mise a jour' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const changeIcon = async (iconId) => {
    try {
      await API.put(`/api/playlists/${id}/customize`, { icon: iconId });
      setPlaylist(prev => ({ ...prev, icon: iconId }));
      toast({ title: 'Icone mise a jour' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const togglePublic = async () => {
    try {
      await API.put(`/api/playlists/${id}/customize`, { is_public: !playlist.is_public });
      setPlaylist(prev => ({ ...prev, is_public: !prev.is_public }));
      toast({ title: playlist.is_public ? 'Playlist passee en prive' : 'Playlist passee en public' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/playlists/${id}`;
    navigator.clipboard.writeText(url).then(() => toast({ title: 'Lien copie !' })).catch(() => {});
  };

  const applyPresetCover = async (url) => {
    if (!user?.is_vip && !user?.is_vip_plus && !user?.is_admin) {
      toast({ title: 'Fonctionnalite VIP', variant: 'destructive' });
      return;
    }
    try {
      await API.put(`/api/playlists/${id}/customize`, { cover_url: url });
      setPlaylist(prev => ({ ...prev, cover_url: url }));
      setCoverUrl(url);
      toast({ title: 'Couverture appliquee !' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const isOwner = user && playlist && playlist.user_id === user._id;
  const colorConfig = PLAYLIST_COLORS.find(c => c.id === playlist?.color) || PLAYLIST_COLORS[0];
  const animationClass = colorConfig.animation ? `playlist-${colorConfig.animation}` : '';

  if (loading) return <LoadingSpinner />;
  if (!playlist) return <div className="container mx-auto px-4 py-12 text-center">Playlist non trouvee</div>;

  // Déterminer le style de la playlist
  const playlistStyle = playlist.gradient ? { background: playlist.gradient } : {};
  if (playlist.cover_url) {
    playlistStyle.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${playlist.cover_url})`;
    playlistStyle.backgroundSize = 'cover';
    playlistStyle.backgroundPosition = 'center';
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="playlist-detail-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="back-btn">
        <ArrowLeft className="w-4 h-4" />Retour
      </button>

      {/* Header avec personnalisation */}
      <div className={`bg-card border border-border rounded-xl p-6 mb-8 relative overflow-hidden ${animationClass}`} style={playlistStyle}>
        {/* Badge de type de playlist */}
        {playlist.user_info && (
          <div className="absolute top-4 right-4">
            <PlaylistBadge userInfo={playlist.user_info} />
          </div>
        )}

        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Icon de playlist */}
              {playlist.icon && (
                <span className="text-3xl">{PLAYLIST_ICONS.find(i => i.id === playlist.icon)?.icon || '🎵'}</span>
              )}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="text-3xl font-bold bg-transparent border-b-2 border-white/50 outline-none text-white" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveNameDesc(); }} />
                  <button onClick={saveNameDesc} className="p-1 rounded bg-green-500/30 text-green-400 hover:bg-green-500/50"><Check className="w-5 h-5" /></button>
                </div>
              ) : (
                <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="playlist-title">
                  {!playlist.icon && <ListMusic className="w-8 h-8" />}{playlist.name}
                  {isOwner && <button onClick={() => { setEditName(playlist.name); setEditingName(true); }} className="p-1 rounded-full hover:bg-white/20 transition-colors"><Edit3 className="w-4 h-4 text-white/60" /></button>}
                </h1>
              )}
              {colorConfig.vipplus && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">EXCLUSIVE</span>
              )}
              {colorConfig.vip && !colorConfig.vipplus && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-yellow-500/80 text-black">VIP</span>
              )}
            </div>
            {editingDesc ? (
              <div className="flex items-center gap-2 mt-2">
                <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description..." className="flex-1 bg-transparent border-b border-white/30 outline-none text-white/80 text-sm" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveNameDesc(); }} />
                <button onClick={saveNameDesc} className="p-1 rounded bg-green-500/30 text-green-400"><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-white/80 mt-2 flex items-center gap-2">
                {playlist.description || (isOwner ? 'Ajouter une description...' : '')}
                {isOwner && <button onClick={() => { setEditDesc(playlist.description || ''); setEditingDesc(true); }} className="p-0.5 rounded-full hover:bg-white/20"><Edit3 className="w-3 h-3 text-white/40" /></button>}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
              {isOwner ? (
                <button onClick={togglePublic} className="flex items-center gap-1 hover:text-white transition-colors" data-testid="toggle-public">
                  {playlist.is_public ? <><Globe className="w-4 h-4 text-green-400" />Public</> : <><Lock className="w-4 h-4" />Prive</>}
                </button>
              ) : (
                <span className="flex items-center gap-1">{playlist.is_public ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4" />}{playlist.is_public ? 'Public' : 'Prive'}</span>
              )}
              <span>{playlist.items?.length || 0} element{(playlist.items?.length || 0) !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1">
                par {playlist.username || 'Anonyme'}
                {playlist.user_info && <PlaylistBadge userInfo={playlist.user_info} />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {playlist.is_public && (
              <button onClick={copyShareLink} className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-sm hover:bg-white/20 flex items-center gap-2" data-testid="share-btn">
                <Share2 className="w-4 h-4" />Partager
              </button>
            )}
            {isOwner && (
              <button onClick={() => setShowCustomize(!showCustomize)} className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-sm hover:bg-white/20 flex items-center gap-2" data-testid="customize-btn">
                <Settings className="w-4 h-4" />Personnaliser
              </button>
            )}
          </div>
        </div>

        {/* Panel de personnalisation avec onglets */}
        {showCustomize && isOwner && (
          <div className="mt-6 pt-6 border-t border-white/20 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              {[
                { id: 'colors', label: 'Couleurs', icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: 'icons', label: 'Icones', icon: <ListMusic className="w-3.5 h-3.5" /> },
                { id: 'cover', label: 'Couverture', icon: <Image className="w-3.5 h-3.5" /> },
              ].map(t => (
                <button key={t.id} onClick={() => setCustomizeTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${customizeTab === t.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            
            {/* Tab: Couleurs */}
            {customizeTab === 'colors' && (
              <>
                <div className="mb-4">
                  <p className="text-xs text-white/60 mb-2">Standard</p>
                  <div className="flex flex-wrap gap-2">
                    {PLAYLIST_COLORS.filter(c => c.category === 'standard').map(c => (
                      <button key={c.id} onClick={() => changeColor(c.id)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${playlist.color === c.id ? 'border-white ring-2 ring-white/50' : 'border-transparent'}`}
                        style={c.gradient ? { background: c.gradient } : { background: '#333' }}
                        title={c.label} data-testid={`color-${c.id}`} />
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-white/60 mb-2 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-400" />VIP
                    {!user?.is_vip && !user?.is_admin && <span className="text-yellow-400 ml-1">(Devenez VIP)</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLAYLIST_COLORS.filter(c => c.category === 'vip').map(c => (
                      <button key={c.id} onClick={() => changeColor(c.id)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 relative ${playlist.color === c.id ? 'border-white ring-2 ring-yellow-500/50' : 'border-yellow-500/30'} ${!user?.is_vip && !user?.is_admin ? 'opacity-50' : ''}`}
                        style={{ background: c.gradient }} title={c.label} data-testid={`color-${c.id}`}>
                        {c.animation && <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-white/60 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />VIP+ Exclusives
                    {!user?.is_vip_plus && !user?.is_admin && <span className="text-purple-400 ml-1">(Devenez VIP+)</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLAYLIST_COLORS.filter(c => c.category === 'vip+').map(c => (
                      <button key={c.id} onClick={() => changeColor(c.id)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 relative ${playlist.color === c.id ? 'border-white ring-2 ring-purple-500/50' : 'border-purple-500/30'} ${!user?.is_vip_plus && !user?.is_admin ? 'opacity-50' : ''}`}
                        style={{ background: c.gradient }} title={c.label} data-testid={`color-${c.id}`}>
                        {c.animation && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Icones */}
            {customizeTab === 'icons' && (
              <div>
                <p className="text-xs text-white/60 mb-3">Choisissez une icone pour votre playlist</p>
                <div className="grid grid-cols-8 gap-2">
                  {PLAYLIST_ICONS.map(ic => (
                    <button key={ic.id} onClick={() => changeIcon(ic.id)}
                      className={`p-2.5 rounded-lg text-xl text-center transition-all hover:scale-110 ${playlist.icon === ic.id ? 'bg-white/20 ring-2 ring-white/50' : 'bg-white/5 hover:bg-white/10'}`}
                      title={ic.label} data-testid={`icon-${ic.id}`}>
                      {ic.icon}
                    </button>
                  ))}
                  <button onClick={() => changeIcon(null)}
                    className={`p-2.5 rounded-lg text-xs text-center transition-all hover:scale-110 text-white/60 ${!playlist.icon ? 'bg-white/20 ring-2 ring-white/50' : 'bg-white/5 hover:bg-white/10'}`}
                    title="Aucune">
                    <ListMusic className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Couverture */}
            {customizeTab === 'cover' && (
              <div>
                <p className="text-xs text-white/60 mb-3 flex items-center gap-1">
                  <Image className="w-3 h-3" />Image de couverture
                  {!user?.is_vip && !user?.is_admin && <span className="text-yellow-400 ml-1">(VIP requis)</span>}
                </p>
                {/* Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {COVER_PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyPresetCover(p.url)}
                      className={`rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${playlist.cover_url === p.url ? 'border-white' : 'border-transparent'} ${!user?.is_vip && !user?.is_admin ? 'opacity-50' : ''}`}
                      data-testid={`cover-${p.id}`}>
                      <div className="aspect-video relative">
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">{p.label}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Custom URL */}
                <div className="flex gap-2">
                  <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Ou entrez une URL personnalisee..."
                    disabled={!user?.is_vip && !user?.is_admin}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-sm outline-none disabled:opacity-50" />
                  <button onClick={saveCoverUrl} disabled={!user?.is_vip && !user?.is_admin}
                    className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium disabled:opacity-50">Appliquer</button>
                </div>
                {playlist.cover_url && (
                  <button onClick={() => applyPresetCover('')} className="mt-2 text-xs text-red-400 hover:underline">Supprimer la couverture</button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 relative z-10">
          <LikeDislike contentId={parseInt(id) || id.hashCode?.()} contentType="playlist" />
        </div>
      </div>

      {/* Contenu de la playlist */}
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
