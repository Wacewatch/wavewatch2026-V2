import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG, TMDB_API_KEY } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Star, Calendar, Play, Heart, CheckCircle, Eye, EyeOff, SkipForward, Tv, Bell, BellOff, Download, Youtube } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import LikeDislike from '../components/LikeDislike';
import { LoadingSpinner } from '../components/Loading';

export default function TVShowDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState({});
  const [continueInfo, setContinueInfo] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/tmdb/tv/${id}`).then(({ data }) => setShow(data)).catch(() => {}).finally(() => setLoading(false));
    API.get(`/api/tmdb/similar/tv/${id}`).then(({ data }) => setSimilar((data.results || []).slice(0, 12))).catch(() => {});
    fetch(`https://api.themoviedb.org/3/tv/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=fr,en,null`)
      .then(r => r.json()).then(data => {
        const logo = data.logos?.find(l => l.iso_639_1 === 'fr') || data.logos?.find(l => l.iso_639_1 === 'en') || data.logos?.[0];
        if (logo?.file_path) setLogoUrl(`${TMDB_IMG}/original${logo.file_path}`);
      }).catch(() => {});
    if (user) {
      API.get(`/api/user/favorites/check?content_id=${id}&content_type=tv`).then(({ data }) => setIsFavorite(data.is_favorite)).catch(() => {});
      API.get('/api/user/history').then(({ data }) => { setIsWatched((data.history || []).some(h => h.content_id === parseInt(id) && h.content_type === 'tv')); }).catch(() => {});
      API.get(`/api/notifications/check-series/${id}`).then(({ data }) => setSubscribed(data.subscribed)).catch(() => {});
      // Get watched episodes for this show
      API.get(`/api/user/tv-progress/${id}`).then(({ data }) => {
        setWatchedEpisodes(data.watched_episodes || {});
        setContinueInfo(data.continue_watching);
      }).catch(() => {});
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    const { data } = await API.post('/api/user/favorites', { content_id: parseInt(id), content_type: 'tv', title: show.name, poster_path: show.poster_path });
    setIsFavorite(data.is_favorite);
    toast({ title: data.is_favorite ? 'Ajoute aux favoris' : 'Retire des favoris' });
  };

  const markAsWatched = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      await API.post('/api/user/history', { content_id: parseInt(id), content_type: 'tv', title: show.name, poster_path: show.poster_path });
      setIsWatched(true);
      toast({ title: 'Marque comme vu' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  // Marquer TOUTE la série comme vue (toutes les saisons et épisodes)
  const markAllAsWatched = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    if (!window.confirm(`Marquer toutes les ${show.number_of_seasons} saisons et ${show.number_of_episodes} épisodes comme vus ?`)) return;
    
    setMarkingAll(true);
    try {
      await API.post(`/api/user/tv-progress/${id}/mark-all-watched`, { show_name: show.name, poster_path: show.poster_path });
      setIsWatched(true);
      // Refresh watched episodes
      const { data } = await API.get(`/api/user/tv-progress/${id}`);
      setWatchedEpisodes(data.watched_episodes || {});
      toast({ title: 'Toute la série marquée comme vue !', description: `${show.number_of_seasons} saisons, ${show.number_of_episodes} épisodes` });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setMarkingAll(false); }
  };

  // Reprendre la lecture
  const handleContinueWatching = () => {
    if (continueInfo) {
      navigate(`/tv-shows/${id}/season/${continueInfo.season}/episode/${continueInfo.episode}`);
    }
  };

  // Calculer la progression
  const getProgress = () => {
    if (!show || !watchedEpisodes) return { watched: 0, total: show?.number_of_episodes || 0, percent: 0 };
    let total = 0;
    let watched = 0;
    Object.values(watchedEpisodes).forEach(seasonEps => {
      Object.values(seasonEps).forEach(isWatched => {
        total++;
        if (isWatched) watched++;
      });
    });
    return { watched, total: show.number_of_episodes, percent: show.number_of_episodes > 0 ? Math.round((watched / show.number_of_episodes) * 100) : 0 };
  };

  const progress = getProgress();

  if (loading) return <LoadingSpinner />;
  if (!show) return <div className="container mx-auto px-4 py-12 text-center">Serie non trouvee</div>;

  const poster = show.poster_path ? `${TMDB_IMG}/w500${show.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Image';
  const backdrop = show.backdrop_path ? `${TMDB_IMG}/original${show.backdrop_path}` : '';
  const streamUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${id}`;
  const downloadUrl = `https://wwembed.wavewatch.xyz/api/v1/download/ww-tv-${id}`;
  const getTrailerUrl = () => {
    const trailer = show?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || show?.videos?.results?.find(v => v.site === 'YouTube');
    return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
  };
  const status = show.status === 'Ended' || show.status === 'Canceled' ? { label: 'Terminee', color: 'bg-red-600' } : { label: 'En cours', color: 'bg-green-600' };

  return (
    <div className="min-h-screen bg-black" data-testid="tv-show-detail-page">
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {backdrop && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdrop})` }}>
          <div className="absolute inset-0 bg-black/60" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>}
      </div>
      <div className="container mx-auto px-4 -mt-16 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden shadow-2xl">
              <img src={poster} alt={show.name} className="w-full h-full object-cover" />
              {/* Progress bar overlay */}
              {progress.watched > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-1">{progress.watched}/{progress.total} ({progress.percent}%)</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            {logoUrl ? <img src={logoUrl} alt={show.name} className="h-16 md:h-24 w-auto object-contain" /> : <h1 className="text-2xl md:text-5xl font-bold text-white">{show.name}</h1>}
            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              <div className="flex items-center gap-1.5"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /><span>{show.vote_average?.toFixed(1)}/10</span></div>
              <div className="flex items-center gap-1.5"><Calendar className="w-5 h-5" /><span>{new Date(show.first_air_date).getFullYear()}</span></div>
              <span>{show.number_of_seasons} saison{show.number_of_seasons > 1 ? 's' : ''}</span>
              <span>{show.number_of_episodes} episodes</span>
              <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full`}>{status.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {show.genres?.map(g => <span key={g.id} className="px-3 py-1 text-sm rounded-full bg-gray-800 text-gray-300 border border-gray-700">{g.name}</span>)}
            </div>
            {/* Details + Status */}
            <div className="flex flex-wrap items-center gap-3">
              {show.status === 'Returning Series' ? (
                <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">En cours de diffusion</span>
              ) : show.status === 'Ended' ? (
                <span className="px-3 py-1 text-xs rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 font-medium">Serie terminee</span>
              ) : show.status === 'Canceled' ? (
                <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Annulee</span>
              ) : show.status === 'In Production' ? (
                <span className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">En production</span>
              ) : null}
              {show.next_episode_to_air && (
                <span className="text-xs text-amber-400">Prochain ep. le {new Date(show.next_episode_to_air.air_date).toLocaleDateString('fr-FR')}</span>
              )}
              {show.original_language && <span className="text-xs text-muted-foreground">Langue : {show.original_language.toUpperCase()}</span>}
              {show.networks?.length > 0 && <span className="text-xs text-muted-foreground">Diffuseur : {show.networks.map(n => n.name).join(', ')}</span>}
              {show.production_countries?.length > 0 && <span className="text-xs text-muted-foreground">Pays : {show.production_countries.map(c => c.name).join(', ')}</span>}
            </div>
            <p className="text-base md:text-xl text-gray-200 leading-relaxed">{show.overview}</p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Bouton Reprendre (si applicable) */}
              {continueInfo && (
                <button 
                  onClick={handleContinueWatching} 
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium flex items-center gap-2 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25 transition-all"
                  data-testid="continue-watching-btn"
                >
                  <SkipForward className="w-5 h-5" />
                  Reprendre S{continueInfo.season} E{continueInfo.episode}
                </button>
              )}
              
              <button onClick={() => { setShowStream(true); if (user?.auto_mark_watched !== false) markAsWatched(); }} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2"><Play className="w-5 h-5" />Regarder</button>
              <button onClick={() => setShowDownload(true)} className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-400 hover:bg-blue-900/20 flex items-center gap-2"><Download className="w-5 h-5" />Telecharger</button>
              <button onClick={() => setShowTrailer(true)} className="px-5 py-2.5 rounded-lg border border-orange-600 text-orange-400 hover:bg-orange-900/20 flex items-center gap-2"><Youtube className="w-5 h-5" />Bande-annonce</button>
              <button onClick={toggleFavorite} className={`px-5 py-2.5 rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 ${isFavorite ? 'bg-yellow-900/20' : ''}`}>
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />Favoris
              </button>
              <button onClick={markAsWatched} className={`px-5 py-2.5 rounded-lg border flex items-center gap-2 transition-all duration-300 ${isWatched ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20' : 'border-cyan-600 text-cyan-400 hover:bg-cyan-900/20'}`} data-testid="watched-btn">
                <CheckCircle className={`w-5 h-5 transition-all ${isWatched ? 'fill-green-500 text-green-500 scale-110' : ''}`} />{isWatched ? 'Deja vu' : 'Marquer vu'}
              </button>
              <AddToPlaylistButton contentId={parseInt(id)} contentType="tv" title={show.name} posterPath={show.poster_path} />
              {user && (
                <button onClick={async () => {
                  try {
                    const { data } = await API.post('/api/notifications/subscribe-series', { series_id: parseInt(id), series_name: show.name });
                    setSubscribed(data.subscribed);
                    toast({ title: data.message });
                  } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
                }} className={`px-5 py-2.5 rounded-lg border flex items-center gap-2 transition-colors ${subscribed ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-gray-600 text-gray-400 hover:border-amber-500/50 hover:text-amber-400'}`} data-testid="subscribe-btn">
                  {subscribed ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {subscribed ? 'Notifications ON' : 'Notifier'}
                </button>
              )}
            </div>
            
            {/* Marquer TOUTE la série comme vue */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
              <Tv className="w-6 h-6 text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Marquer toute la série comme vue</p>
                <p className="text-xs text-gray-400">Marque automatiquement {show.number_of_seasons} saisons et {show.number_of_episodes} épisodes</p>
              </div>
              <button 
                onClick={markAllAsWatched}
                disabled={markingAll}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  progress.percent === 100 
                    ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                data-testid="mark-all-watched-btn"
              >
                {markingAll ? (
                  <span className="animate-spin">⏳</span>
                ) : progress.percent === 100 ? (
                  <><CheckCircle className="w-4 h-4 fill-green-500" /> Serie complete</>
                ) : (
                  <><Eye className="w-4 h-4" /> Tout marquer</>
                )}
              </button>
            </div>

            {/* Like/Dislike */}
            <LikeDislike contentId={parseInt(id)} contentType="tv" />
            
            {/* Seasons */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Saisons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {show.seasons?.filter(s => s.season_number > 0).map(season => {
                  // Calculer la progression de la saison
                  const seasonWatched = watchedEpisodes[season.season_number] || {};
                  const watchedCount = Object.values(seasonWatched).filter(Boolean).length;
                  const seasonPercent = season.episode_count > 0 ? Math.round((watchedCount / season.episode_count) * 100) : 0;
                  
                  return (
                    <Link key={season.id} to={`/tv-shows/${id}/season/${season.season_number}`} className="flex items-center gap-4 p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-colors group relative overflow-hidden">
                      {/* Progress bar background */}
                      <div className="absolute bottom-0 left-0 h-1 bg-gray-700 w-full">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${seasonPercent}%` }} />
                      </div>
                      <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-800 relative">
                        <img src={season.poster_path ? `${TMDB_IMG}/w200${season.poster_path}` : poster} alt={season.name} className="w-full h-full object-cover" />
                        {seasonPercent === 100 && (
                          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400 fill-green-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-400">{season.name}</h3>
                        <p className="text-sm text-gray-400">{season.episode_count} episodes</p>
                        {season.air_date && <p className="text-sm text-gray-400">{new Date(season.air_date).getFullYear()}</p>}
                        {watchedCount > 0 && (
                          <p className="text-xs text-green-400 mt-1">{watchedCount}/{season.episode_count} vus ({seasonPercent}%)</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Cast */}
            {show.credits?.cast?.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Casting</h2>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {show.credits.cast.slice(0, 12).map(p => (
                    <Link key={p.id} to={`/actors/${p.id}`} className="flex-shrink-0 w-20 text-center group">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 mb-2"><img src={p.profile_path ? `${TMDB_IMG}/w200${p.profile_path}` : 'https://placehold.co/200x200/333/ccc?text=?'} alt={p.name} className="w-full h-full object-cover" /></div>
                      <p className="text-xs font-medium text-white group-hover:text-blue-400 line-clamp-2">{p.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {similar.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Series similaires</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">{similar.map(s => <div key={s.id} className="flex-shrink-0 w-36"><ContentCard item={s} type="tv" /></div>)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showStream && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowStream(false)}>
          <div className="w-full max-w-5xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-800"><h3 className="text-white font-medium truncate">Streaming - {show.name}</h3><button onClick={() => setShowStream(false)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="aspect-video"><iframe src={streamUrl} title={show.name} className="w-full h-full" allowFullScreen /></div>
          </div>
        </div>
      )}
      {showDownload && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowDownload(false)}>
          <div className="w-full max-w-5xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-800"><h3 className="text-white font-medium truncate">Telechargement - {show.name}</h3><button onClick={() => setShowDownload(false)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="aspect-video"><iframe src={downloadUrl} title={show.name} className="w-full h-full" allowFullScreen /></div>
          </div>
        </div>
      )}
      {showTrailer && getTrailerUrl() && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-5xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-800"><h3 className="text-white font-medium truncate">Bande-annonce - {show.name}</h3><button onClick={() => setShowTrailer(false)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="aspect-video"><iframe src={getTrailerUrl()} title={show.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" /></div>
          </div>
        </div>
      )}
    </div>
  );
}
