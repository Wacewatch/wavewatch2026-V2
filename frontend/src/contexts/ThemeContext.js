import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Thèmes standards (10) — chaque palette UNIQUE
const THEMES = [
  { id: 'dark',       name: 'Sombre',     gradient: 'from-zinc-900 to-black' },
  { id: 'light',      name: 'Clair',      gradient: 'from-blue-100 via-white to-blue-50' },
  { id: 'ocean',      name: 'Océan',      gradient: 'from-blue-900 to-cyan-700' },
  { id: 'midnight',   name: 'Minuit',     gradient: 'from-indigo-950 to-blue-900' },
  { id: 'desert',     name: 'Désert',     gradient: 'from-yellow-800 to-orange-700' },
  { id: 'crimson',    name: 'Cramoisi',   gradient: 'from-red-900 to-rose-700' },
  { id: 'jade',       name: 'Jade',       gradient: 'from-emerald-800 to-teal-700' },
  { id: 'cyberpunk',  name: 'Cyberpunk',  gradient: 'from-fuchsia-900 via-violet-800 to-cyan-900' },
  { id: 'monochrome', name: 'Monochrome', gradient: 'from-zinc-900 via-neutral-800 to-stone-900' },
  { id: 'sakura',     name: 'Sakura',     gradient: 'from-pink-300 via-rose-300 to-pink-400' },
];

// Thèmes EXCEPTIONNELS gratuits (2)
const EXCEPTIONAL_THEMES = [
  { id: 'solarized', name: 'Récif',       gradient: 'from-cyan-800 via-amber-600 to-orange-700', isNew: true, exceptional: true },
  { id: 'nordic',    name: 'Nordique',    gradient: 'from-slate-700 via-blue-300 to-slate-500', isNew: true, exceptional: true },
];

// Thèmes saisonniers (3)
const LIMITED_THEMES = [
  { id: 'halloween', name: 'Halloween', gradient: 'from-orange-600 via-black to-purple-900' },
  { id: 'christmas', name: 'Noël',      gradient: 'from-red-700 via-green-700 to-red-700' },
  { id: 'estival',   name: 'Estival',   gradient: 'from-yellow-400 via-orange-400 to-pink-500' },
];

// Thèmes VIP standards (4)
const PREMIUM_THEMES = [
  { id: 'premium', name: 'Premium',  gradient: 'from-yellow-600 via-purple-600 to-yellow-600', requiresVip: true, hasAnimation: true },
  { id: 'royal',   name: 'Royal',    gradient: 'from-purple-700 to-indigo-800',                requiresVip: true, hasAnimation: true },
  { id: 'inferno', name: 'Inferno',  gradient: 'from-red-600 via-orange-500 to-yellow-500',    requiresVip: true, hasAnimation: true },
  { id: 'arctic',  name: 'Arctique', gradient: 'from-blue-400 via-cyan-300 to-teal-400',       requiresVip: true, hasAnimation: true },

  // VIP EXCEPTIONNELS (2)
  { id: 'borealis', name: 'Aurore Boréale', gradient: 'from-emerald-400 via-violet-500 to-pink-400', requiresVip: true, hasAnimation: true, isNew: true, exceptional: true },
  { id: 'obsidian', name: 'Obsidienne',     gradient: 'from-black via-amber-700 to-black',          requiresVip: true, hasAnimation: true, isNew: true, exceptional: true },

  // VIP+ (3)
  { id: 'neon',    name: 'Néon',     gradient: 'from-pink-500 via-cyan-500 to-pink-500',         requiresVipPlus: true, hasAnimation: true },
  { id: 'emerald', name: 'Émeraude', gradient: 'from-emerald-600 to-teal-700',                   requiresVipPlus: true, hasAnimation: true },
  { id: 'cosmic',  name: 'Cosmique', gradient: 'from-purple-600 via-blue-600 to-purple-600',     requiresVipPlus: true, hasAnimation: true },
];

// Liste des IDs VIP exceptionnels (pour ajouter classes spécifiques)
const VIP_THEMES_IDS = PREMIUM_THEMES.map(t => t.id);

// CSS pour les animations des thèmes VIP
const themeAnimations = `
  /* ===== ANIMATIONS THEMES VIP ===== */

  /* Glow sur les cartes au hover */
  .theme-premium .group:hover > a > div,
  .theme-premium .group:hover > div { box-shadow: 0 0 25px rgba(251, 191, 36, 0.25); }
  .theme-inferno .group:hover > a > div,
  .theme-inferno .group:hover > div { box-shadow: 0 0 25px rgba(239, 68, 68, 0.3); }
  .theme-arctic .group:hover > a > div,
  .theme-arctic .group:hover > div { box-shadow: 0 0 25px rgba(34, 211, 238, 0.3); }
  .theme-royal .group:hover > a > div,
  .theme-royal .group:hover > div { box-shadow: 0 0 25px rgba(139, 92, 246, 0.3); }
  .theme-borealis .group:hover > a > div,
  .theme-borealis .group:hover > div { box-shadow: 0 0 30px rgba(16, 185, 129, 0.35), 0 0 60px rgba(168, 85, 247, 0.2); }
  .theme-obsidian .group:hover > a > div,
  .theme-obsidian .group:hover > div { box-shadow: 0 0 30px rgba(251, 191, 36, 0.35), 0 0 1px rgba(251, 191, 36, 0.6); }
  .theme-neon .group:hover > a > div,
  .theme-neon .group:hover > div { box-shadow: 0 0 30px rgba(236, 72, 153, 0.4), 0 0 60px rgba(34, 211, 238, 0.2); }
  .theme-emerald .group:hover > a > div,
  .theme-emerald .group:hover > div { box-shadow: 0 0 25px rgba(16, 185, 129, 0.3); }
  .theme-cosmic .group:hover > a > div,
  .theme-cosmic .group:hover > div { box-shadow: 0 0 25px rgba(147, 51, 234, 0.35); }

  /* Bordure animée navigation VIP */
  .theme-premium nav,
  .theme-inferno nav,
  .theme-arctic nav,
  .theme-royal nav {
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent) 1;
    animation: nav-shimmer 4s ease-in-out infinite;
  }
  .theme-neon nav {
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, #ec4899, #22d3ee, #ec4899) 1;
    animation: nav-shimmer 3s linear infinite;
  }
  .theme-cosmic nav {
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed) 1;
    animation: nav-shimmer 5s ease-in-out infinite;
  }
  .theme-emerald nav {
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, transparent, #10b981, transparent) 1;
  }

  @keyframes nav-shimmer {
    0%, 100% { filter: hue-rotate(0deg); }
    50% { filter: hue-rotate(20deg); }
  }

  /* Particules VIP+ */
  @keyframes particles-drift {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-200px, -200px, 0); }
  }
  .theme-vip-plus::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    background-image:
      radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.25), transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.18), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.22), transparent),
      radial-gradient(1.5px 1.5px at 130px 80px, rgba(255,255,255,0.2), transparent),
      radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.16), transparent);
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: particles-drift 40s linear infinite;
    z-index: 9999;
  }

  /* Ambient glow VIP général */
  @keyframes vip-ambient {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  .theme-vip:not(.theme-vip-plus):not(.theme-borealis):not(.theme-obsidian) body::after {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    background: radial-gradient(ellipse at 20% 50%, hsla(var(--primary-hsl-fallback, 45 90% 55%) / 0.06), transparent 60%),
                radial-gradient(ellipse at 80% 50%, hsla(var(--primary-hsl-fallback, 45 90% 55%) / 0.05), transparent 60%);
    animation: vip-ambient 10s ease-in-out infinite alternate;
    z-index: 9998;
  }

  /* Scrollbars stylées par thème VIP */
  .theme-premium ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #fbbf24, #a855f7); }
  .theme-royal ::-webkit-scrollbar-thumb   { background: linear-gradient(180deg, #8b5cf6, #6366f1); }
  .theme-inferno ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #ef4444, #f97316); }
  .theme-arctic ::-webkit-scrollbar-thumb  { background: linear-gradient(180deg, #22d3ee, #14b8a6); }
  .theme-neon ::-webkit-scrollbar-thumb    { background: linear-gradient(180deg, #ec4899, #22d3ee); }
  .theme-emerald ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #10b981, #14b8a6); }
  .theme-cosmic ::-webkit-scrollbar-thumb  { background: linear-gradient(180deg, #7c3aed, #3b82f6); }

  /* Glow titres VIP */
  .theme-premium h1, .theme-premium h2 { text-shadow: 0 0 12px rgba(251, 191, 36, 0.2); }
  .theme-royal h1, .theme-royal h2     { text-shadow: 0 0 12px rgba(139, 92, 246, 0.2); }
  .theme-inferno h1, .theme-inferno h2 { text-shadow: 0 0 12px rgba(249, 115, 22, 0.2); }
  .theme-neon h1, .theme-neon h2       { text-shadow: 0 0 12px rgba(236, 72, 153, 0.3), 0 0 24px rgba(34, 211, 238, 0.2); }
  .theme-cosmic h1, .theme-cosmic h2   { text-shadow: 0 0 12px rgba(124, 58, 237, 0.25); }
  .theme-borealis h1, .theme-borealis h2 { text-shadow: 0 0 12px rgba(16, 185, 129, 0.25), 0 0 24px rgba(168, 85, 247, 0.2); }
`;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('ww_theme');
    // Reset removed/legacy themes
    const REMOVED = ['forest', 'aurora', 'lavender'];
    if (saved && REMOVED.includes(saved)) return 'halloween';
    return saved || 'halloween'; // 🎃 Halloween par défaut
  });

  useEffect(() => {
    const root = document.documentElement;
    // Reset all theme classes
    const allThemeIds = [
      ...THEMES, ...EXCEPTIONAL_THEMES, ...LIMITED_THEMES, ...PREMIUM_THEMES,
      // legacy classes pour compatibilité
      { id: 'forest' }, { id: 'aurora' }, { id: 'lavender' },
    ].map(t => `theme-${t.id}`);
    root.classList.remove(...allThemeIds, 'theme-vip', 'theme-vip-plus');
    root.className = theme; // ex: 'dark', 'borealis', etc.

    const isVip = VIP_THEMES_IDS.includes(theme);
    const isVipPlus = !!PREMIUM_THEMES.find(t => t.id === theme)?.requiresVipPlus;

    root.classList.toggle('theme-vip', isVip);
    root.classList.toggle('theme-vip-plus', isVipPlus);
    root.classList.add(`theme-${theme}`);

    localStorage.setItem('ww_theme', theme);
  }, [theme]);

  // Inject theme animations CSS
  useEffect(() => {
    const styleId = 'ww-theme-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = themeAnimations;
      document.head.appendChild(style);
    }
  }, []);

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      THEMES, EXCEPTIONAL_THEMES, LIMITED_THEMES, PREMIUM_THEMES,
      // Pour compat: la prop "THEMES" globale = tous les gratuits standards + exceptionnels
      ALL_FREE_THEMES: [...THEMES, ...EXCEPTIONAL_THEMES],
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
