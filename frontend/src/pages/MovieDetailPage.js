import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG, TMDB_API_KEY } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Star, Calendar, Clock, Play, Download, Youtube, ThumbsUp, ThumbsDown, Heart, Eye, User } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import { LoadingSpinner } from '../components/Loading';

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/tmdb/movie/${id}`).then(({ data }) => {
      setMovie(data);
      if (data.belongs_to_collection) {
        API.get(`/api/tmdb/collection/${data.belongs_to_collection.id}`).then(({ data: c }) => setCollection(c)).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
    API.get(`/api/tmdb/similar/movies/${id}`).then(({ data }) => setSimilar((data.results || []).slice(0, 12))).catch(() => {});
    // Fetch logo
    fetch(`https://api.themoviedb.org/3/movie/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=fr,en,null`)
      .then(r => r.json()).then(data => {
        const logo = data.logos?.find(l => l.iso_639_1 === 'fr') || data.logos?.find(l => l.iso_639_1 === 'en') || data.logos?.[0];
        if (logo?.file_path) setLogoUrl(`${TMDB_IMG}/original${logo.file_path}`);
      }).catch(() => {});
    if (user) {
      API.get(`/api/user/favorites/check?content_id=${id}&content_type=movie`).then(({ data }) => setIsFavorite(data.is_favorite)).catch(() => {});
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      const { data } = await API.post('/api/user/favorites', { content_id: parseInt(id), content_type: 'movie', title: movie.title, poster_path: movie.poster_path });
      setIsFavorite(data.is_favorite);
      toast({ title: data.is_favorite ? 'Ajoute aux favoris' : 'Retire des favoris' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const director = movie?.credits?.crew?.find(p => p.job === 'Director');
  const streamUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-movie-${id}`;
  const downloadUrl = `https://wwembed.wavewatch.xyz/api/v1/download/ww-movie-${id}`;

  const getTrailerUrl = () => {
    const trailer = movie?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || movie?.videos?.results?.find(v => v.site === 'YouTube');
    return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
  };

  if (loading) return <LoadingSpinner />;
  if (!movie) return <div className="container mx-auto px-4 py-12 text-center">Film non trouve</div>;

  const poster = movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Image';
  const backdrop = movie.backdrop_path ? `${TMDB_IMG}/original${movie.backdrop_path}` : '';

  return (
    <div className="min-h-screen bg-black" data-testid="movie-detail-page">
      {/* Hero */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {backdrop && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdrop})` }}>
          <div className="absolute inset-0 bg-black/60" /><div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>}
      </div>
      <div className="container mx-auto px-4 -mt-16 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden shadow-2xl">
              <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            {logoUrl ? (
              <img src={logoUrl} alt={movie.title} className="h-16 md:h-24 w-auto object-contain" />
            ) : (
              <h1 className="text-2xl md:text-5xl font-bold text-white">{movie.title}</h1>
            )}
            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              <div className="flex items-center gap-1.5"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /><span className="text-lg font-medium">{movie.vote_average?.toFixed(1)}/10</span></div>
              <div className="flex items-center gap-1.5"><Calendar className="w-5 h-5" /><span>{new Date(movie.release_date).getFullYear()}</span></div>
              {movie.runtime && <div className="flex items-center gap-1.5"><Clock className="w-5 h-5" /><span>{movie.runtime} min</span></div>}
            </div>
            {director && (
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-5 h-5" /><span>Realise par</span>
                <Link to={`/directors/${director.id}`} className="text-blue-400 hover:text-blue-300 font-medium">{director.name}</Link>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map(g => (
                <Link key={g.id} to={`/movies?genre=${g.id}`} className="px-3 py-1 text-sm rounded-full bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors">{g.name}</Link>
              ))}
            </div>
            <p className="text-base md:text-xl text-gray-200 leading-relaxed">{movie.overview}</p>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowStream(true)} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors" data-testid="watch-btn"><Play className="w-5 h-5" />Regarder</button>
              <button onClick={() => setShowDownload(true)} className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-400 hover:bg-blue-900/20 flex items-center gap-2 transition-colors" data-testid="download-btn"><Download className="w-5 h-5" />Telecharger</button>
              <button onClick={() => setShowTrailer(true)} className="px-5 py-2.5 rounded-lg border border-orange-600 text-orange-400 hover:bg-orange-900/20 flex items-center gap-2 transition-colors"><Youtube className="w-5 h-5" />Bande-annonce</button>
              <button onClick={toggleFavorite} className={`px-5 py-2.5 rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 transition-colors ${isFavorite ? 'bg-yellow-900/20' : ''}`} data-testid="favorite-btn">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />Favoris
              </button>
            </div>
            {/* Cast */}
            {movie.credits?.cast?.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Casting</h2>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {movie.credits.cast.slice(0, 12).map(p => (
                    <Link key={p.id} to={`/actors/${p.id}`} className="flex-shrink-0 w-20 text-center group">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 mb-2">
                        <img src={p.profile_path ? `${TMDB_IMG}/w200${p.profile_path}` : 'https://placehold.co/200x200/333/ccc?text=?'} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-blue-400">{p.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{p.character}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Collection */}
            {collection?.parts?.length > 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Saga : {collection.name}</h2>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {collection.parts.sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0)).map(cm => (
                    <Link key={cm.id} to={`/movies/${cm.id}`} className="flex-shrink-0 w-36 group">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800"><img src={cm.poster_path ? `${TMDB_IMG}/w300${cm.poster_path}` : 'https://placehold.co/300x450/333/ccc'} alt={cm.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {cm.id === parseInt(id) && <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Actuel</div>}
                      </div>
                      <p className="text-sm font-medium mt-2 text-white line-clamp-2 group-hover:text-blue-400">{cm.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Similar */}
            {similar.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Films similaires</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {similar.map(s => <ContentCard key={s.id} item={s} type="movie" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modals */}
      {showStream && <IframeModal src={streamUrl} title={`Streaming - ${movie.title}`} onClose={() => setShowStream(false)} />}
      {showDownload && <IframeModal src={downloadUrl} title={`Telechargement - ${movie.title}`} onClose={() => setShowDownload(false)} />}
      {showTrailer && <IframeModal src={getTrailerUrl()} title={`Bande-annonce - ${movie.title}`} onClose={() => setShowTrailer(false)} />}
    </div>
  );
}

function IframeModal({ src, title, onClose }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose} data-testid="iframe-modal">
      <div className="w-full max-w-5xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <h3 className="text-white font-medium truncate">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        <div className="aspect-video"><iframe src={src} title={title} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" /></div>
      </div>
    </div>
  );
}
