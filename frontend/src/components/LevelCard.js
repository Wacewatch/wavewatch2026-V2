import React from 'react';
import { Star } from 'lucide-react';
import { getTier, getLevelBounds } from '../lib/xp';

/**
 * Carte Niveau XP réutilisable (Dashboard, Profile, Leaderboard...).
 */
export default function LevelCard({ xp, level, xpBonus = 0, compact = false, testId = 'level-card' }) {
  const tier = getTier(level);
  const { current, next } = getLevelBounds(level);
  const progressXP = xp - current;
  const neededXP = next - current;
  const progressPct = Math.min(100, Math.max(0, Math.round((progressXP / neededXP) * 100)));

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 backdrop-blur-md"
        style={{ borderColor: `${tier.hex}80`, background: `linear-gradient(135deg, ${tier.from}25, ${tier.to}15)`, boxShadow: `0 4px 16px ${tier.glow}` }}
        data-testid={testId}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-black"
          style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})` }}>
          {level}
        </div>
        <span className="text-xs font-bold" style={{ color: tier.hex }}>{tier.name}</span>
        <span className="text-[10px] tabular-nums text-foreground/60">· {xp.toLocaleString('fr-FR')} XP</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl p-5"
      style={{ borderColor: `${tier.hex}60`, background: `linear-gradient(135deg, ${tier.from}15, transparent 50%, ${tier.to}10)`, boxShadow: `0 12px 40px ${tier.glow}` }}
      data-testid={testId}
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: tier.hex }} />
      <div className="relative flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: tier.hex }} />
          <div className="relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`, boxShadow: `0 12px 32px ${tier.glow}, inset 0 2px 8px rgba(255,255,255,0.2)` }}>
            <span className="text-[8px] uppercase tracking-widest font-extrabold text-black/70">Niv.</span>
            <span className="text-3xl font-black text-black tabular-nums leading-none drop-shadow">{level}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 fill-current" style={{ color: tier.hex }} />
            <p className="text-sm font-black uppercase tracking-wider" style={{ color: tier.hex }}>Rang {tier.name}</p>
          </div>
          <p className="text-2xl font-black text-foreground mb-2">
            <span className="tabular-nums">{xp.toLocaleString('fr-FR')}</span>
            <span className="text-foreground/50 text-sm ml-1">XP</span>
            {xpBonus > 0 && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold align-middle" style={{ background: `${tier.hex}25`, color: tier.hex }} data-testid="level-card-bonus">
                +{xpBonus.toLocaleString('fr-FR')} bonus événement
              </span>
            )}
          </p>
          <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${tier.from}, ${tier.to})`, boxShadow: `0 0 12px ${tier.glow}` }}
            />
          </div>
          <p className="text-[10px] text-foreground/50 mt-1.5 tabular-nums">
            {progressXP.toLocaleString('fr-FR')} / {neededXP.toLocaleString('fr-FR')} XP — niv. {level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
