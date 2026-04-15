import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';

export default function LikeDislike({ contentId, contentType }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && contentId && contentType) {
      API.get(`/api/user/ratings/check?content_id=${contentId}&content_type=${contentType}`)
        .then(({ data }) => setRating(data.rating))
        .catch(() => {});
    }
  }, [user, contentId, contentType]);

  const vote = async (type) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/api/user/ratings', { content_id: contentId, content_type: contentType, rating: type });
      setRating(data.rating);
      toast({ title: data.message });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center gap-2" data-testid="like-dislike">
      <button onClick={() => vote('like')} disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
          rating === 'like' ? 'border-green-500 bg-green-500/20 text-green-400 scale-105' : 'border-gray-600 text-gray-400 hover:border-green-500/50 hover:text-green-400'
        }`} data-testid="like-btn">
        <ThumbsUp className={`w-4 h-4 ${rating === 'like' ? 'fill-green-400' : ''}`} />
        <span>Like</span>
      </button>
      <button onClick={() => vote('dislike')} disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
          rating === 'dislike' ? 'border-red-500 bg-red-500/20 text-red-400 scale-105' : 'border-gray-600 text-gray-400 hover:border-red-500/50 hover:text-red-400'
        }`} data-testid="dislike-btn">
        <ThumbsDown className={`w-4 h-4 ${rating === 'dislike' ? 'fill-red-400' : ''}`} />
        <span>Dislike</span>
      </button>
    </div>
  );
}
