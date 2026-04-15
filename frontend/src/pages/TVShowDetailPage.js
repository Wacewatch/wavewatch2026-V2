import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG, TMDB_API_KEY } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Star, Calendar, Play, Download, Youtube, Heart, Shuffle, CheckCircle } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { LoadingSpinner } from '../components/Loading';

export default function TVShowDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [show, setShow] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

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

  if (loading) return <LoadingSpinner />;
  if (!show) return <div className="container mx-auto px-4 py-12 text-center">Serie non trouvee</div>;

  const poster = show.poster_path ? `${TMDB_IMG}/w500${show.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Image';
  const backdrop = show.backdrop_path ? `${TMDB_IMG}/original${show.backdrop_path}` : '';
  const streamUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${id}`;
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
            <p className="text-base md:text-xl text-gray-200 leading-relaxed">{show.overview}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowStream(true)} className="px-5 py-2.5 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/20 flex items-center gap-2"><Play className="w-5 h-5" />Regarder</button>
              <button onClick={toggleFavorite} className={`px-5 py-2.5 rounded-lg border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 ${isFavorite ? 'bg-yellow-900/20' : ''}`}>
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />Favoris
              </button>
              <button onClick={markAsWatched} className={`px-5 py-2.5 rounded-lg border border-cyan-600 text-cyan-400 hover:bg-cyan-900/20 flex items-center gap-2 transition-colors ${isWatched ? 'bg-cyan-900/20' : ''}`} data-testid="watched-btn">
                <CheckCircle className={`w-5 h-5 ${isWatched ? 'fill-cyan-500' : ''}`} />{isWatched ? 'Vu' : 'Marquer vu'}
              </button>
              <AddToPlaylistButton contentId={parseInt(id)} contentType="tv" title={show.name} posterPath={show.poster_path} />
            </div>
            {/* Seasons */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Saisons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {show.seasons?.filter(s => s.season_number > 0).map(season => (
                  <Link key={season.id} to={`/tv-shows/${id}/season/${season.season_number}`} className="flex items-center gap-4 p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-colors group">
                    <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                      <img src={season.poster_path ? `${TMDB_IMG}/w200${season.poster_path}` : poster} alt={season.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400">{season.name}</h3>
                      <p className="text-sm text-gray-400">{season.episode_count} episodes</p>
                      {season.air_date && <p className="text-sm text-gray-400">{new Date(season.air_date).getFullYear()}</p>}
                    </div>
                  </Link>
                ))}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{similar.map(s => <ContentCard key={s.id} item={s} type="tv" />)}</div>
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
    </div>
  );
}
