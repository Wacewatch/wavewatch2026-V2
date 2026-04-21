import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Gamepad2, ArrowLeft, Download } from 'lucide-react';
import LikeDislike from '../components/LikeDislike';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import IframeModal from '../components/IframeModal';

export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    API.get('/api/games').then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      setItem(list.find(i => i._id === id) || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const logHistory = () => {
    API.post('/api/user/history', { content_id: id, content_type: 'game', title: item?.title || '', poster_path: item?.cover_url || '' }).catch(() => {});
  };

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>;
  if (!item) return <div className="container mx-auto px-4 py-12 text-center">Jeu non trouve</div>;

  const dlUrl = item.download_url;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="game-detail-page">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" />Retour</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-green-900/40 to-blue-900/40 flex items-center justify-center">
          {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-24 h-24 text-green-400/30" />}
        </div>
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-4xl font-bold">{item.title}</h1>
          {item.developer && <p className="text-xl text-muted-foreground">{item.developer}</p>}
          <div className="flex gap-2 flex-wrap">
            {item.genre && <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">{item.genre}</span>}
            {item.platform && <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">{item.platform}</span>}
          </div>
          {item.description && <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {dlUrl && (
              <button onClick={() => { setShowDownload(true); logHistory(); }} className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2" data-testid="game-download-btn">
                <Download className="w-5 h-5" />Telecharger
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <LikeDislike contentId={id} contentType="game" />
            <AddToPlaylistButton contentId={id} contentType="game" title={item.title || item.name} posterPath={item.image_url} />
          </div>
        </div>
      </div>

      {showDownload && (
        <IframeModal
          src={dlUrl}
          title={`Telechargement - ${item.title}`}
          onClose={() => setShowDownload(false)}
          icon={<Gamepad2 className="w-5 h-5 text-green-400" />}
          showOpenInNewTab
          borderColor="border-green-500/30"
        />
      )}
    </div>
  );
}
