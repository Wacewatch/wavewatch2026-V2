import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingSpinner } from '../components/Loading';
import { Heart, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      API.get('/api/user/favorites').then(({ data }) => setFavorites(data.favorites || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="favorites-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Heart className="w-8 h-8 text-red-400" />Mes Favoris</h1>
      {loading ? <LoadingSpinner /> : favorites.length === 0 ? (
        <div className="text-center py-20"><Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">Aucun favori</p><p className="text-sm text-muted-foreground mt-2">Ajoutez des films et series a vos favoris</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {favorites.map(f => (
            <ContentCard key={`${f.content_type}-${f.content_id}`}
              item={{ id: f.content_id, title: f.title, name: f.title, poster_path: f.poster_path, vote_average: 0, release_date: '', first_air_date: '' }}
              type={f.content_type === 'tv' ? 'tv' : 'movie'} />
          ))}
        </div>
      )}
    </div>
  );
}
