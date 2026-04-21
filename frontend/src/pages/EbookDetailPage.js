import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { BookOpen, Eye, ArrowLeft, Download } from 'lucide-react';
import LikeDislike from '../components/LikeDislike';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import IframeModal from '../components/IframeModal';

export default function EbookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    API.get('/api/ebooks').then(({ data }) => {
      const list = data.ebooks || data.items || (Array.isArray(data) ? data : []);
      setItem(list.find(i => (i._id || i.id?.toString()) === id) || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const logHistory = () => {
    API.post('/api/user/history', { content_id: id, content_type: 'ebook', title: item?.title || '', poster_path: item?.cover_url || item?.cover || '' }).catch(() => {});
  };

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>;
  if (!item) return <div className="container mx-auto px-4 py-12 text-center">Ebook non trouve</div>;

  const readUrl = item.reading_url;
  const dlUrl = item.download_url;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="ebook-detail-page">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" />Retour</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-orange-900/30 to-amber-900/30 flex items-center justify-center">
          {(item.cover_url || item.cover) ? <img src={item.cover_url || item.cover} alt={item.title} className="w-full h-full object-cover" /> : <BookOpen className="w-24 h-24 text-orange-400/30" />}
        </div>
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-4xl font-bold">{item.title}</h1>
          {item.author && <p className="text-xl text-muted-foreground">{item.author}</p>}
          <div className="flex gap-2 flex-wrap">
            {item.category && <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30">{item.category}</span>}
            {item.language && <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">{item.language}</span>}
          </div>
          {item.description && <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {readUrl && (
              <button onClick={() => { setShowRead(true); logHistory(); }} className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-2" data-testid="ebook-read-btn">
                <Eye className="w-5 h-5" />Lire en ligne
              </button>
            )}
            {dlUrl && (
              <button onClick={() => setShowDownload(true)} className="px-6 py-3 rounded-lg border border-orange-600 text-orange-400 hover:bg-orange-900/20 font-medium flex items-center gap-2" data-testid="ebook-download-btn">
                <Download className="w-5 h-5" />Telecharger
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <LikeDislike contentId={id} contentType="ebook" />
            <AddToPlaylistButton contentId={id} contentType="ebook" title={item.title} posterPath={item.image_url || item.cover_url} />
          </div>
        </div>
      </div>

      {showRead && (
        <IframeModal
          src={readUrl}
          title={`Lecture - ${item.title}`}
          onClose={() => setShowRead(false)}
          icon={<BookOpen className="w-5 h-5 text-orange-400" />}
          showOpenInNewTab
          borderColor="border-orange-500/30"
        />
      )}
      {showDownload && (
        <IframeModal src={dlUrl} title={`Telechargement - ${item.title}`} onClose={() => setShowDownload(false)} showOpenInNewTab icon={<Download className="w-5 h-5 text-orange-400" />} />
      )}
    </div>
  );
}
