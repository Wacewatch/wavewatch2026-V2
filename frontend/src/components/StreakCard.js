import React, { useEffect, useState } from 'react';
import API from '../lib/api';
import { Flame, Trophy, Calendar, AlertCircle } from 'lucide-react';

export default function StreakCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    API.get('/api/user/streak')
      .then(({ data }) => { if (mounted) setData(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-5 animate-pulse h-40" data-testid="streak-card-loading" />
    );
  }
  if (!data) return null;

  const { current_streak, longest_streak, total_active_days, next_milestone, is_active_today, at_risk } = data;
  const next = next_milestone;
  const progressPct = next ? Math.min(100, Math.round((current_streak / next.days) * 100)) : 100;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-950/60 via-orange-950/40 to-rose-950/40 p-5 backdrop-blur-xl"
      data-testid="streak-card"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-50" style={{ background: 'hsl(30 95% 55%)' }} />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(0 95% 55%)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${current_streak > 0 ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-amber-500/50' : 'bg-amber-950/40 border border-amber-500/30'}`}>
              <Flame className={`w-7 h-7 ${current_streak > 0 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-amber-400/60'}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200/80">Série de visionnage</p>
              <p className="text-4xl font-black text-white tabular-nums leading-none mt-1" data-testid="streak-current">
                {current_streak}<span className="text-lg text-amber-200/70 ml-1.5 font-bold">j</span>
              </p>
            </div>
          </div>
          {at_risk && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400/40">
              <AlertCircle className="w-3.5 h-3.5 text-red-300" />
              <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">À risque</span>
            </div>
          )}
          {is_active_today && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/40">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-200 uppercase tracking-wider">Actif</span>
            </div>
          )}
        </div>

        {/* Progress to next milestone */}
        {next ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-amber-100/80 font-medium">Prochain palier : <span className="font-bold text-amber-200">{next.days} jours</span></p>
              <p className="text-xs font-bold text-amber-200">+{next.xp} XP</p>
            </div>
            <div className="h-2 bg-amber-950/50 rounded-full overflow-hidden border border-amber-500/20">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
                data-testid="streak-progress-bar"
              />
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1">{next.days - current_streak} jour{next.days - current_streak > 1 ? 's' : ''} restant{next.days - current_streak > 1 ? 's' : ''}</p>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/40">
            <p className="text-sm font-bold text-amber-100">👑 Tous les paliers atteints !</p>
            <p className="text-xs text-amber-200/70">Tu es une légende. Continue !</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-amber-500/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-300" />
            <div>
              <p className="text-[10px] uppercase text-amber-200/60 font-bold">Record</p>
              <p className="text-sm font-black text-white tabular-nums">{longest_streak} j</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-300" />
            <div>
              <p className="text-[10px] uppercase text-amber-200/60 font-bold">Total jours</p>
              <p className="text-sm font-black text-white tabular-nums">{total_active_days}</p>
            </div>
          </div>
        </div>

        {current_streak === 0 && (
          <p className="text-xs text-amber-200/70 mt-3 italic">💡 Marque un film ou un épisode comme vu pour démarrer ta série !</p>
        )}
      </div>
    </div>
  );
}
