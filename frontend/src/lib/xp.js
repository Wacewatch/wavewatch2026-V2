/**
 * Système d'XP, Niveau, Tier et Récompenses partagé par toute l'application.
 * Utilisé par DashboardPage, ProfilePage, LeaderboardPage, ThemeContext.
 */

export function computeXP({ movies = 0, shows = 0, likes = 0, favorites = 0, playlists = 0, hours = 0 } = {}) {
  return Math.floor(
    movies * 10
    + shows * 15
    + likes * 2
    + favorites * 5
    + playlists * 20
    + hours * 0.5
  );
}

// Niveau N atteint quand XP ≥ (N-1)² × 100
export function getLevel(xp) {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
}

export function getLevelBounds(level) {
  return {
    current: (level - 1) * (level - 1) * 100,
    next: level * level * 100,
  };
}

export function getTier(level) {
  if (level >= 36) return { id: 'diamond',  name: 'Diamant',   hex: '#67e8f9', from: '#b9f2ff', to: '#6e9cdb', glow: 'rgba(186, 247, 255, 0.5)' };
  if (level >= 21) return { id: 'platinum', name: 'Platine',   hex: '#a7c5e8', from: '#c8e0f0', to: '#4682b4', glow: 'rgba(167, 197, 232, 0.5)' };
  if (level >= 11) return { id: 'gold',     name: 'Or',        hex: '#fcd34d', from: '#ffd700', to: '#d4af37', glow: 'rgba(252, 211, 77, 0.5)' };
  if (level >= 6)  return { id: 'silver',   name: 'Argent',    hex: '#cbd5e1', from: '#e2e8f0', to: '#94a3b8', glow: 'rgba(203, 213, 225, 0.4)' };
  return                  { id: 'bronze',   name: 'Bronze',    hex: '#d97706', from: '#cd7f32', to: '#92400e', glow: 'rgba(217, 119, 6, 0.5)' };
}

/**
 * Récompenses débloquées par niveau (palier).
 * @returns objet décrivant ce qui est débloqué et les paliers à venir.
 */
export const REWARD_PALIERS = [
  { level: 5,  type: 'badge',  id: 'bronze-badge', name: 'Badge Bronze',          desc: 'Badge Bronze visible sur ton profil partout' },
  { level: 10, type: 'frame',  id: 'silver-frame', name: 'Cadre Argent',          desc: 'Avatar entouré d\'un cadre argenté brillant' },
  { level: 20, type: 'theme',  id: 'borealis',     name: 'Thème "Aurore Boréale"', desc: 'Thème VIP exceptionnel débloqué gratuitement' },
  { level: 35, type: 'theme',  id: 'obsidian',     name: 'Thème "Obsidienne"',     desc: 'Thème VIP exceptionnel ultime débloqué' },
];

export function getRewards(level) {
  const unlocked = REWARD_PALIERS.filter(p => level >= p.level);
  const next = REWARD_PALIERS.find(p => level < p.level);
  return { unlocked, next };
}

export function isThemeUnlockedByLevel(themeId, level) {
  return REWARD_PALIERS.some(p => p.type === 'theme' && p.id === themeId && level >= p.level);
}

/**
 * Hook React qui calcule XP/Niveau d'un utilisateur en récupérant ses stats.
 * Cache simple via window pour éviter les re-fetch entre pages.
 */
import { useState, useEffect } from 'react';
import API from './api';

const _xpCache = { data: null, ts: 0 };

export function useUserXP(user) {
  const [data, setData] = useState({ xp: 0, level: 1, tier: getTier(1), bounds: getLevelBounds(1), rewards: getRewards(1), loading: !!user });

  useEffect(() => {
    if (!user) { setData(d => ({ ...d, loading: false })); return; }
    // Cache 60s
    if (_xpCache.data && (Date.now() - _xpCache.ts) < 60000) {
      const c = _xpCache.data;
      setData({ ...c, loading: false });
      return;
    }
    Promise.all([
      API.get('/api/user/stats').catch(() => ({ data: {} })),
      API.get('/api/user/stats/detailed').catch(() => ({ data: {} })),
    ]).then(([s1, s2]) => {
      const stats = s1.data || {};
      const detailed = s2.data || {};
      const xp = computeXP({
        movies:    detailed.movies_watched || 0,
        shows:     detailed.shows_watched  || 0,
        likes:     detailed.likes_given    || 0,
        favorites: stats.favorites         || 0,
        playlists: stats.playlists         || 0,
        hours:     Math.round((detailed.total_minutes_watched || 0) / 60),
      });
      const level = getLevel(xp);
      const out = { xp, level, tier: getTier(level), bounds: getLevelBounds(level), rewards: getRewards(level) };
      _xpCache.data = out; _xpCache.ts = Date.now();
      setData({ ...out, loading: false });
    });
  }, [user]);

  return data;
}
