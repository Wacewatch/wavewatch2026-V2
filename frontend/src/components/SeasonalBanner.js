import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Ghost, TreePine, Sun, Heart, Cake, X, Zap } from 'lucide-react';
import { useSeasonalEvent } from '../lib/seasonal';

const ICONS = { Ghost, TreePine, Sun, Heart, Cake, Sparkles, Zap };

export default function SeasonalBanner() {
  const { event } = useSeasonalEvent();
  const [closed, setClosed] = React.useState(() => sessionStorage.getItem('ww_event_banner_closed') === '1');
  if (!event || closed) return null;
  const Icon = ICONS[event.icon] || Sparkles;
  const c = event.color || '#a855f7';

  return (
    <div className="relative overflow-hidden border-b" style={{ borderColor: `${c}55`, background: `linear-gradient(90deg, ${c}25 0%, transparent 50%, ${c}20 100%)` }} data-testid="seasonal-banner">
      {/* Animated stripes */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${c}30 0 8px, transparent 8px 24px)`, animation: 'stripe-slide 30s linear infinite' }} />
      <style>{`@keyframes stripe-slide { from { background-position: 0 0 } to { background-position: 100px 0 } }`}</style>

      <div className="relative container mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse"
          style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)`, boxShadow: `0 4px 12px ${c}55` }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: c }}>Événement actif</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white" style={{ background: c }}>×{event.xp_multiplier} XP</span>
          </div>
          <p className="text-sm font-bold text-foreground">{event.name}</p>
          <p className="text-xs text-foreground/70 truncate hidden md:block">{event.description}</p>
        </div>
        <Link to="/leaderboard" className="text-[11px] font-bold px-3 py-1 rounded-full border transition-colors flex-shrink-0"
          style={{ borderColor: `${c}55`, color: c, background: `${c}15` }}>
          En savoir plus
        </Link>
        <button onClick={() => { sessionStorage.setItem('ww_event_banner_closed', '1'); setClosed(true); }} className="p-1 rounded hover:bg-foreground/10 transition-colors flex-shrink-0" data-testid="close-event-banner">
          <X className="w-3.5 h-3.5 text-foreground/50" />
        </button>
      </div>
    </div>
  );
}
