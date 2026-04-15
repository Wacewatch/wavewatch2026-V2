import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Thèmes standards améliorés
const THEMES = [
  { id: 'dark', name: 'Sombre', gradient: 'from-gray-900 to-gray-800' },
  { id: 'light', name: 'Clair', gradient: 'from-gray-100 to-gray-200' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-blue-900 to-cyan-700' },
  { id: 'forest', name: 'Foret', gradient: 'from-green-900 to-emerald-700' },
  { id: 'midnight', name: 'Minuit', gradient: 'from-indigo-950 to-blue-900' },
  { id: 'aurora', name: 'Aurore', gradient: 'from-teal-800 to-cyan-600' },
  { id: 'desert', name: 'Desert', gradient: 'from-yellow-800 to-orange-700' },
  { id: 'lavender', name: 'Lavande', gradient: 'from-purple-400 to-pink-400' },
  { id: 'crimson', name: 'Cramoisi', gradient: 'from-red-900 to-rose-700' },
  { id: 'jade', name: 'Jade', gradient: 'from-emerald-800 to-teal-700' },
  // 3 nouveaux thèmes gratuits bien différents
  { id: 'cyberpunk', name: 'Cyberpunk', gradient: 'from-fuchsia-900 via-violet-800 to-cyan-900', isNew: true },
  { id: 'monochrome', name: 'Monochrome', gradient: 'from-zinc-900 via-neutral-800 to-stone-900', isNew: true },
  { id: 'sakura', name: 'Sakura', gradient: 'from-pink-200 via-rose-300 to-pink-400', isNew: true },
];

// Thèmes limités (saisonniers)
const LIMITED_THEMES = [
  { id: 'halloween', name: 'Halloween', gradient: 'from-orange-600 via-black to-purple-900' },
  { id: 'christmas', name: 'Noel', gradient: 'from-red-700 via-green-700 to-red-700' },
  { id: 'estival', name: 'Estival', gradient: 'from-yellow-400 via-orange-400 to-pink-500', isNew: true },
];

// Thèmes VIP avec animations améliorées
const PREMIUM_THEMES = [
  { id: 'premium', name: 'Premium', gradient: 'from-yellow-600 via-purple-600 to-yellow-600', requiresVip: true, hasAnimation: true },
  { id: 'royal', name: 'Royal', gradient: 'from-purple-700 to-indigo-800', requiresVip: true, hasAnimation: true },
  // 2 nouveaux thèmes VIP
  { id: 'inferno', name: 'Inferno', gradient: 'from-red-600 via-orange-500 to-yellow-500', requiresVip: true, isNew: true, hasAnimation: true },
  { id: 'arctic', name: 'Arctique', gradient: 'from-blue-400 via-cyan-300 to-teal-400', requiresVip: true, isNew: true, hasAnimation: true },
  // Thèmes VIP+
  { id: 'neon', name: 'Neon', gradient: 'from-pink-500 via-cyan-500 to-pink-500', requiresVipPlus: true, hasAnimation: true },
  { id: 'emerald', name: 'Emeraude', gradient: 'from-emerald-600 to-teal-700', requiresVipPlus: true, hasAnimation: true },
  { id: 'cosmic', name: 'Cosmique', gradient: 'from-purple-600 via-blue-600 to-purple-600', requiresVipPlus: true, hasAnimation: true },
];

// CSS pour les animations des thèmes VIP
const themeAnimations = `
  /* Animations pour thèmes VIP */
  .theme-premium .animate-glow {
    animation: glow 3s ease-in-out infinite;
  }
  
  .theme-inferno .card-hover:hover {
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
    transition: box-shadow 0.3s ease;
  }
  
  .theme-arctic .card-hover:hover {
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.4);
    transition: box-shadow 0.3s ease;
  }
  
  .theme-neon .card-hover:hover {
    box-shadow: 0 0 40px rgba(236, 72, 153, 0.5), 0 0 60px rgba(34, 211, 238, 0.3);
    animation: neon-pulse 1.5s ease-in-out infinite;
  }
  
  .theme-cosmic .card-hover:hover {
    box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
    animation: cosmic-float 2s ease-in-out infinite;
  }
  
  .theme-royal .card-hover:hover {
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
  }
  
  .theme-emerald .card-hover:hover {
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
  }
  
  @keyframes glow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.1); }
  }
  
  @keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.5), 0 0 60px rgba(34, 211, 238, 0.3); }
    50% { box-shadow: 0 0 60px rgba(236, 72, 153, 0.7), 0 0 80px rgba(34, 211, 238, 0.5); }
  }
  
  @keyframes cosmic-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  
  /* Effet de particules pour VIP+ */
  .theme-vip-plus::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.1), transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.05), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.1), transparent);
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: particles-drift 60s linear infinite;
    z-index: 0;
  }
  
  @keyframes particles-drift {
    from { background-position: 0 0; }
    to { background-position: 200px 200px; }
  }
`;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('ww_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.className = theme;
    
    // Ajouter classe pour effets VIP
    const allPremium = PREMIUM_THEMES.map(t => t.id);
    const isVipTheme = allPremium.includes(theme);
    const isVipPlusTheme = PREMIUM_THEMES.find(t => t.id === theme)?.requiresVipPlus;
    
    root.classList.toggle('theme-vip', isVipTheme);
    root.classList.toggle('theme-vip-plus', !!isVipPlusTheme);
    root.classList.toggle(`theme-${theme}`, true);
    
    localStorage.setItem('ww_theme', theme);
    
    // Cleanup old theme classes
    return () => {
      allPremium.forEach(t => root.classList.remove(`theme-${t}`));
      root.classList.remove('theme-vip', 'theme-vip-plus');
    };
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
    <ThemeContext.Provider value={{ theme, setTheme, THEMES, LIMITED_THEMES, PREMIUM_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
