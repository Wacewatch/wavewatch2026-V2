import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Monitor, ArrowLeft, Download } from 'lucide-react';
import LikeDislike from '../components/LikeDislike';

export default function SoftwareDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/software').then(({ data }) => {
      const list = data.software || data.items || (Array.isArray(data) ? data : []);
      setItem(list.find(i => (i._id || i.id?.toString()) === id) || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Chargement...</div>;
  if (!item) return <div className="container mx-auto px-4 py-12 text-center">Logiciel non trouve</div>;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="software-detail-page">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" />Retour</button>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
          {(item.icon_url || item.icon) ? <img src={item.icon_url || item.icon} alt={item.name} className="w-full h-full object-contain p-6" /> : <Monitor className="w-24 h-24 text-blue-400/30" />}
        </div>
        <div className="md:col-span-3 space-y-4">
          <h1 className="text-4xl font-bold">{item.name}</h1>
          {item.developer && <p className="text-xl text-muted-foreground">{item.developer}</p>}
          <div className="flex gap-2 flex-wrap">
            {item.category && <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">{item.category}</span>}
            {item.platform && <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">{item.platform}</span>}
          </div>
          {item.description && <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            {item.download_url && <a href={item.download_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"><Download className="w-5 h-5" />Telecharger</a>}
          </div>
          <LikeDislike contentId={id} contentType="software" />
        </div>
      </div>
    </div>
  );
}
