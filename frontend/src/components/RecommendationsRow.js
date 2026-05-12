import React, { useEffect, useRef, useState } from 'react';
import API from '../lib/api';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';

export default function RecommendationsRow() {
  const [items, setItems] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    API.get('/api/user/recommendations')
      .then(({ data }) => {
        if (!mounted) return;
        setItems(data.recommendations || []);
        setSource(data.source || '');
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-950/40 to-fuchsia-950/30 p-6 animate-pulse h-72" data-testid="reco-loading" />
    );
  }
  if (items.length === 0) return null;

  const reasonLabel = source === 'personalised'
    ? "D'après ce que tu as aimé"
    : 'Tendances actuelles — découvre ton style';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-purple-400/30 bg-gradient-to-br from-purple-950/40 via-violet-950/30 to-fuchsia-950/20 p-5 md:p-6 backdrop-blur-xl"
      data-testid="recommendations-row"
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(285 95% 55%)' }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-20" style={{ background: 'hsl(265 95% 55%)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/40 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Recommandé pour toi</h2>
              <p className="text-xs text-purple-200/70 truncate">{reasonLabel}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-purple-400/40 bg-purple-900/40 hover:bg-purple-800/60 transition-colors flex items-center justify-center" data-testid="reco-prev">
              <ChevronLeft className="w-5 h-5 text-purple-100" />
            </button>
            <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-purple-400/40 bg-purple-900/40 hover:bg-purple-800/60 transition-colors flex items-center justify-center" data-testid="reco-next">
              <ChevronRight className="w-5 h-5 text-purple-100" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent snap-x"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.map((item, idx) => {
            const mt = item.media_type || (item.title ? 'movie' : 'tv');
            return (
              <div
                key={`${mt}-${item.id}-${idx}`}
                className="flex-shrink-0 w-[140px] md:w-[160px] snap-start"
                data-testid={`reco-item-${idx}`}
              >
                <ContentCard item={item} type={mt === 'movie' ? 'movie' : 'tv'} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
