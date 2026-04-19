import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../lib/api';
import { Tv, X, Play, Search, ThumbsUp, ThumbsDown, Heart, Plus, ChevronDown } from 'lucide-react';
import { QuickPlaylistAdd } from '../components/ContentCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const CATEGORY_COLORS = {
  Generaliste: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Généraliste': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Divertissement: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Info: 'bg-red-500/15 text-red-300 border-red-500/30',
  Sport: 'bg-green-500/15 text-green-300 border-green-500/30',
  Documentaire: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Culture: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Premium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Jeunesse: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  Musique: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
};

function ChannelCard({ channel, onWatch, onFavorite, onVote, userVote, isFavorite }) {
  const cat = channel.category || 'Autre';
  const catColor = CATEGORY_COLORS[cat] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  const likes = channel.likes || 0;
  const dislikes = channel.dislikes || 0;
  const country = channel.country ? (channel.country === 'FR' ? 'FR' : channel.country === 'France' ? 'France' : channel.country) : 'France';

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-4"
      data-testid={`channel-card-${channel.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/90 p-1 flex-shrink-0 flex items-center justify-center">
          {(channel.logo || channel.logo_url) ? (
            <img
              src={channel.logo || channel.logo_url}
              alt={channel.name}
              className="w-full h-full object-contain"
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">TV</div>'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">TV</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{channel.name}</h3>
          <span className={`inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${catColor}`}>{cat}</span>
        </div>
        <button
          onClick={() => onFavorite(channel)}
          className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Favori"
          data-testid={`fav-${channel.name}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {channel.description || 'Aucune description disponible'}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{country}</span>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-foreground font-semibold">HD</span>
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">LIVE</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-2 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm">
        <button
          onClick={() => onVote(channel, 'like')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'}`}
          data-testid={`like-${channel.name}`}
        >
          <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-green-400/30' : ''}`} />
          <span className="font-semibold text-green-400/90">{likes}</span>
        </button>
        <span className="w-px h-4 bg-border" />
        <button
          onClick={() => onVote(channel, 'dislike')}
          className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
          data-testid={`dislike-${channel.name}`}
        >
          <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-red-400/30' : ''}`} />
          <span className="font-semibold text-red-400/90">{dislikes}</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onWatch(channel)}
          className="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
          data-testid={`watch-${channel.name}`}
        >
          <Play className="w-4 h-4 fill-current" /> Regarder
        </button>
        <QuickPlaylistAdd
          contentId={channel._id || channel.id || channel.name}
          contentType="tv_channel"
          title={channel.name}
          posterPath={channel.logo || channel.logo_url}
          inline
          metadata={{ stream_url: channel.stream_url, category: channel.category }}
        />
      </div>
    </div>
  );
}

export default function TVChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();

  const loadChannels = useCallback(() => {
    API.get('/api/tv-channels').then(({ data }) => setChannels(data.channels || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadChannels();
    if (user) {
      API.get('/api/user/favorites').then(({ data }) => {
        const map = {};
        (data.favorites || []).filter(f => f.content_type === 'tv_channel').forEach(f => { map[String(f.content_id)] = true; });
        setFavorites(map);
      }).catch(() => {});
      API.get('/api/media-votes/mine').then(({ data }) => {
        const vmap = {};
        (data.votes || []).filter(v => v.target_collection === 'tv_channels').forEach(v => { vmap[v.target_id] = v.vote; });
        setUserVotes(vmap);
      }).catch(() => {});
    }
  }, [user, loadChannels]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(channels.map(c => c.category).filter(Boolean)))], [channels]);

  const filtered = useMemo(() => channels.filter(c => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (search && !(c.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [channels, filter, search]);

  const handleFavorite = async (ch) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = ch._id || ch.id || ch.name;
      await API.post('/api/user/favorites', {
        content_id: id, content_type: 'tv_channel', title: ch.name, poster_path: ch.logo || ch.logo_url, metadata: { stream_url: ch.stream_url, category: ch.category }
      });
      setFavorites(p => ({ ...p, [String(id)]: !p[String(id)] }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleVote = async (ch, vote) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const id = ch._id;
      const { data } = await API.post(`/api/tv-channels/${id}/vote`, { vote });
      setChannels(prev => prev.map(c => c._id === id ? { ...c, likes: data.likes, dislikes: data.dislikes } : c));
      setUserVotes(prev => ({ ...prev, [id]: data.user_vote }));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-14" data-testid="tv-channels-page">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Chaînes TV en Direct</h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg">Regardez vos chaînes préférées en streaming direct</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une chaîne..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors"
            data-testid="tv-search-input"
          />
        </div>
        <div className="relative md:w-56">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 h-12 rounded-xl border border-border bg-card outline-none text-sm focus:border-primary/50 transition-colors cursor-pointer"
            data-testid="tv-category-filter"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'Toutes les catégories' : c}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(ch => (
          <ChannelCard
            key={ch._id || ch.id || ch.name}
            channel={ch}
            onWatch={setSelectedChannel}
            onFavorite={handleFavorite}
            onVote={handleVote}
            userVote={userVotes[ch._id]}
            isFavorite={!!favorites[String(ch._id || ch.id || ch.name)]}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucune chaîne trouvée</p>
        </div>
      )}

      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedChannel(null)}>
          <div className="w-full max-w-5xl bg-card rounded-2xl overflow-hidden border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                {(selectedChannel.logo || selectedChannel.logo_url) && (
                  <img src={selectedChannel.logo || selectedChannel.logo_url} alt="" className="h-9 w-auto object-contain bg-white/90 rounded p-0.5" />
                )}
                <div>
                  <h3 className="font-bold">{selectedChannel.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedChannel.category}{selectedChannel.country ? ` · ${selectedChannel.country}` : ''}</p>
                </div>
              </div>
              <button onClick={() => setSelectedChannel(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors" data-testid="close-stream-modal"><X className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video bg-black">
              {selectedChannel.stream_url ? (
                <iframe src={selectedChannel.stream_url} title={selectedChannel.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Tv className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">Aucun flux disponible</p>
                  <p className="text-sm mt-1 opacity-70">Le flux de cette chaîne n'est pas encore configuré</p>
                </div>
              )}
            </div>
            {selectedChannel.description && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
