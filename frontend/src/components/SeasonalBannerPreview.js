import React from 'react';
import { Sparkles, Ghost, TreePine, Sun, Heart, Cake, Zap } from 'lucide-react';

const ICONS = { Ghost, TreePine, Sun, Heart, Cake, Sparkles, Zap };

/**
 * Aperçu visuel non-interactif du SeasonalBanner — utilisé dans l'admin.
 * Mêmes styles que SeasonalBanner.js sans state ni API call.
 */
export default function SeasonalBannerPreview({ event, className = '' }) {
  if (!event) return null;
  const Icon = ICONS[event.icon] || Sparkles;
  const c = event.color || '#a855f7';
  return (
    <div className={`relative overflow-hidden border rounded-xl ${className}`} style={{ borderColor: `${c}55`, background: `linear-gradient(90deg, ${c}25 0%, transparent 50%, ${c}20 100%)` }} data-testid="seasonal-banner-preview">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${c}30 0 8px, transparent 8px 24px)` }} />
      <div className="relative px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)`, boxShadow: `0 4px 12px ${c}55` }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: c }}>Événement actif</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white" style={{ background: c }}>×{event.xp_multiplier || 1} XP</span>
          <span className="text-sm font-bold text-foreground">{event.name || '(sans nom)'}</span>
          {event.description && <span className="text-xs text-foreground/70 hidden md:inline">— {event.description}</span>}
        </div>
      </div>
    </div>
  );
}
