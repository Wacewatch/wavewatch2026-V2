import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/Loading';
import { Play, Calendar, Clock, Star, Eye, EyeOff, Lock } from 'lucide-react';

export default function SeasonDetailPage({ isAnime = false }) {
  const { id, seasonNumber } = useParams();
  const { user } = useAuth();
  const [season, setSeason] = useState(null);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedEps, setWatchedEps] = useState(new Set());

  useEffect(() => {
    Promise.all([
      API.get(`/api/tmdb/tv/${id}/season/${seasonNumber}`),
      API.get(`/api/tmdb/tv/${id}`)
    ]).then(([seasonRes, showRes]) => {
      setSeason(seasonRes.data);
      setShow(showRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
    if (user) {
      API.get(`/api/user/tv-progress/${id}`).then(({ data }) => {
        const eps = data.watched_episodes || {};
        const s = new Set();
        Object.entries(eps).forEach(([k, v]) => { if (k.startsWith(`${seasonNumber}-`)) s.add(parseInt(k.split('-')[1])); });
        setWatchedEps(s);
      }).catch(() => {});
    }
  }, [id, seasonNumber, user]);

  if (loading) return <LoadingSpinner />;
  if (!season) return <div className="container mx-auto px-4 py-12 text-center">Saison non trouvee</div>;

  const basePath = isAnime ? 'anime' : 'tv-shows';
  const today = new Date().toISOString().split('T')[0];
  const antiSpoiler = user?.hide_spoilers;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="season-detail-page">
      <div className="mb-6">
        <Link to={`/${basePath}/${id}`} className="text-blue-400 hover:underline text-sm mb-2 block">&larr; Retour a {show?.name}</Link>
        <div className="flex items-center gap-4">
          {season.poster_path && (
            <img src={`${TMDB_IMG}/w185${season.poster_path}`} alt={season.name} className="w-24 h-36 rounded-lg object-cover flex-shrink-0" />
          )}
          <div>
            <h1 className="text-3xl font-bold">{season.name}</h1>
            <p className="text-muted-foreground mt-1">{show?.name} - {season.episodes?.length || 0} episodes</p>
            {season.overview && <p className="text-muted-foreground mt-2 text-sm">{season.overview}</p>}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {season.episodes?.map(ep => {
          const epWatched = watchedEps.has(ep.episode_number);
          const isAired = ep.air_date && ep.air_date <= today;
          const isSpoiler = antiSpoiler && !epWatched && isAired;

          return (
            <Link key={ep.id} to={`/${basePath}/${id}/season/${seasonNumber}/episode/${ep.episode_number}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
              <div className="w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                {ep.still_path ? (
                  <img src={`${TMDB_IMG}/w300${ep.still_path}`} alt={ep.name} className={`w-full h-full object-cover ${isSpoiler ? 'blur-lg scale-110' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-muted-foreground" /></div>
                )}
                {isSpoiler && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Lock className="w-5 h-5 text-white/70" />
                  </div>
                )}
                {epWatched && (
                  <div className="absolute bottom-1 right-1">
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><Eye className="w-3 h-3 text-white" /></span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium group-hover:text-blue-400 transition-colors">Episode {ep.episode_number} : {isSpoiler ? '???' : ep.name}</h3>
                  {isAired ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Disponible</span>
                  ) : ep.air_date ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">A venir</span>
                  ) : null}
                  {epWatched && <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/20 text-green-400">Vu</span>}
                </div>
                {isSpoiler ? (
                  <p className="text-sm text-amber-400/70 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" />Anti-spoiler actif</p>
                ) : ep.overview ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ep.overview}</p>
                ) : null}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {ep.runtime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ep.runtime} min</span>}
                  {ep.air_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ep.air_date).toLocaleDateString('fr-FR')}</span>}
                  {ep.vote_average > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{ep.vote_average.toFixed(1)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
