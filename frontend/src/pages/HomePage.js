import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import ContentGrid from '../components/ContentGrid';
import { LoadingGrid } from '../components/Loading';

function Hero() {
  const [movies, setMovies] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    API.get('/api/tmdb/trending/movies').then(({ data }) => {
      if (data.results?.length) setMovies(data.results.slice(0, 5));
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
              <h1 className="text-2xl md:text-6xl lg:text-7xl font-bold text-white leading-tight" style={{ textShadow: '0 0 20px rgba(0,0,0,0.9)' }}>{m.title}</h1>
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

function ContentRow({ title, endpoint, type = 'movie', isAnime = false }) {
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
    <ContentGrid title={title}>
      {items.map(item => <ContentCard key={item.id} item={item} type={type} isAnime={isAnime} />)}
    </ContentGrid>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8" data-testid="home-page">
      <Hero />
      <div className="container mx-auto px-4 space-y-12">
        <ContentRow title="Films Tendance" endpoint="/api/tmdb/trending/movies" type="movie" />
        <ContentRow title="Series Tendance" endpoint="/api/tmdb/trending/tv" type="tv" />
        <ContentRow title="Animes Populaires" endpoint="/api/tmdb/trending/anime" type="tv" isAnime />
        <ContentRow title="Films Populaires" endpoint="/api/tmdb/popular/movies" type="movie" />
        <ContentRow title="Series Populaires" endpoint="/api/tmdb/popular/tv" type="tv" />
      </div>
    </div>
  );
}
