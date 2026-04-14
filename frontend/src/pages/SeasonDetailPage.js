import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Play } from 'lucide-react';

export default function SeasonDetailPage({ isAnime = false }) {
  const { id, seasonNumber } = useParams();
  const [season, setSeason] = useState(null);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/api/tmdb/tv/${id}/season/${seasonNumber}`),
      API.get(`/api/tmdb/tv/${id}`)
    ]).then(([seasonRes, showRes]) => {
      setSeason(seasonRes.data);
      setShow(showRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, seasonNumber]);

  if (loading) return <LoadingSpinner />;
  if (!season) return <div className="container mx-auto px-4 py-12 text-center">Saison non trouvee</div>;

  const basePath = isAnime ? 'anime' : 'tv-shows';

  return (
    <div className="container mx-auto px-4 py-8" data-testid="season-detail-page">
      <div className="mb-6">
        <Link to={`/${basePath}/${id}`} className="text-blue-400 hover:underline text-sm mb-2 block">&larr; Retour a {show?.name}</Link>
        <h1 className="text-3xl font-bold">{season.name}</h1>
        {season.overview && <p className="text-muted-foreground mt-2">{season.overview}</p>}
      </div>
      <div className="space-y-3">
        {season.episodes?.map(ep => (
          <Link key={ep.id} to={`/${basePath}/${id}/season/${seasonNumber}/episode/${ep.episode_number}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {ep.still_path ? <img src={`${TMDB_IMG}/w300${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-muted-foreground" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium group-hover:text-blue-400 transition-colors">Episode {ep.episode_number} : {ep.name}</h3>
              {ep.overview && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ep.overview}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {ep.runtime && <span>{ep.runtime} min</span>}
                {ep.air_date && <span>{new Date(ep.air_date).toLocaleDateString('fr-FR')}</span>}
                {ep.vote_average > 0 && <span>Note: {ep.vote_average.toFixed(1)}/10</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
