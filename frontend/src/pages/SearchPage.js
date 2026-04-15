import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingGrid } from '../components/Loading';
import { Search, Film, Tv, Users, Filter, Music, Gamepad2, BookOpen, Monitor, Radio } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [tmdbResults, setTmdbResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { setPage(1); }, [q]);

  useEffect(() => {
    if (q) {
      setLoading(true);
      // Fetch both TMDB and local content
      Promise.all([
        API.get(`/api/tmdb/search?q=${encodeURIComponent(q)}&page=${page}`).catch(() => ({ data: { results: [] } })),
        API.get(`/api/search/all?q=${encodeURIComponent(q)}`).catch(() => ({ data: { results: [] } }))
      ]).then(([tmdbRes, localRes]) => {
        setTmdbResults(tmdbRes.data.results || []);
        setTotalPages(tmdbRes.data.total_pages || 1);
        setLocalResults(localRes.data.results || []);
      }).finally(() => setLoading(false));
    }
  }, [q, page]);

  const movies = tmdbResults.filter(r => r.media_type === 'movie');
  const tvShows = tmdbResults.filter(r => r.media_type === 'tv');
  const persons = tmdbResults.filter(r => r.media_type === 'person');
  const tvChannels = localResults.filter(r => r.type === 'tv_channel');
  const musicItems = localResults.filter(r => r.type === 'music');
  const gameItems = localResults.filter(r => r.type === 'game');
  const softwareItems = localResults.filter(r => r.type === 'software');
  const ebookItems = localResults.filter(r => r.type === 'ebook');
  const radioItems = localResults.filter(r => r.type === 'radio');

  const filterTabs = [
    { val: 'all', label: 'Tout', count: tmdbResults.length + localResults.length },
    { val: 'movie', label: 'Films', count: movies.length, icon: <Film className="w-3.5 h-3.5" /> },
    { val: 'tv', label: 'Series', count: tvShows.length, icon: <Tv className="w-3.5 h-3.5" /> },
    { val: 'person', label: 'Acteurs', count: persons.length, icon: <Users className="w-3.5 h-3.5" /> },
    { val: 'tv_channel', label: 'TV', count: tvChannels.length, icon: <Tv className="w-3.5 h-3.5" /> },
    { val: 'music', label: 'Musique', count: musicItems.length, icon: <Music className="w-3.5 h-3.5" /> },
    { val: 'game', label: 'Jeux', count: gameItems.length, icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { val: 'software', label: 'Logiciels', count: softwareItems.length, icon: <Monitor className="w-3.5 h-3.5" /> },
    { val: 'ebook', label: 'Ebooks', count: ebookItems.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
    { val: 'radio', label: 'Radio', count: radioItems.length, icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const LocalContentCard = ({ item }) => {
    const iconMap = { tv_channel: Tv, music: Music, game: Gamepad2, software: Monitor, ebook: BookOpen, radio: Radio };
    const colorMap = { tv_channel: 'text-blue-400', music: 'text-pink-400', game: 'text-green-400', software: 'text-purple-400', ebook: 'text-orange-400', radio: 'text-cyan-400' };
    const linkMap = { music: `/music/${item._id}`, game: `/games/${item._id}`, ebook: `/ebooks/${item._id}`, software: `/logiciels/${item._id}`, tv_channel: '/tv-channels', radio: '/radio' };
    const Icon = iconMap[item.type] || Film;
    
    return (
      <Link to={linkMap[item.type] || '#'} className="group" data-testid={`local-${item.type}-${item._id}`}>
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted relative mb-2">
          {item.image ? (
            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={e => e.target.src = 'https://placehold.co/300x450/333/ccc?text=' + item.type} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Icon className={`w-12 h-12 ${colorMap[item.type]} opacity-30`} />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 text-xs rounded-full bg-black/60 ${colorMap[item.type]} flex items-center gap-1`}>
              <Icon className="w-3 h-3" />{item.type === 'tv_channel' ? 'TV' : item.type === 'ebook' ? 'Ebook' : item.type}
            </span>
          </div>
        </div>
        <h3 className="font-medium text-sm group-hover:text-blue-400 line-clamp-2">{item.title}</h3>
        {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
      </Link>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="search-page">
      <h1 className="text-3xl font-bold mb-2">Recherche</h1>
      {q && <p className="text-muted-foreground mb-6">Resultats pour "{q}" ({tmdbResults.length + localResults.length} resultats)</p>}
      {!q && (
        <div className="text-center py-20"><Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Recherchez des films, series, acteurs, musiques, jeux...</p></div>
      )}

      {q && !loading && (tmdbResults.length > 0 || localResults.length > 0) && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="search-filters">
            {filterTabs.filter(f => f.val === 'all' || f.count > 0).map(f => (
              <button key={f.val} onClick={() => setFilter(f.val)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border whitespace-nowrap transition-colors ${filter === f.val ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
                {f.icon}{f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Movies & TV Shows from TMDB */}
          {(filter === 'all' || filter === 'movie' || filter === 'tv') && (movies.length > 0 || tvShows.length > 0) && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4">Films et Series</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {tmdbResults.filter(r => (filter === 'all' || r.media_type === filter) && r.media_type !== 'person').map(r => (
                  <ContentCard key={`${r.media_type}-${r.id}`} item={r} type={r.media_type === 'tv' ? 'tv' : 'movie'} />
                ))}
              </div>
            </div>
          )}

          {/* Actors */}
          {(filter === 'all' || filter === 'person') && persons.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Acteurs</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {persons.map(p => (
                  <Link key={`person-${p.id}`} to={`/actors/${p.id}`} className="group text-center" data-testid={`person-${p.id}`}>
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                      <img src={p.profile_path ? `${TMDB_IMG}/w300${p.profile_path}` : 'https://placehold.co/300x450/333/ccc?text=?'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-blue-400">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.known_for_department}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Local Content Sections */}
          {(filter === 'all' || filter === 'tv_channel') && tvChannels.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Tv className="w-5 h-5" />Chaines TV</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tvChannels.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'music') && musicItems.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Music className="w-5 h-5" />Musique</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {musicItems.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'game') && gameItems.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Gamepad2 className="w-5 h-5" />Jeux</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {gameItems.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'software') && softwareItems.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5" />Logiciels</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {softwareItems.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'ebook') && ebookItems.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5" />Ebooks</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ebookItems.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'radio') && radioItems.length > 0 && (
            <div className="mb-8">
              {filter === 'all' && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Radio className="w-5 h-5" />Radio</h2>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {radioItems.map(item => <LocalContentCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {/* Pagination for TMDB */}
          {totalPages > 1 && (filter === 'all' || filter === 'movie' || filter === 'tv' || filter === 'person') && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Precedent</button>
              <span className="px-4 py-2 text-muted-foreground">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-border disabled:opacity-50 hover:bg-secondary">Suivant</button>
            </div>
          )}
        </>
      )}

      {loading && <LoadingGrid count={12} />}
      {!loading && q && tmdbResults.length === 0 && localResults.length === 0 && <div className="text-center py-20"><p className="text-xl text-muted-foreground">Aucun resultat trouve</p></div>}
    </div>
  );
}
