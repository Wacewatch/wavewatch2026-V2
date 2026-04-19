import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import { Star, Play, ChevronLeft, ChevronRight, Crown, Trophy, Calendar as CalIcon, Tv, Film, Shuffle, Radio, Gamepad2, Users, Sparkles, X } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import ContentGrid from '../components/ContentGrid';
import InfoBanner from '../components/InfoBanner';
import DownloadLinksRow from '../components/DownloadLinksRow';
import { LoadingGrid } from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';

function Hero() {
  const [movies, setMovies] = useState([]);
  const [idx, setIdx] = useState(0);
  const [logos, setLogos] = useState({});

  useEffect(() => {
    API.get('/api/tmdb/trending/movies').then(({ data }) => {
      if (data.results?.length) {
        const top5 = data.results.slice(0, 5);
        setMovies(top5);
        // Fetch logos for each movie
        top5.forEach(m => {
          API.get(`/api/tmdb/movie/${m.id}/images`)
            .then(({ data: d }) => {
              const logo = d.logos?.find(l => l.iso_639_1 === 'fr') || d.logos?.find(l => l.iso_639_1 === 'en') || d.logos?.[0];
              if (logo?.file_path) setLogos(prev => ({ ...prev, [m.id]: `${TMDB_IMG}/w500${logo.file_path}` }));
            }).catch(() => {});
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (movies.length > 0) {
      const iv = setInterval(() => setIdx(p => (p + 1) % movies.length), 8000);
      return () => clearInterval(iv);
    }
  }, [movies.length]);

  const m = movies[idx];
  if (!m) return null;
  const logoUrl = logos[m.id];

  return (
    <Link to={`/movies/${m.id}`} className="block" data-testid="hero-section">
      <div className="relative h-[35vh] md:h-[63vh] overflow-hidden cursor-pointer group">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${TMDB_IMG}/original${m.backdrop_path})` }}>
          <div className="absolute inset-0 bg-black/60 md:bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="w-full">
            <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto text-center">
              {logoUrl ? (
                <img src={logoUrl} alt={m.title} className="h-20 md:h-36 lg:h-44 w-auto object-contain mx-auto drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }} />
              ) : (
                <h1 className="text-2xl md:text-6xl lg:text-7xl font-bold text-white leading-tight" style={{ textShadow: '0 0 20px rgba(0,0,0,0.9)' }}>{m.title}</h1>
              )}
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 bg-yellow-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-yellow-500/30">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-100">{m.vote_average?.toFixed(1)}</span>
                </div>
                <span className="text-sm font-medium text-gray-200 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">{new Date(m.release_date).getFullYear()}</span>
              </div>
              <p className="text-sm md:text-xl text-white/95 leading-relaxed line-clamp-3 mx-auto" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)', maxWidth: '800px' }}>{m.overview}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 w-full flex justify-center space-x-2 z-20">
          {movies.map((_, i) => (
            <button key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'bg-white w-8' : 'bg-gray-500 w-2'}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setIdx(i); }} />
          ))}
        </div>
      </div>
    </Link>
  );
}

function ContentRow({ title, endpoint, type = 'movie', isAnime = false, link }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(endpoint).then(({ data }) => {
      setItems((data.results || []).slice(0, 12));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) return <div className="space-y-4"><h2 className="text-xl font-bold">{title}</h2><LoadingGrid count={6} /></div>;
  if (!items.length) return null;

  return (
    <ContentGrid title={title} link={link}>
      {items.map(item => <ContentCard key={item.id} item={item} type={type} isAnime={isAnime} />)}
    </ContentGrid>
  );
}

function TrendingActorsRow() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/tmdb/popular/persons').then(({ data }) => setActors((data.results || []).slice(0, 20))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><h2 className="text-xl font-bold">Acteurs Tendance</h2><LoadingGrid count={6} /></div>;
  if (!actors.length) return null;

  return (
    <ContentGrid title="Acteurs Tendance" link="/actors" icon={<Users className="w-5 h-5 text-blue-400" />}>
      {actors.map(a => (
        <Link key={a.id} to={`/actors/${a.id}`} className="block group" data-testid={`actor-${a.id}`}>
          <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
            <div className="aspect-[2/3] overflow-hidden">
              <img src={a.profile_path ? `${TMDB_IMG}/w300${a.profile_path}` : 'https://placehold.co/300x450/333/ccc?text=?'} alt={a.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5">
              <p className="text-sm font-medium truncate group-hover:text-blue-400">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.known_for_department === 'Acting' ? 'Acteur' : a.known_for_department}</p>
            </div>
          </div>
        </Link>
      ))}
    </ContentGrid>
  );
}

function TrendingTVChannelsRow() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  useEffect(() => {
    API.get('/api/tv-channels').then(({ data }) => {
      const shuffled = (data.channels || []).sort(() => Math.random() - 0.5);
      setChannels(shuffled);
    }).catch(() => {});
  }, []);

  if (!channels.length) return null;

  return (
    <>
      <ContentGrid title="Chaines TV" link="/tv-channels" icon={<Tv className="w-5 h-5 text-green-400" />}>
        {channels.map(ch => (
          <div key={ch.id || ch._id || ch.name} onClick={() => setSelectedChannel(ch)} className="cursor-pointer group" data-testid={`home-channel-${ch.name}`}>
            <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                {(ch.logo || ch.logo_url) ? (
                  <img src={ch.logo || ch.logo_url} alt={ch.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; const fb = e.target.parentElement.querySelector('[data-fallback]'); if(fb) fb.style.display = 'flex'; }} />
                ) : null}
                <div data-fallback className={`${(ch.logo || ch.logo_url) ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-gradient-to-br from-blue-800/50 to-purple-800/50`}>
                  <Tv className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-2.5 text-center">
                <p className="text-sm font-medium truncate group-hover:text-green-400">{ch.name}</p>
                <p className="text-xs text-muted-foreground">{ch.category}</p>
              </div>
            </div>
          </div>
        ))}
      </ContentGrid>
      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedChannel(null)}>
          <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold">{selectedChannel.name}</h3>
              <button onClick={() => setSelectedChannel(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="aspect-video bg-black">
              {selectedChannel.stream_url ? (
                <iframe src={selectedChannel.stream_url} title={selectedChannel.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500"><Tv className="w-16 h-16 mb-3" /><p>Aucun flux disponible</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PopularCollectionsRow() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const queries = ['Marvel', 'Star Wars', 'Harry Potter', 'Fast Furious', 'Jurassic', 'Batman', 'X-Men', 'Mission Impossible', 'Toy Story', 'Pirates Caribbean', 'Alien', 'Hunger Games', 'Transformers', 'John Wick', 'The Avengers', 'Spider-Man'];

  useEffect(() => {
    Promise.all(queries.map(q => API.get(`/api/tmdb/collections/search?q=${q}`).then(({ data }) => data.results?.[0]).catch(() => null)))
      .then(results => setCollections(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !collections.length) return null;

  return (
    <ContentGrid title="Collections Populaires" link="/collections">
      {collections.map(c => (
        <Link key={c.id} to={`/collections/${c.id}`} className="group" data-testid={`collection-${c.id}`}>
          <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
            <div className="relative aspect-[2/3]">
              {c.poster_path ? (
                <img src={`${TMDB_IMG}/w300${c.poster_path}`} alt={c.name} className="w-full h-full object-cover" />
              ) : c.backdrop_path ? (
                <img src={`${TMDB_IMG}/w300${c.backdrop_path}`} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-xs font-bold text-white line-clamp-2">{c.name}</p>
            </div>
          </div>
        </Link>
      ))}
    </ContentGrid>
  );
}

function PublicPlaylistsRow() {
  const [playlists, setPlaylists] = useState([]);
  useEffect(() => {
    API.get('/api/playlists/public/enhanced').then(({ data }) => setPlaylists(data.playlists || [])).catch(() => {
      API.get('/api/playlists/public/discover').then(({ data }) => setPlaylists(data.playlists || [])).catch(() => {});
    });
  }, []);

  if (!playlists.length) return null;

  const colors = ['from-blue-600 to-purple-600', 'from-pink-600 to-red-600', 'from-green-600 to-teal-600', 'from-orange-600 to-yellow-600', 'from-indigo-600 to-blue-600', 'from-purple-600 to-pink-600'];

  return (
    <div data-testid="public-playlists-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Playlists de la Communaute</h2>
        <Link to="/discover/playlists" className="text-sm text-blue-400 hover:underline">Voir tout</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {playlists.slice(0, 6).map((p, i) => (
          <Link key={p._id} to={`/playlists/${p._id}`} className="group">
            <div className="rounded-xl overflow-hidden border border-border bg-card group-hover:border-primary/30 transition-all">
              <div className="aspect-square relative overflow-hidden">
                {p.items?.length > 0 ? (
                  <div className="grid grid-cols-2 h-full">
                    {p.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="overflow-hidden">
                        {item.poster_path ? (
                          <img src={`${TMDB_IMG}/w200${item.poster_path}`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />}
                      </div>
                    ))}
                    {p.items.length < 4 && Array.from({ length: 4 - Math.min(p.items.length, 4) }).map((_, idx) => (
                      <div key={`e-${idx}`} className="bg-gradient-to-br from-gray-800 to-gray-900" />
                    ))}
                  </div>
                ) : (
                  <div className={`h-full bg-gradient-to-br ${p.gradient || colors[i % colors.length]} flex items-center justify-center`}>
                    <Play className="w-8 h-8 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-sm font-bold text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/60">{p.items_count || p.items?.length || 0} elem. - {p.user_info?.username || p.username || 'Anonyme'}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SportsStreamPromo() {
  return (
    <div className="rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-gray-900 via-gray-900 to-red-950/30 overflow-hidden" data-testid="sports-promo">
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
        <div className="w-40 h-40 md:w-52 md:h-52 flex-shrink-0"><img src="https://i.imgur.com/aUOO21x.png" alt="Sports-Stream" className="w-full h-full object-contain drop-shadow-2xl" /></div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white">Sports-Stream <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white align-middle ml-2">by WaveWatch</span></h2>
          <p className="text-muted-foreground italic mt-1">Votre destination ultime pour le streaming sportif</p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Multi-sources</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">+15 Sports</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Sans inscription</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-xl">Profitez d'un streaming multi-sports de haute qualite avec plus de 15 disciplines disponibles. Accedez a plusieurs sources de streaming pour chaque evenement, le tout sans inscription requise.</p>
          <a href="https://sports-stream.sbs/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Acceder au site
          </a>
          <p className="text-xs text-muted-foreground mt-3">Football - Tennis - Basketball - Baseball - Hockey - Et plus encore...</p>
        </div>
      </div>
    </div>
  );
}

function LiveWatchPromo() {
  return (
    <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-r from-gray-900 via-gray-900 to-cyan-950/30 overflow-hidden" data-testid="livewatch-promo">
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
        <div className="w-40 h-40 md:w-52 md:h-52 flex-shrink-0"><img src="https://i.imgur.com/ovX7j6R.png" alt="LiveWatch" className="w-full h-full object-contain drop-shadow-2xl" /></div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white">LiveWatch <span className="text-xs px-2 py-1 rounded-full bg-cyan-500 text-white align-middle ml-2">by WaveWatch</span></h2>
          <p className="text-muted-foreground italic mt-1">Votre plateforme mondiale de streaming TV en direct</p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">17 Pays</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">40 000+ Chaines</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Acces Gratuit</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-xl">Decouvrez plus de 40 000 chaines TV en direct provenant de 17 pays. Profitez de toutes les chaines nationales et payantes sans abonnement, le tout accessible gratuitement et instantanement.</p>
          <div className="flex gap-3 mt-5">
            <a href="https://livewatch.sbs/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Acceder au site
            </a>
            <a href="https://v2.livewatch.sbs/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-cyan-600/50 text-cyan-400 hover:bg-cyan-900/20 font-medium transition-colors text-sm">Serveur de secours</a>
          </div>
          <p className="text-xs text-muted-foreground mt-3">France - Italie - Espagne - Royaume-Uni - Allemagne - Et 12 autres pays...</p>
        </div>
      </div>
    </div>
  );
}

function SubscriptionOffer() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/30 via-orange-900/30 to-red-900/30 p-6 md:p-8" data-testid="subscription-offer">
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3"><Crown className="w-6 h-6 text-yellow-400" /><span className="text-sm font-bold text-yellow-300">OFFRE VIP</span></div>
          <h3 className="text-2xl font-bold mb-2">Devenez VIP et debloquez tout !</h3>
          <p className="text-muted-foreground mb-4">Themes premium, contenu exclusif, priorite sur les demandes, jeu VIP quotidien et bien plus.</p>
          <div className="flex gap-3">
            <Link to="/subscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:from-yellow-400 hover:to-orange-400 transition-all"><Crown className="w-4 h-4" />Devenir VIP</Link>
            <Link to="/vip-game" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-yellow-500/30 text-yellow-400 font-medium hover:bg-yellow-500/10 transition-colors">Jeu VIP gratuit</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Themes exclusifs', 'Sans pub', 'Priorite demandes', 'Badge VIP'].map(f => (
            <div key={f} className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs font-medium">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RandomContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandom = () => {
    setLoading(true);
    const page = Math.floor(Math.random() * 5) + 1;
    const isMovie = Math.random() > 0.5;
    API.get(`/api/tmdb/${isMovie ? 'popular/movies' : 'popular/tv'}?page=${page}`).then(({ data }) => {
      const results = data.results || [];
      if (results.length) setContent({ ...results[Math.floor(Math.random() * results.length)], isMovie });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRandom(); }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="random-content">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-xl font-bold flex items-center gap-2"><Shuffle className="w-5 h-5 text-purple-400" />Contenu Aleatoire</h2>
        <button onClick={fetchRandom} disabled={loading} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2" data-testid="random-refresh">
          <Shuffle className="w-4 h-4" />{loading ? 'Chargement...' : 'Nouveau'}
        </button>
      </div>
      {content && (
        <Link to={`/${content.isMovie ? 'movies' : 'tv-shows'}/${content.id}`} className="flex flex-col md:flex-row gap-4 p-4 group">
          <div className="w-full md:w-48 aspect-[2/3] md:aspect-auto md:h-64 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {content.poster_path && <img src={`${TMDB_IMG}/w300${content.poster_path}`} alt={content.title || content.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {content.isMovie ? <Film className="w-4 h-4 text-red-400" /> : <Tv className="w-4 h-4 text-blue-400" />}
              <span className="text-xs text-muted-foreground">{content.isMovie ? 'Film' : 'Serie'}</span>
              <div className="flex items-center gap-1 ml-auto"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /><span className="text-sm font-medium">{content.vote_average?.toFixed(1)}</span></div>
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{content.title || content.name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-4">{content.overview}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
              <Play className="w-4 h-4" />Voir les details
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}

function CalendarWidgetHome() {
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/api/tmdb/upcoming/movies').catch(() => ({ data: { results: [] } })),
      API.get('/api/tmdb/on-the-air').catch(() => ({ data: { results: [] } }))
    ]).then(async ([moviesRes, tvRes]) => {
      const today = new Date().toISOString().split('T')[0];
      const movies = (moviesRes.data.results || []).filter(m => m.release_date >= today).map(m => ({ ...m, _type: 'movie' }));
      // Pour les series, recuperer les infos de saison/episode
      const tvRaw = (tvRes.data.results || []).slice(0, 10);
      const tvShows = [];
      for (const s of tvRaw) {
        const item = { ...s, title: s.name, release_date: s.first_air_date || today, _type: 'tv', _season: null, _episode: null };
        // Tenter de recuperer les details pour la saison/episode en cours
        try {
          const { data: detail } = await API.get(`/api/tmdb/tv/${s.id}`);
          if (detail.next_episode_to_air) {
            item._season = detail.next_episode_to_air.season_number;
            item._episode = detail.next_episode_to_air.episode_number;
            item._epName = detail.next_episode_to_air.name;
            item.release_date = detail.next_episode_to_air.air_date || item.release_date;
          } else if (detail.last_episode_to_air) {
            item._season = detail.last_episode_to_air.season_number;
            item._episode = detail.last_episode_to_air.episode_number;
          }
          item._totalSeasons = detail.number_of_seasons;
        } catch {}
        tvShows.push(item);
      }
      const combined = [];
      let mi = 0, ti = 0;
      while (combined.length < 20 && (mi < movies.length || ti < tvShows.length)) {
        if (mi < movies.length) combined.push(movies[mi++]);
        if (ti < tvShows.length && combined.length < 20) combined.push(tvShows[ti++]);
      }
      setUpcoming(combined);
    }).catch(() => {});
  }, []);

  if (!upcoming.length) return null;

  return (
    <ContentGrid title="Prochaines Sorties" link="/calendar" icon={<CalIcon className="w-5 h-5 text-blue-400" />}>
      {upcoming.map(m => (
        <Link key={`${m._type}-${m.id}`} to={`/${m._type === 'tv' ? 'tv-shows' : 'movies'}/${m.id}`} className="block group" data-testid={`upcoming-${m._type}-${m.id}`}>
          <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
            <div className="relative aspect-[2/3]">
              {m.poster_path && <img src={`${TMDB_IMG}/w300${m.poster_path}`} alt={m.title} className="w-full h-full object-cover" />}
              {m._type === 'tv' ? (
                <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/90 text-white">
                  {m._season ? `S${m._season} E${m._episode}` : 'Serie'}
                </span>
              ) : (
                <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/90 text-white">Film</span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-sm font-medium truncate group-hover:text-blue-400">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.release_date ? new Date(m.release_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</p>
            </div>
          </div>
        </Link>
      ))}
    </ContentGrid>
  );
}

function VIPGamePromo() {
  return (
    <Link to="/vip-game" className="block" data-testid="vip-game-promo">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-pink-900 to-orange-900 p-6 group hover:shadow-lg hover:shadow-purple-500/20 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/50 group-hover:scale-110 transition-transform">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">Jeu VIP Quotidien</h3>
            <p className="text-white/70 text-sm">Tentez votre chance chaque jour pour gagner le statut VIP gratuitement !</p>
          </div>
          <Play className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function FootballCalendarWidget() {
  const matches = [
    { id: 1, home: 'PSG', away: 'OM', date: '2026-02-15', time: '21:00', league: 'Ligue 1', channel: 'Canal+' },
    { id: 2, home: 'Real Madrid', away: 'Barcelona', date: '2026-02-18', time: '21:00', league: 'La Liga', channel: 'beIN Sports' },
    { id: 3, home: 'Man City', away: 'Liverpool', date: '2026-02-20', time: '20:45', league: 'Premier League', channel: 'RMC Sport' },
    { id: 4, home: 'Bayern', away: 'Dortmund', date: '2026-02-22', time: '18:30', league: 'Bundesliga', channel: 'beIN Sports' },
    { id: 5, home: 'Lyon', away: 'Monaco', date: '2026-02-25', time: '21:00', league: 'Ligue 1', channel: 'DAZN' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="football-calendar">
      <div className="p-4 flex items-center justify-between border-b border-border bg-gradient-to-r from-green-900/30 to-blue-900/30">
        <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-green-400" />Calendrier Football</h2>
        <Link to="/sport" className="text-sm text-blue-400 hover:underline">Voir tout</Link>
      </div>
      <div className="divide-y divide-border">
        {matches.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-3 hover:bg-secondary/50 transition-colors">
            <div className="text-center w-20 flex-shrink-0">
              <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
              <p className="text-sm font-bold">{m.time}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium text-sm">{m.home}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="font-medium text-sm">{m.away}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-800">{m.league}</span>
            <span className="text-xs text-muted-foreground hidden md:block">{m.channel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsRow() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      API.get('/api/user/recommendations').then(({ data }) => setItems(data.recommendations || [])).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || loading || !items.length) return null;

  return (
    <div data-testid="recommendations-section">
      <ContentGrid title="Recommandations pour vous" link="/dashboard" icon={<Sparkles className="w-5 h-5 text-pink-400" />}>
        {items.map(item => <ContentCard key={item.id} item={item} type={item.title ? 'movie' : 'tv'} />)}
      </ContentGrid>
    </div>
  );
}

export default function HomePage() {
  const [modules, setModules] = useState(null);
  const [moduleOrder, setModuleOrder] = useState(null);
  useEffect(() => {
    API.get('/api/admin/site-settings/home_modules').then(({ data }) => {
      if (data.setting_value) setModules(data.setting_value);
    }).catch(() => {});
    API.get('/api/admin/site-settings/module_order').then(({ data }) => {
      if (data.setting_value && Array.isArray(data.setting_value) && data.setting_value.length > 0) setModuleOrder(data.setting_value);
    }).catch(() => {});
  }, []);

  const show = (key) => !modules || modules[key] !== false;

  // Map of module keys to their components
  const moduleComponents = {
    hero: show('hero') ? <Hero key="hero" /> : null,
    trending_movies: show('trending_movies') ? <ContentRow key="trending_movies" title="Films Tendance" endpoint="/api/tmdb/trending/movies" type="movie" link="/movies" /> : null,
    recommendations: show('recommendations') ? <RecommendationsRow key="recommendations" /> : null,
    trending_tv_shows: show('trending_tv_shows') ? <ContentRow key="trending_tv_shows" title="Series Tendance" endpoint="/api/tmdb/trending/tv" type="tv" link="/tv-shows" /> : null,
    popular_anime: show('popular_anime') ? <ContentRow key="popular_anime" title="Animes Populaires" endpoint="/api/tmdb/trending/anime" type="tv" isAnime link="/anime" /> : null,
    download_links: show('download_links') ? <DownloadLinksRow key="download_links" /> : null,
    popular_collections: show('popular_collections') ? <PopularCollectionsRow key="popular_collections" /> : null,
    public_playlists: show('public_playlists') ? <PublicPlaylistsRow key="public_playlists" /> : null,
    trending_actors: show('trending_actors') ? <TrendingActorsRow key="trending_actors" /> : null,
    trending_tv_channels: show('trending_tv_channels') ? <TrendingTVChannelsRow key="trending_tv_channels" /> : null,
    sports_promo: show('sports_promo') ? <SportsStreamPromo key="sports_promo" /> : null,
    livewatch_promo: show('livewatch_promo') ? <LiveWatchPromo key="livewatch_promo" /> : null,
    vip_game_promo: show('vip_game_promo') ? <VIPGamePromo key="vip_game_promo" /> : null,
    subscription_offer: show('subscription_offer') ? <SubscriptionOffer key="subscription_offer" /> : null,
    random_content: show('random_content') ? <RandomContent key="random_content" /> : null,
    football_calendar: show('football_calendar') ? <FootballCalendarWidget key="football_calendar" /> : null,
    calendar_widget: show('calendar_widget') ? <CalendarWidgetHome key="calendar_widget" /> : null,
  };

  // Default order
  const defaultOrder = ['hero', 'trending_movies', 'recommendations', 'trending_tv_shows', 'popular_anime', 'download_links', 'popular_collections', 'public_playlists', 'trending_actors', 'trending_tv_channels', 'sports_promo', 'livewatch_promo', 'vip_game_promo', 'subscription_offer', 'random_content', 'football_calendar', 'calendar_widget'];
  const order = moduleOrder || defaultOrder;
  // Include any modules not in the saved order (fallback)
  const allKeys = [...new Set([...order, ...defaultOrder])];

  return (
    <div className="space-y-8" data-testid="home-page">
      <InfoBanner />
      {allKeys.map(key => {
        if (key === 'hero') return moduleComponents[key];
        return null;
      })}
      <div className="container mx-auto px-4 space-y-12">
        {allKeys.filter(k => k !== 'hero').map(key => moduleComponents[key])}
      </div>
    </div>
  );
}
