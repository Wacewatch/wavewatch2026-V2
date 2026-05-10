import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Sparkles, Calendar } from 'lucide-react';

/**
 * Carte « Mes bonus XP » : agrège les bonus XP gagnés via les événements saisonniers.
 * Lit /api/user/xp-bonuses → affiche le total + une liste par événement + 5 dernières actions.
 */
export default function BonusXPCard({ compact = false }) {
  const [data, setData] = useState({ total_bonus_xp: 0, by_event: {}, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/user/xp-bonuses')
      .then(({ data }) => setData(data || { total_bonus_xp: 0, by_event: {}, recent: [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  const total = data.total_bonus_xp || 0;
  const byEvent = data.by_event || {};
  const recent = data.recent || [];
  const eventEntries = Object.entries(byEvent).sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5" data-testid="bonus-xp-card-empty">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <p className="font-black text-foreground">Mes bonus événement</p>
        </div>
        <p className="text-sm text-foreground/60">Aucun bonus pour le moment. Regarde des films ou séries pendant un événement actif (Halloween, Noël, été…) pour gagner du XP supplémentaire !</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/70 backdrop-blur-xl p-5" data-testid="bonus-xp-card">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(var(--primary))' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-foreground">Mes bonus événement</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">Gagnés en saison</p>
            </div>
          </div>
          <p className="text-2xl font-black tabular-nums" style={{ color: 'hsl(var(--primary))' }}>+{total.toLocaleString('fr-FR')}<span className="text-foreground/50 text-sm ml-1">XP</span></p>
        </div>

        {!compact && eventEntries.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {eventEntries.slice(0, 5).map(([slug, val]) => (
              <div key={slug} className="flex items-center justify-between px-3 py-2 rounded-lg bg-foreground/5" data-testid={`bonus-event-${slug}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />
                  <span className="text-sm font-bold text-foreground capitalize truncate">{slug.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs font-extrabold tabular-nums" style={{ color: 'hsl(var(--primary))' }}>+{val} XP</span>
              </div>
            ))}
          </div>
        )}

        {!compact && recent.length > 0 && (
          <details className="text-xs text-foreground/60">
            <summary className="cursor-pointer font-bold uppercase tracking-widest text-[10px] hover:text-foreground/80">Détail des {Math.min(recent.length, 10)} dernières actions</summary>
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {recent.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-foreground/5">
                  <span className="truncate">{r.content_type} #{r.content_id} <span className="text-foreground/40">· {r.event_slug}</span></span>
                  <span className="font-bold flex-shrink-0 ml-2" style={{ color: 'hsl(var(--primary))' }}>+{r.bonus_xp}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
