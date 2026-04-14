import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Play, Download, Star, Calendar, Clock } from 'lucide-react';

export default function EpisodeDetailPage({ isAnime = false }) {
  const { id, seasonNumber, episodeNumber } = useParams();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStream, setShowStream] = useState(false);

  useEffect(() => {
    API.get(`/api/tmdb/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`).then(({ data }) => setEpisode(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id, seasonNumber, episodeNumber]);

  if (loading) return <LoadingSpinner />;
  if (!episode) return <div className="container mx-auto px-4 py-12 text-center">Episode non trouve</div>;

  const basePath = isAnime ? 'anime' : 'tv-shows';
  const streamUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${id}-s${seasonNumber}-e${episodeNumber}`;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="episode-detail-page">
      <Link to={`/${basePath}/${id}/season/${seasonNumber}`} className="text-blue-400 hover:underline text-sm mb-4 block">&larr; Retour a la saison {seasonNumber}</Link>
      {episode.still_path && (
        <div className="aspect-video max-w-3xl rounded-xl overflow-hidden mb-6 bg-muted">
          <img src={`${TMDB_IMG}/original${episode.still_path}`} alt={episode.name} className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2">S{seasonNumber}E{episodeNumber} : {episode.name}</h1>
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
        {episode.vote_average > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{episode.vote_average.toFixed(1)}/10</span>}
        {episode.air_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(episode.air_date).toLocaleDateString('fr-FR')}</span>}
        {episode.runtime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{episode.runtime} min</span>}
      </div>
      {episode.overview && <p className="text-lg text-muted-foreground leading-relaxed mb-6">{episode.overview}</p>}
      <div className="flex gap-3">
        <button onClick={() => setShowStream(true)} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2"><Play className="w-5 h-5" />Regarder</button>
      </div>
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
