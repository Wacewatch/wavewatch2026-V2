import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { TMDB_IMG } from '../lib/api';

export default function ContentCard({ item, type = 'movie', isAnime = false }) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  const poster = item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Image';
  const rating = item.vote_average?.toFixed(1) || '0.0';
  const basePath = type === 'movie' ? '/movies' : isAnime ? '/anime' : '/tv-shows';

  return (
    <Link to={`${basePath}/${item.id}`} className="group" data-testid={`content-card-${item.id}`}>
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-105">
        <div className="relative aspect-[2/3]">
          <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{rating}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{year}</p>
        </div>
      </div>
    </Link>
  );
}
