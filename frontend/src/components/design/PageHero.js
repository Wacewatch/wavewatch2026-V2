import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shared modern design building blocks reused across pages.
 * Theme-aware: uses CSS variables from current theme via gradient hints.
 */

// ============================================================
// Hooks
// ============================================================
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

// ============================================================
// AnimatedBackground - radial pulsing blobs
// Pass three accent colors as rgba strings (or use defaults)
// ============================================================
export function AnimatedBackground({ accents = ['rgba(239,68,68,0.55)', 'rgba(244,114,182,0.5)', 'rgba(168,85,247,0.5)'] }) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
             style={{ background: `radial-gradient(closest-side, ${accents[0]}, transparent 70%)`, animation: 'wv-pulse 9s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
             style={{ background: `radial-gradient(closest-side, ${accents[1]}, transparent 70%)`, animation: 'wv-pulse 11s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
             style={{ background: `radial-gradient(closest-side, ${accents[2]}, transparent 70%)`, animation: 'wv-pulse 13s ease-in-out infinite' }} />
      </div>
      <style>{`
        @keyframes wv-pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.15); opacity: 0.55; } }
        @keyframes wv-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .wv-fade-in { animation: wv-fade-in 0.5s ease-out backwards; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </>
  );
}

// ============================================================
// PageHero - Hero banner with gradient title, badge & stats
// ============================================================
export function PageHero({
  badge,
  badgeIcon: BadgeIcon,
  title,
  highlight,
  subtitle,
  description,
  stats = [],
  gradient = 'rgba(239,68,68,0.18), rgba(244,114,182,0.12) 35%, rgba(168,85,247,0.18) 65%, rgba(99,102,241,0.15)',
  titleGradient = 'linear-gradient(135deg, #fff 0%, #fca5a5 40%, #f9a8d4 70%, #c4b5fd 100%)',
  highlightGradient = 'linear-gradient(135deg, #ef4444, #ec4899, #a855f7)',
  blobColor1 = 'rgba(239,68,68,0.6)',
  blobColor2 = 'rgba(168,85,247,0.55)',
  children,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 mb-6 md:mb-8 backdrop-blur-sm"
      style={{ background: `linear-gradient(135deg, ${gradient})` }}
      data-testid="page-hero"
    >
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: `radial-gradient(closest-side, ${blobColor1}, transparent 70%)` }} />
      <div className="absolute -bottom-24 -left-10 w-96 h-96 rounded-full blur-3xl opacity-40" style={{ background: `radial-gradient(closest-side, ${blobColor2}, transparent 70%)` }} />

      <div className="relative p-5 sm:p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-widest text-white/85 mb-4">
                {BadgeIcon ? <BadgeIcon className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />}
                {badge}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              <span className="block bg-clip-text text-transparent" style={{ backgroundImage: titleGradient }}>{title}</span>
              {(subtitle || highlight) && (
                <span className="block text-white">
                  {subtitle && <>{subtitle} </>}
                  {highlight && <span className="bg-clip-text text-transparent" style={{ backgroundImage: highlightGradient }}>{highlight}</span>}
                </span>
              )}
            </h1>
            {description && <p className="mt-4 text-sm sm:text-base text-white/70 max-w-xl">{description}</p>}
          </div>

          {stats.length > 0 && (
            <div className={`grid gap-2 sm:gap-3 w-full lg:max-w-xl ${stats.length === 1 ? 'grid-cols-1' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {stats.map(s => <StatTile key={s.label} {...s} />)}
            </div>
          )}
        </div>
        {children && <div className="mt-6 sm:mt-8">{children}</div>}
      </div>
    </div>
  );
}

// ============================================================
// StatTile
// ============================================================
export function StatTile({ icon: Icon, label, value, accent = 'rgba(239,68,68,0.7)' }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-3 sm:px-4 py-3.5 group hover:border-white/25 transition-colors"
      data-testid={`stat-tile-${label}`}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: `radial-gradient(closest-side, ${accent}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        {Icon && (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, boxShadow: `0 4px 18px ${accent}55` }}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold leading-none tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-white/60 mt-1 font-semibold truncate">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FilterBar - sticky toolbar wrapper for filters/search
// ============================================================
export function FilterBar({ children }) {
  return (
    <div className="sticky top-16 z-40 mb-6 rounded-2xl border border-white/10 bg-[#0b1220]/85 backdrop-blur-xl p-3 md:p-4 shadow-xl shadow-black/40">
      {children}
    </div>
  );
}

// ============================================================
// Pill - colored filter pill with optional count
// ============================================================
export function Pill({ active, onClick, color = '#ef4444', icon: Icon, children, count, testId }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
        active
          ? 'text-white shadow-lg scale-105'
          : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
      }`}
      style={active ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 6px 22px ${color}55` } : {}}
      data-testid={testId}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#fff' : color }} />}
      <span>{children}</span>
      {count !== undefined && count !== null && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${active ? 'bg-white/25' : 'bg-white/10'}`}>{count}</span>
      )}
    </button>
  );
}

// ============================================================
// SectionTitle
// ============================================================
export function SectionTitle({ icon: Icon, children, action, color = 'text-fuchsia-400' }) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2 text-white">
        {Icon && <Icon className={`w-5 h-5 ${color}`} />} {children}
      </h2>
      {action}
    </div>
  );
}

// ============================================================
// LoaderBlock
// ============================================================
export function LoaderBlock({ accent = 'from-red-500 to-fuchsia-600', textColor = 'text-red-400' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="page-loader">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-xl animate-pulse`} />
        <Loader2 className={`w-12 h-12 ${textColor} animate-spin absolute inset-0 m-auto`} />
      </div>
      <p className="mt-4 text-sm text-white/60 font-semibold uppercase tracking-widest">Chargement…</p>
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
export function EmptyState({ icon: Icon, text, sub, gradient = 'from-red-950/30 via-fuchsia-950/20 to-purple-950/30' }) {
  return (
    <div className={`relative overflow-hidden text-center py-16 md:py-20 rounded-3xl border border-white/10 bg-gradient-to-br ${gradient}`}>
      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-4">
        {Icon && <Icon className="w-10 h-10 text-white/40" />}
      </div>
      <h3 className="text-lg md:text-xl font-extrabold text-white">{text}</h3>
      {sub && <p className="mt-2 text-sm text-white/55">{sub}</p>}
    </div>
  );
}

// ============================================================
// PageWrapper - dark gradient background with pulsing blobs
// ============================================================
export function PageWrapper({ children, accents, testId, className = '' }) {
  return (
    <div
      className={`relative min-h-screen text-white ${className}`}
      style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }}
      data-testid={testId}
    >
      <AnimatedBackground accents={accents} />
      <div className="relative container mx-auto px-3 sm:px-4 py-8 md:py-12 max-w-[1400px]">
        {children}
      </div>
    </div>
  );
}
