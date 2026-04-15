import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Music, Play, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import LikeDislike from '../components/LikeDislike';

export default function MusicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/music').then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      const found = list.find(i => i._id === id);
      setItem(found || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>;
  if (!item) return <div className="container mx-auto px-4 py-12 text-center">Contenu non trouve</div>;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="music-detail-page">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" />Retour</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center">
          {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" /> : <Music className="w-24 h-24 text-purple-400/30" />}
        </div>
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-4xl font-bold">{item.title}</h1>
          {item.artist && <p className="text-xl text-muted-foreground">{item.artist}</p>}
          <div className="flex gap-2 flex-wrap">
            {item.genre && <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">{item.genre}</span>}
          </div>
          {item.description && <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {item.streaming_url && <a href={item.streaming_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2"><Play className="w-5 h-5" />Ecouter</a>}
            {item.download_url && <a href={item.download_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-lg border border-purple-600 text-purple-400 hover:bg-purple-900/20 font-medium flex items-center gap-2"><Download className="w-5 h-5" />Telecharger</a>}
          </div>
          <LikeDislike contentId={id} contentType="music" />
          <p className="text-xs text-muted-foreground">Ajoute le {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</p>
        </div>
      </div>
    </div>
  );
}
