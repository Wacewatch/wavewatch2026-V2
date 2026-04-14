import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

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
];

const LIMITED_THEMES = [
  { id: 'halloween', name: 'Halloween', gradient: 'from-orange-600 via-black to-purple-900' },
  { id: 'christmas', name: 'Noel', gradient: 'from-red-700 via-green-700 to-red-700' },
];

const PREMIUM_THEMES = [
  { id: 'premium', name: 'Premium', gradient: 'from-yellow-600 via-purple-600 to-yellow-600', requiresVip: true },
  { id: 'royal', name: 'Royal', gradient: 'from-purple-700 to-indigo-800', requiresVip: true },
  { id: 'neon', name: 'Neon', gradient: 'from-pink-500 via-cyan-500 to-pink-500', requiresVipPlus: true },
  { id: 'emerald', name: 'Emeraude', gradient: 'from-emerald-600 to-teal-700', requiresVipPlus: true },
  { id: 'cosmic', name: 'Cosmique', gradient: 'from-purple-600 via-blue-600 to-purple-600', requiresVipPlus: true },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('ww_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.className = theme;
    localStorage.setItem('ww_theme', theme);
  }, [theme]);

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
