import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Trophy, Crown, Medal, Star, Award, Zap, Sparkles } from 'lucide-react';
import { ThemedPage, ThemedHero } from '../components/design/ThemedPage';
import LevelCard from '../components/LevelCard';
import { useAuth } from '../contexts/AuthContext';
import { useUserXP, REWARD_PALIERS, getTier } from '../lib/xp';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { xp, level, tier } = useUserXP(user);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/api/vip-game/winners').then(({ data }) => setWinners(data.winners || [])).catch(() => {}),
      API.get('/api/leaderboard').then(({ data }) => setLeaderboard(data.leaderboard || [])).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <ThemedPage testId="leaderboard-page"><div className="container mx-auto px-4 py-16"><LoadingSpinner /></div></ThemedPage>
  );

  const medalColors = ['#fbbf24', '#cbd5e1', '#f97316'];

  return (
    <ThemedPage testId="leaderboard-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ThemedHero
          badge="Communauté"
          badgeIcon={Trophy}
          title="Classement"
          subtitle="&"
          highlight="Récompenses"
          description="Le top de la communauté WaveWatch — gagnants du jeu VIP, supporters les plus actifs et système de progression XP."
        />

        {/* === MON NIVEAU (si connecté) === */}
        {user && (
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2 px-1">Mon rang personnel</p>
            <LevelCard xp={xp} level={level} testId="my-level-card" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* VIP Game Winners */}
          <div className="rounded-2xl border border-border bg-card/85 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--ring) / 0.25), hsl(var(--accent) / 0.2))' }}>
              <h2 className="text-lg font-black flex items-center gap-2 text-foreground"><Crown className="w-5 h-5" style={{ color: 'hsl(45 95% 55%)' }} />Gagnants du Jeu VIP</h2>
              <p className="text-xs text-foreground/60 mt-0.5">Les derniers heureux gagnants du statut VIP gratuit</p>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {winners.length === 0 ? (
                <p className="text-center py-8 text-foreground/50 text-sm">Aucun gagnant pour le moment</p>
              ) : winners.map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-foreground/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={i < 3 ? { background: `linear-gradient(135deg, ${medalColors[i]}, ${medalColors[i]}99)`, boxShadow: `0 4px 12px ${medalColors[i]}55` } : { background: 'hsl(var(--secondary))' }}>
                    {i < 3 ? <Medal className="w-5 h-5 text-white" /> : <span className="text-xs font-bold text-foreground/60">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground flex items-center gap-1.5 truncate">{w.username}<Crown className="w-3 h-3" style={{ color: 'hsl(45 95% 55%)' }} /></p>
                    <p className="text-[11px] text-foreground/60">{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Supporters */}
          <div className="rounded-2xl border border-border bg-card/85 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2))' }}>
              <h2 className="text-lg font-black flex items-center gap-2 text-foreground"><Star className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />Top Supporters</h2>
              <p className="text-xs text-foreground/60 mt-0.5">Les membres les plus actifs de la communauté</p>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-foreground/50 text-sm">Aucune donnée</p>
              ) : leaderboard.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-foreground/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={i < 3 ? { background: `linear-gradient(135deg, ${medalColors[i]}, ${medalColors[i]}99)`, boxShadow: `0 4px 12px ${medalColors[i]}55` } : { background: 'hsl(var(--secondary))' }}>
                    {i < 3 ? <Medal className="w-5 h-5 text-white" /> : <span className="text-xs font-bold text-foreground/60">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground flex items-center gap-1.5 truncate">
                      {u.username}
                      {u.is_vip_plus && <span className="px-1.5 py-0.5 text-[9px] rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">VIP+</span>}
                      {u.is_vip && !u.is_vip_plus && <span className="px-1.5 py-0.5 text-[9px] rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">VIP</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === SYSTÈME XP === */}
        <div className="rounded-2xl border border-border bg-card/85 backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--accent) / 0.25), hsl(var(--ring) / 0.2))' }}>
            <h2 className="text-lg font-black flex items-center gap-2 text-foreground"><Zap className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />Système de niveaux</h2>
            <p className="text-xs text-foreground/60 mt-0.5">Gagne de l'XP en utilisant la plateforme — chaque palier débloque une récompense</p>
          </div>

          {/* Tiers */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[1, 6, 11, 21, 36].map(lv => {
              const t = getTier(lv);
              const isMine = level >= lv && (lv === 1 || level >= lv) && level < (lv === 1 ? 6 : lv === 6 ? 11 : lv === 11 ? 21 : lv === 21 ? 36 : Infinity);
              return (
                <div key={lv} className={`relative overflow-hidden rounded-xl border-2 p-3 text-center ${isMine ? 'shadow-xl' : ''}`}
                  style={{ borderColor: isMine ? `${t.hex}` : `${t.hex}33`, background: `linear-gradient(135deg, ${t.from}15, ${t.to}10)`, boxShadow: isMine ? `0 8px 24px ${t.glow}` : 'none' }}>
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-black shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
                    {lv === 36 ? '∞' : lv}+
                  </div>
                  <p className="text-xs font-black" style={{ color: t.hex }}>{t.name}</p>
                  {isMine && <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-400 mt-0.5">Vous êtes ici</p>}
                </div>
              );
            })}
          </div>

          {/* Récompenses paliers */}
          <div className="px-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 mb-2">Récompenses débloquables</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REWARD_PALIERS.map(p => {
                const unlocked = user && level >= p.level;
                return (
                  <div key={p.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${unlocked ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-border bg-background/40'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${unlocked ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/30' : 'bg-foreground/10'}`}>
                      <Award className={`w-4 h-4 ${unlocked ? 'text-white' : 'text-foreground/30'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                        {p.name}
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-foreground/10 text-foreground/70">Niv. {p.level}</span>
                      </p>
                      <p className="text-[11px] text-foreground/60">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* XP sources */}
          <div className="px-4 pb-4 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />Comment gagner de l'XP
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+10 XP par film vu',           hex: '#3b82f6' },
                { label: '+15 XP par série vue',         hex: '#a855f7' },
                { label: '+5 XP par favori',             hex: '#ec4899' },
                { label: '+20 XP par playlist',          hex: '#10b981' },
                { label: '+2 XP par like',               hex: '#f59e0b' },
                { label: '+30 XP par heure de visionnage', hex: '#06b6d4' },
              ].map(s => (
                <span key={s.label} className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  style={{ background: `${s.hex}15`, borderColor: `${s.hex}40`, color: s.hex }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemedPage>
  );
}
