import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Star, Calendar, Play, Heart, CheckCircle, Eye, EyeOff, SkipForward, Tv, Bell, BellOff, Download, Youtube, Shuffle, RotateCcw, CalendarClock, Trophy, Clock } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import LikeDislike from '../components/LikeDislike';
import { LoadingSpinner } from '../components/Loading';
import IframeModal from '../components/IframeModal';

function formatRelativeAirDate(airDate) {
  if (!airDate) return null;
  const target = new Date(airDate + 'T00:00:00');
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return 'disponible maintenant';
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  if (days < 7) return `dans ${days} jours`;
  if (days < 30) return `dans ${Math.ceil(days / 7)} semaines`;
  return `dans ${Math.ceil(days / 30)} mois`;
}

function ResumeWidget({ show, state, basePath }) {
  const { kind, last, next, nextAir } = state;
  const navigate = useNavigate();
  const goEp = (s, e) => navigate(`/${basePath}/${show.id}/season/${s}/episode/${e}`);

  // Common: card showing last watched
  const lastCard = last && (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-7 h-7 text-green-400 fill-green-400/20" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Dernier épisode vu</p>
        <p className="font-semibold text-white truncate">Saison {last.season} · Épisode {last.episode}</p>
      </div>
    </div>
  );

  if (kind === 'next-episode' || kind === 'next-season') {
    const isNewSeason = kind === 'next-season';
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-900 p-4 md:p-5" data-testid="resume-widget">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {lastCard}
          <div className="hidden lg:block w-px h-12 bg-emerald-500/20" />
          <div className="flex-1 flex flex-wrap gap-2">
            <button
              onClick={() => goEp(last.season, last.episode)}
              className="px-4 py-2.5 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 text-sm"
              data-testid="resume-rewatch-btn"
            >
              <RotateCcw className="w-4 h-4" />Revoir S{last.season}E{last.episode}
            </button>
            <button
              onClick={() => goEp(next.season, next.episode)}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/25"
              data-testid="resume-next-btn"
            >
              {isNewSeason ? <SkipForward className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isNewSeason ? `Commencer la saison ${next.season}` : `Voir l'épisode suivant (S${next.season}E${next.episode})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'finished') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-gray-900 to-gray-900 p-4 md:p-5" data-testid="resume-widget">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {lastCard}
          <div className="hidden lg:block w-px h-12 bg-amber-500/20" />
          <div className="flex-1 flex items-start gap-3">
            <Trophy className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-amber-300">Vous êtes au bout de la série</p>
              <p className="text-sm text-muted-foreground">{show.status === 'Canceled' ? 'La série a été annulée — il n\'y aura pas de suite.' : 'La série est terminée — bravo, vous avez tout vu !'}</p>
            </div>
            <button
              onClick={() => goEp(last.season, last.episode)}
              className="ml-auto px-3 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-2 text-sm flex-shrink-0"
              data-testid="resume-rewatch-btn"
            >
              <RotateCcw className="w-4 h-4" />Revoir
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'wait') {
    const rel = formatRelativeAirDate(nextAir.air_date);
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-gray-900 p-4 md:p-5" data-testid="resume-widget">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {lastCard}
          <div className="hidden lg:block w-px h-12 bg-cyan-500/20" />
          <div className="flex-1 flex items-start gap-3">
            <CalendarClock className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-cyan-300">Prochain épisode pas encore sorti</p>
              <p className="text-sm text-muted-foreground">
                S{nextAir.season_number}E{nextAir.episode_number}
                {nextAir.name ? ` · ${nextAir.name}` : ''} — diffusion le {new Date(nextAir.air_date).toLocaleDateString('fr-FR')}
                {rel ? ` (${rel})` : ''}.
              </p>
            </div>
            <button
              onClick={() => goEp(last.season, last.episode)}
              className="ml-auto px-3 py-2 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-colors flex items-center gap-2 text-sm flex-shrink-0"
              data-testid="resume-rewatch-btn"
            >
              <RotateCcw className="w-4 h-4" />Revoir le dernier
            </button>
          </div>
        </div>
      </div>
    );
  }

  // wait-unknown
  return (
    <div className="rounded-xl border border-gray-600/40 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 p-4 md:p-5" data-testid="resume-widget">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {lastCard}
        <div className="hidden lg:block w-px h-12 bg-gray-700" />
        <div className="flex-1 flex items-start gap-3">
          <Clock className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-200">Vous êtes à jour</p>
            <p className="text-sm text-muted-foreground">La série est toujours en cours, mais aucune date pour le prochain épisode n'a encore été annoncée.</p>
          </div>
          <button
            onClick={() => goEp(last.season, last.episode)}
            className="ml-auto px-3 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition-colors flex items-center gap-2 text-sm flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />Revoir
          </button>
        </div>
      </div>
    </div>
  );
}

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
    API.get(`/api/tmdb/tv/${id}/images`)
      .then(({ data }) => {
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
      if (isWatched) {
        await API.delete(`/api/user/history/${id}/tv`);
        setIsWatched(false);
        toast({ title: 'Retire du vu' });
      } else {
        await API.post('/api/user/history', { content_id: parseInt(id), content_type: 'tv', title: show.name, poster_path: show.poster_path });
        setIsWatched(true);
        toast({ title: 'Marque comme vu' });
      }
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

  // Compute the "next step" for the user based on watched_episodes + show.seasons
  // Returns { kind: 'rewatch'|'next-episode'|'next-season'|'finished'|'wait', ... }
  const getResumeState = () => {
    if (!show || !show.seasons) return null;
    const realSeasons = show.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
    if (realSeasons.length === 0) return null;

    // Find last watched (highest season, then highest episode within)
    let lastSeason = null, lastEpisode = null;
    realSeasons.forEach(s => {
      const seasonEps = watchedEpisodes[String(s.season_number)] || {};
      Object.entries(seasonEps).forEach(([epNum, isW]) => {
        if (isW) {
          const sn = s.season_number;
          const en = parseInt(epNum);
          if (lastSeason === null || sn > lastSeason || (sn === lastSeason && en > lastEpisode)) {
            lastSeason = sn; lastEpisode = en;
          }
        }
      });
    });

    if (lastSeason === null) return { kind: 'start', firstSeason: realSeasons[0].season_number };

    // Determine next episode
    const currentSeason = realSeasons.find(s => s.season_number === lastSeason);
    const currentSeasonEpCount = currentSeason?.episode_count || 0;

    // Case 1: there's a next episode in same season
    if (lastEpisode < currentSeasonEpCount) {
      return {
        kind: 'next-episode',
        last: { season: lastSeason, episode: lastEpisode },
        next: { season: lastSeason, episode: lastEpisode + 1 },
      };
    }

    // Case 2: there's a next season available
    const nextSeason = realSeasons.find(s => s.season_number > lastSeason);
    if (nextSeason) {
      return {
        kind: 'next-season',
        last: { season: lastSeason, episode: lastEpisode },
        next: { season: nextSeason.season_number, episode: 1 },
      };
    }

    // Case 3: no next season locally — check show status
    // Show ended/canceled → finished
    if (show.status === 'Ended' || show.status === 'Canceled') {
      return { kind: 'finished', last: { season: lastSeason, episode: lastEpisode } };
    }

    // Show still running → check next_episode_to_air
    if (show.next_episode_to_air?.air_date) {
      return {
        kind: 'wait',
        last: { season: lastSeason, episode: lastEpisode },
        nextAir: show.next_episode_to_air,
      };
    }

    // Returning series but no scheduled episode info
    return { kind: 'wait-unknown', last: { season: lastSeason, episode: lastEpisode } };
  };

  const resumeState = getResumeState();

  // Episode aleatoire (saison aleatoire + episode aleatoire)
  const [loadingRandom, setLoadingRandom] = useState(false);
  const handleRandomEpisode = async () => {
    if (!show?.seasons?.length) return;
    setLoadingRandom(true);
    try {
      // Filter out season 0 (specials) unless it's the only one
      const realSeasons = show.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
      const pool = realSeasons.length > 0 ? realSeasons : show.seasons.filter(s => s.episode_count > 0);
      if (pool.length === 0) { toast({ title: 'Aucun episode disponible', variant: 'destructive' }); return; }
      const randomSeason = pool[Math.floor(Math.random() * pool.length)];
      // Fetch that season to get real episode list
      const { data: seasonData } = await API.get(`/api/tmdb/tv/${id}/season/${randomSeason.season_number}`);
      const eps = seasonData?.episodes || [];
      if (eps.length === 0) { toast({ title: 'Saison vide', variant: 'destructive' }); return; }
      const randomEp = eps[Math.floor(Math.random() * eps.length)];
      const basePath = window.location.pathname.includes('/anime/') ? 'anime' : 'tv-shows';
      navigate(`/${basePath}/${id}/season/${randomSeason.season_number}/episode/${randomEp.episode_number}`);
    } catch {
      toast({ title: 'Erreur lors de la selection aleatoire', variant: 'destructive' });
    } finally {
      setLoadingRandom(false);
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
  const streamUrl = `https://wwembed.wavewatch.top/api/v1/streaming/ww-tv-${id}`;
  const downloadUrl = `https://wwembed.wavewatch.top/api/v1/download/ww-tv-${id}`;
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
              <button onClick={() => { setShowStream(true); if (user?.auto_mark_watched !== false && !isWatched) markAsWatched(); }} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2"><Play className="w-5 h-5" />Regarder</button>
              <button onClick={handleRandomEpisode} disabled={loadingRandom} className="px-5 py-2.5 rounded-lg border border-purple-600 text-purple-400 hover:bg-purple-900/20 flex items-center gap-2 disabled:opacity-60" data-testid="random-episode-btn" title="Episode aleatoire">
                <Shuffle className={`w-5 h-5 ${loadingRandom ? 'animate-spin' : ''}`} />Aleatoire
              </button>
              <button onClick={() => setShowDownload(true)} className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-400 hover:bg-blue-900/20 flex items-center gap-2"><Download className="w-5 h-5" />Telecharger</button>
              <button onClick={() => setShowTrailer(true)} className="px-5 py-2.5 rounded-lg border border-orange-600 text-orange-400 hover:bg-orange-900/20 flex items-center gap-2"><Youtube className="w-5 h-5" />Bande-annonce</button>
              <button onClick={toggleFavorite} className={`px-5 py-2.5 rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 ${isFavorite ? 'bg-yellow-900/20' : ''}`}>
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />Favoris
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
            
            {/* Reprendre / Continuer (Continue Watching widget) */}
            {user && resumeState && resumeState.kind !== 'start' && (
              <ResumeWidget show={show} state={resumeState} basePath="tv-shows" />
            )}

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
        <IframeModal src={streamUrl} title={`Streaming - ${show.name}`} onClose={() => setShowStream(false)} />
      )}
      {showDownload && (
        <IframeModal src={downloadUrl} title={`Telechargement - ${show.name}`} onClose={() => setShowDownload(false)} />
      )}
      {showTrailer && getTrailerUrl() && (
        <IframeModal src={getTrailerUrl()} title={`Bande-annonce - ${show.name}`} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
}
