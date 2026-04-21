import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Music, Play, ArrowLeft, Download } from 'lucide-react';
import LikeDislike from '../components/LikeDislike';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import IframeModal from '../components/IframeModal';

export default function MusicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlay, setShowPlay] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    API.get('/api/music').then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      const found = list.find(i => i._id === id);
      setItem(found || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const logHistory = () => {
    API.post('/api/user/history', { content_id: id, content_type: 'music', title: item?.title || '', poster_path: item?.thumbnail_url || '' }).catch(() => {});
  };

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>;
  if (!item) return <div className="container mx-auto px-4 py-12 text-center">Contenu non trouve</div>;

  const streamUrl = item.streaming_url || item.stream_url;
  const dlUrl = item.download_url;

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
            {streamUrl && (
              <button onClick={() => { setShowPlay(true); logHistory(); }} className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2" data-testid="music-play-btn">
                <Play className="w-5 h-5" />Ecouter
              </button>
            )}
            {dlUrl && (
              <button onClick={() => setShowDownload(true)} className="px-6 py-3 rounded-lg border border-purple-600 text-purple-400 hover:bg-purple-900/20 font-medium flex items-center gap-2" data-testid="music-download-btn">
                <Download className="w-5 h-5" />Telecharger
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <LikeDislike contentId={id} contentType="music" />
            <AddToPlaylistButton contentId={id} contentType="music" title={item.title || item.name} posterPath={item.image_url || item.cover_url} />
          </div>
          <p className="text-xs text-muted-foreground">Ajoute le {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</p>
        </div>
      </div>

      {showPlay && (
        <IframeModal src={streamUrl} title={`Ecoute - ${item.title}`} onClose={() => setShowPlay(false)} icon={<Music className="w-5 h-5 text-purple-400" />}>
          {/\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(streamUrl || '') ? (
            <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 bg-black h-full">
              {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.title} className="w-40 h-40 rounded-2xl object-cover shadow-2xl" />}
              <p className="text-lg font-medium text-white text-center">{item.title}</p>
              {item.artist && <p className="text-sm text-white/60">{item.artist}</p>}
              <audio controls autoPlay src={streamUrl} className="w-full max-w-md" />
            </div>
          ) : (
            <div className="w-full h-full sm:aspect-video sm:h-auto">
              <iframe src={streamUrl} title={item.title} className="w-full h-full block" allowFullScreen allow="autoplay; encrypted-media; fullscreen" />
            </div>
          )}
        </IframeModal>
      )}

      {showDownload && (
        <IframeModal src={dlUrl} title={`Telechargement - ${item.title}`} onClose={() => setShowDownload(false)} showOpenInNewTab icon={<Download className="w-5 h-5 text-purple-400" />} />
      )}
    </div>
  );
}
