import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/Loading';
import LikeDislike from '../components/LikeDislike';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { Play, Star, Calendar, Clock, Heart, CheckCircle, Download, Youtube } from 'lucide-react';

export default function EpisodeDetailPage({ isAnime = false }) {
  const { id, seasonNumber, episodeNumber } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [episode, setEpisode] = useState(null);
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStream, setShowStream] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const epContentId = parseInt(`${id}${seasonNumber}${episodeNumber}`);

  useEffect(() => {
    API.get(`/api/tmdb/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`).then(({ data }) => setEpisode(data)).catch(() => {}).finally(() => setLoading(false));
    API.get(`/api/tmdb/tv/${id}`).then(({ data }) => setSeriesInfo(data)).catch(() => {});
    if (user) {
      API.get('/api/user/history').then(({ data }) => {
        setIsWatched((data.history || []).some(h => h.content_id === epContentId && h.content_type === 'episode'));
      }).catch(() => {});
      API.get(`/api/user/favorites/check?content_id=${epContentId}&content_type=episode`).then(({ data }) => setIsFavorite(data.is_favorite)).catch(() => {});
    }
  }, [id, seasonNumber, episodeNumber, user, epContentId]);

  const markAsWatched = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      await API.post('/api/user/history', { content_id: epContentId, content_type: 'episode', title: `S${seasonNumber}E${episodeNumber} - ${episode?.name || ''}`, poster_path: episode?.still_path });
      setIsWatched(true);
      toast({ title: 'Episode marque comme vu !' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const toggleFavorite = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const { data } = await API.post('/api/user/favorites', { content_id: epContentId, content_type: 'episode', title: `S${seasonNumber}E${episodeNumber} - ${episode?.name || ''}`, poster_path: episode?.still_path });
      setIsFavorite(data.is_favorite);
      toast({ title: data.is_favorite ? 'Ajoute aux favoris' : 'Retire des favoris' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  if (loading) return <LoadingSpinner />;
  if (!episode) return <div className="container mx-auto px-4 py-12 text-center">Episode non trouve</div>;

  const basePath = isAnime ? 'anime' : 'tv-shows';
  const streamUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${id}-s${seasonNumber}-e${episodeNumber}`;
  const downloadUrl = `https://wwembed.wavewatch.xyz/api/v1/download/ww-tv-${id}-s${seasonNumber}-e${episodeNumber}`;
  const getTrailerUrl = () => {
    const vids = seriesInfo?.videos?.results || [];
    const trailer = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vids.find(v => v.site === 'YouTube');
    return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="episode-detail-page">
      <Link to={`/${basePath}/${id}/season/${seasonNumber}`} className="text-blue-400 hover:underline text-sm mb-4 block">&larr; Retour a la saison {seasonNumber}</Link>
      {episode.still_path && (
        <div className="aspect-video max-w-3xl rounded-xl overflow-hidden mb-6 bg-muted relative">
          <img src={`${TMDB_IMG}/original${episode.still_path}`} alt={episode.name} className={`w-full h-full object-cover ${user?.hide_spoilers && !isWatched ? 'blur-xl' : ''}`} />
          {user?.hide_spoilers && !isWatched && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="text-white font-medium px-4 py-2 rounded-lg bg-black/50">Anti-spoiler actif</span></div>
          )}
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2">{seriesInfo?.name ? `${seriesInfo.name} - ` : ''}S{seasonNumber}E{episodeNumber} : {episode.name}</h1>
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
        {episode.vote_average > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{episode.vote_average.toFixed(1)}/10</span>}
        {episode.air_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(episode.air_date).toLocaleDateString('fr-FR')}</span>}
        {episode.runtime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{episode.runtime} min</span>}
        {episode.air_date && new Date(episode.air_date) <= new Date() ? (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Disponible</span>
        ) : (
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">A venir</span>
        )}
      </div>
      {episode.overview && (
        user?.hide_spoilers && !isWatched ? (
          <div className="text-lg mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-400 font-medium flex items-center gap-2"><span className="text-lg">🔒</span>Mode anti-spoiler actif</p>
            <p className="text-sm text-muted-foreground mt-1">Le synopsis est masque car vous n'avez pas encore vu cet episode.</p>
          </div>
        ) : (
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">{episode.overview}</p>
        )
      )}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={() => { setShowStream(true); if (user?.auto_mark_watched !== false && !isWatched) markAsWatched(); }} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2" data-testid="watch-btn"><Play className="w-5 h-5" />Regarder</button>
        <button onClick={toggleFavorite} className={`px-5 py-2.5 rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 ${isFavorite ? 'bg-yellow-900/20' : ''}`} data-testid="favorite-btn">
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />Favoris
        </button>
        <button onClick={markAsWatched} className={`px-5 py-2.5 rounded-lg border flex items-center gap-2 transition-all duration-300 ${isWatched ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20' : 'border-cyan-600 text-cyan-400 hover:bg-cyan-900/20'}`} data-testid="watched-btn">
          <CheckCircle className={`w-5 h-5 transition-all ${isWatched ? 'fill-green-500 text-green-500 scale-110' : ''}`} />{isWatched ? 'Deja vu' : 'Marquer vu'}
        </button>
        <AddToPlaylistButton contentId={epContentId} contentType="episode" title={`${seriesInfo?.name || 'Serie'} - ${episode.name} S${seasonNumber}E${episodeNumber}`} posterPath={seriesInfo?.poster_path || episode.still_path}
          metadata={{ series_id: id, series_name: seriesInfo?.name || '', series_poster: seriesInfo?.poster_path, season_number: seasonNumber, episode_number: episodeNumber, is_anime: isAnime, still_path: episode.still_path }} />
      </div>
      <LikeDislike contentId={epContentId} contentType="episode" />
      {episode.guest_stars?.length > 0 && (
        <div className="mt-8"><h2 className="text-xl font-bold mb-4">Guest Stars</h2>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {episode.guest_stars.slice(0, 8).map(p => (
              <Link key={p.id} to={`/actors/${p.id}`} className="flex-shrink-0 w-20 text-center group">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted mb-2"><img src={p.profile_path ? `${TMDB_IMG}/w200${p.profile_path}` : 'https://placehold.co/200x200/333/ccc?text=?'} alt={p.name} className="w-full h-full object-cover" /></div>
                <p className="text-xs font-medium group-hover:text-blue-400 line-clamp-2">{p.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {showStream && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowStream(false)}>
          <div className="w-full max-w-5xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-800"><h3 className="text-white font-medium">{episode.name}</h3><button onClick={() => setShowStream(false)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="aspect-video"><iframe src={streamUrl} title={episode.name} className="w-full h-full" allowFullScreen /></div>
          </div>
        </div>
      )}
    </div>
  );
}
