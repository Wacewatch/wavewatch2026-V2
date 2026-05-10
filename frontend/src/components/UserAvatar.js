import React from 'react';
import { getTier } from '../lib/xp';

/**
 * UserAvatar — Avatar dynamique avec frame & badge automatiques selon le niveau XP.
 * - Niveau 5+ → badge bronze (médaille bas-droite)
 * - Niveau 10+ → cadre argent autour
 * - Niveau 20+ → cadre or animé
 * - Niveau 35+ → cadre diamant glow
 * - Cosmétique automatique pour tout utilisateur partout dans l'app.
 */
export default function UserAvatar({ user, size = 40, level = 0, showBadge = true, className = '' }) {
  const initial = (user?.username || user?.name || '?').charAt(0).toUpperCase();
  const tier = getTier(level);

  // Frame logic
  const hasFrame = level >= 10;
  const frameStyle = !hasFrame ? {} : {
    padding: '3px',
    background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
    boxShadow: `0 0 16px ${tier.glow}, inset 0 1px 4px rgba(255,255,255,0.3)`,
    animation: level >= 20 ? 'avatar-spin-glow 3s ease-in-out infinite' : 'none',
  };
  // Badge logic (medal)
  const showLevelBadge = showBadge && level >= 5;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`} style={{ width: size, height: size }} data-testid="user-avatar">
      {hasFrame && (
        <style>{`@keyframes avatar-spin-glow { 0%,100% { box-shadow: 0 0 16px ${tier.glow}, inset 0 1px 4px rgba(255,255,255,0.3) } 50% { box-shadow: 0 0 28px ${tier.glow}, inset 0 1px 6px rgba(255,255,255,0.5) } }`}</style>
      )}
      <div className="rounded-full overflow-hidden flex items-center justify-center w-full h-full relative" style={frameStyle}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-black overflow-hidden" style={{ fontSize: size * 0.45 }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
          ) : initial}
        </div>
      </div>
      {showLevelBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center shadow-lg ring-2"
          style={{
            width: Math.max(14, size * 0.36),
            height: Math.max(14, size * 0.36),
            background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
            color: '#000',
            fontSize: size * 0.18,
            fontWeight: 900,
            ['--tw-ring-color']: 'hsl(var(--background))',
            boxShadow: `0 2px 8px ${tier.glow}`,
          }}
          title={`Niveau ${level} • ${tier.name}`}
        >
          {level}
        </div>
      )}
    </div>
  );
}
