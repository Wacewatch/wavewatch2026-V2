import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { ThemedPage, ThemedHero } from '../components/design/ThemedPage';
import { LoadingSpinner } from '../components/Loading';
import { Sparkles, Ghost, TreePine, Sun, Heart, Cake, Zap, Calendar as CalIcon, Clock, Trophy } from 'lucide-react';

const ICON_MAP = { Ghost, TreePine, Sun, Heart, Cake, Sparkles, Zap };
const MONTHS = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function fmtRange(e) {
  const sameMonth = e.month_start === e.month_end;
  if (sameMonth) {
    if (e.day_start === 1 && e.day_end >= 28) return `${MONTHS[e.month_start]}`;
    return `${e.day_start}-${e.day_end} ${MONTHS[e.month_start]}`;
  }
  return `${e.day_start} ${MONTHS[e.month_start]} → ${e.day_end} ${MONTHS[e.month_end]}`;
}

function daysUntil(e, now) {
  const y = now.getFullYear();
  // Try this year start, else next year
  const startThis = new Date(y, e.month_start - 1, e.day_start);
  const candidate = startThis < now ? new Date(y + 1, e.month_start - 1, e.day_start) : startThis;
  return Math.ceil((candidate - now) / (1000 * 60 * 60 * 24));
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    API.get('/api/seasonal-events')
      .then(({ data }) => setEvents((data.events || []).filter(e => e.active)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Sort: active now first, then by days_until ascending
  const sorted = [...events].sort((a, b) => {
    if (a.currently_active && !b.currently_active) return -1;
    if (!a.currently_active && b.currently_active) return 1;
    return daysUntil(a, now) - daysUntil(b, now);
  });
  const activeNow = sorted.filter(e => e.currently_active);
  const upcoming = sorted.filter(e => !e.currently_active);

  if (loading) return <ThemedPage testId="events-page"><div className="container mx-auto px-4 py-16"><LoadingSpinner /></div></ThemedPage>;

  return (
    <ThemedPage testId="events-page">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <ThemedHero
          badge="Événements WaveWatch"
          badgeIcon={CalIcon}
          title="Calendrier"
          subtitle="des"
          highlight="Événements Saisonniers"
          description="Profite de bonus XP et de thèmes exclusifs pendant les périodes spéciales : Halloween, Noël, été, anniversaire de la plateforme et plus encore."
          stats={[
            { icon: Sparkles, label: 'Événements actifs',    value: activeNow.length, color: 'hsl(var(--primary))' },
            { icon: CalIcon,  label: 'À venir',              value: upcoming.length,  color: 'hsl(var(--accent))' },
            { icon: Trophy,   label: 'Bonus XP max',         value: `×${Math.max(1, ...events.map(e => e.xp_multiplier || 1))}`, color: 'hsl(var(--ring))' },
          ]}
        />

        {activeNow.length > 0 && (
          <section data-testid="events-active-section">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-300">Actifs maintenant</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeNow.map(e => <EventCard key={e.id} event={e} active />)}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section data-testid="events-upcoming-section">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Clock className="w-4 h-4 text-foreground/60" />
              <p className="text-xs uppercase tracking-widest font-extrabold text-foreground/60">Prochains événements</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <p className="text-center py-16 text-foreground/50" data-testid="events-empty">Aucun événement programmé pour l'instant.</p>
        )}

        {/* CTA inscription */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 p-8 md:p-10 mt-12" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.10))' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ background: 'hsl(var(--primary))' }} />
          <div className="relative flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex-1">
              <p className="text-2xl md:text-3xl font-black text-foreground mb-2">Rejoins la fête 🎉</p>
              <p className="text-foreground/70">Créé un compte gratuit pour gagner du XP, débloquer des thèmes exclusifs pendant les événements et grimper dans le classement.</p>
            </div>
            <Link to="/register" className="px-6 py-3 rounded-xl font-black text-white whitespace-nowrap shadow-2xl transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }} data-testid="events-cta-register">
              S'inscrire gratuitement
            </Link>
          </div>
        </div>
      </div>
    </ThemedPage>
  );
}

function EventCard({ event, active = false }) {
  const Icon = ICON_MAP[event.icon] || Sparkles;
  const c = event.color || '#a855f7';
  const days = daysUntil(event, new Date());
  const daysLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : days <= 7 ? `Dans ${days} jours` : days <= 30 ? `Dans ${days} jours` : `Dans ${Math.floor(days / 30)} mois`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl p-5 transition-all hover:scale-[1.01] hover:-translate-y-0.5 ${active ? 'shadow-2xl' : ''}`}
      style={{
        borderColor: active ? `${c}80` : `${c}40`,
        background: `linear-gradient(135deg, ${c}20 0%, transparent 60%, ${c}10 100%)`,
        boxShadow: active ? `0 16px 60px ${c}44` : `0 8px 32px ${c}22`,
      }}
      data-testid={`event-card-${event.slug}`}>
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-40" style={{ background: c }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)`, boxShadow: `0 8px 24px ${c}66` }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-tight">{event.name}</p>
              <p className="text-xs text-foreground/60 capitalize">{fmtRange(event)}</p>
            </div>
          </div>
          {active ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-400/40 animate-pulse">En cours</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest" style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}>{daysLabel}</span>
          )}
        </div>

        <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{event.description}</p>

        <div className="flex flex-wrap gap-2">
          {event.xp_multiplier > 1 && (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)`, boxShadow: `0 4px 12px ${c}66` }}>
              ×{event.xp_multiplier} XP
            </span>
          )}
          {event.auto_theme && (
            <span className="px-3 py-1 rounded-full text-xs font-bold capitalize" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.30)' }}>
              Thème {event.auto_theme}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
