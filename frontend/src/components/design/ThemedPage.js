import React from 'react';

/**
 * ThemedPage — wrapper standard pour toutes les pages refaites au pattern Discover.
 * Utilise les variables CSS du thème (hsl(var(--background)), --primary, --accent, --ring)
 * pour que le fond et les orbes s'adaptent automatiquement au thème sélectionné.
 */
export function ThemedPage({ children, testId, className = '' }) {
  return (
    <div
      className={`relative min-h-screen text-foreground bg-background ${className}`}
      style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)' }}
      data-testid={testId}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.45), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--ring) / 0.4), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * SimpleHero — bandeau gradient adaptatif pour les pages.
 * - badge: petit chip en haut (texte + icône)
 * - title: titre principal (gros)
 * - highlight: mot mis en avant en gradient
 * - subtitle: phrase descriptive
 * - stats: tableau optionnel d'objets {icon, label, value, color?}
 */
export function ThemedHero({ badge, badgeIcon: BadgeIcon, title, highlight, subtitle, description, stats }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border mb-8 backdrop-blur-sm"
      style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.12) 35%, hsl(var(--ring) / 0.18) 65%, hsl(var(--secondary) / 0.15))' }}
    >
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.6), transparent 70%)' }} />

      <div className="relative px-6 md:px-12 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1 min-w-0">
            {badge && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                {BadgeIcon && <BadgeIcon className="w-3 h-3" />}{badge}
              </span>
            )}
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block text-foreground">{title}</span>
              {highlight && (
                <span className="block">
                  {subtitle && <span className="text-foreground">{subtitle} </span>}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--ring)))' }}>
                    {highlight}
                  </span>
                </span>
              )}
            </h1>
            {description && (
              <p className="text-foreground/70 max-w-xl text-base md:text-lg leading-relaxed">{description}</p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className={`grid gap-3 w-full lg:w-auto lg:flex-shrink-0 ${stats.length === 1 ? 'grid-cols-1' : stats.length === 2 ? 'grid-cols-2' : stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
              {stats.map(s => {
                const I = s.icon;
                const color = s.color || 'hsl(var(--primary))';
                return (
                  <div key={s.label} className="relative overflow-hidden rounded-2xl border border-border bg-black/20 backdrop-blur-md px-3 md:px-5 py-4 group hover:border-foreground/25 transition-colors min-w-[110px]">
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: color }} />
                    {I && <I className="w-4 h-4 mb-2" style={{ color }} />}
                    <p className="text-2xl md:text-3xl font-black tabular-nums" style={{ color }}>{s.value}</p>
                    <p className="text-[10px] md:text-xs uppercase tracking-widest text-foreground/60 font-semibold mt-1">{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThemedPage;
