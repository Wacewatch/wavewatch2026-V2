import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';

export default function LikeDislike({ contentId, contentType }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(null);
  const [counts, setCounts] = useState({ likes: 0, dislikes: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contentId && contentType) {
      // Fetch public counts
      API.get(`/api/ratings/counts?content_id=${contentId}&content_type=${contentType}`)
        .then(({ data }) => setCounts({ likes: data.likes || 0, dislikes: data.dislikes || 0 }))
        .catch(() => {});
      // Fetch user's own rating
      if (user) {
        API.get(`/api/user/ratings/check?content_id=${contentId}&content_type=${contentType}`)
          .then(({ data }) => setRating(data.rating))
          .catch(() => {});
      }
    }
  }, [user, contentId, contentType]);

  const vote = async (type) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/api/user/ratings', { content_id: contentId, content_type: contentType, rating: type });
      const oldRating = rating;
      setRating(data.rating);
      // Update counts locally
      setCounts(prev => {
        const next = { ...prev };
        if (data.rating === null) {
          // Removed vote
          if (oldRating === 'like') next.likes = Math.max(0, next.likes - 1);
          if (oldRating === 'dislike') next.dislikes = Math.max(0, next.dislikes - 1);
        } else if (oldRating && oldRating !== data.rating) {
          // Switched vote
          if (oldRating === 'like') next.likes = Math.max(0, next.likes - 1);
          if (oldRating === 'dislike') next.dislikes = Math.max(0, next.dislikes - 1);
          if (data.rating === 'like') next.likes++;
          if (data.rating === 'dislike') next.dislikes++;
        } else {
          // New vote
          if (data.rating === 'like') next.likes++;
          if (data.rating === 'dislike') next.dislikes++;
        }
        return next;
      });
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
        <span>{counts.likes}</span>
      </button>
      <button onClick={() => vote('dislike')} disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
          rating === 'dislike' ? 'border-red-500 bg-red-500/20 text-red-400 scale-105' : 'border-gray-600 text-gray-400 hover:border-red-500/50 hover:text-red-400'
        }`} data-testid="dislike-btn">
        <ThumbsDown className={`w-4 h-4 ${rating === 'dislike' ? 'fill-red-400' : ''}`} />
        <span>{counts.dislikes}</span>
      </button>
    </div>
  );
}
