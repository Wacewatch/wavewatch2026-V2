import React from 'react';
import { Crown, Star, Clock, Check, Sparkles, Zap, Shield } from 'lucide-react';
import { ThemedPage, ThemedHero } from '../components/design/ThemedPage';

export default function SubscriptionPage() {
  const plans = [
    {
      name: 'Gratuit',
      price: '0',
      icon: Star,
      hex: '#94a3b8',
      gradFrom: 'from-slate-500',
      gradTo: 'to-slate-600',
      features: ['Accès aux films et séries', 'Recherche de contenu', 'Thèmes standards', 'Playlists basiques'],
      current: true,
    },
    {
      name: 'VIP',
      price: '4.99',
      icon: Crown,
      hex: '#f59e0b',
      gradFrom: 'from-amber-400',
      gradTo: 'to-orange-500',
      features: ['Tout le plan Gratuit', 'Thèmes VIP exclusifs', 'Badge VIP doré', 'Priorité de streaming', 'Pas de publicité'],
      highlight: true,
      tag: 'Populaire',
    },
    {
      name: 'VIP+',
      price: '9.99',
      icon: Sparkles,
      hex: '#a855f7',
      gradFrom: 'from-purple-400',
      gradTo: 'to-pink-500',
      features: ['Tout le plan VIP', 'Thèmes VIP+ avec animations', 'Badge VIP+ violet', 'Accès anticipé aux nouveautés', 'Support prioritaire 24/7'],
      tag: 'Premium',
    },
  ];

  return (
    <ThemedPage testId="subscription-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ThemedHero
          badge="Abonnement"
          badgeIcon={Crown}
          title="Choisis"
          subtitle="ton"
          highlight="plan"
          description="Débloque des fonctionnalités exclusives, des thèmes premium et soutiens le développement de WaveWatch."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {plans.map(p => {
            const I = p.icon;
            return (
              <div
                key={p.name}
                className={`relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all hover:-translate-y-1 ${p.highlight ? 'border-2 scale-[1.02] shadow-2xl' : 'border border-border'} bg-card/85`}
                style={p.highlight ? { borderColor: p.hex, boxShadow: `0 16px 40px ${p.hex}55, 0 0 0 1px ${p.hex}80` } : {}}
                data-testid={`plan-${p.name}`}
              >
                {/* Glow */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: p.hex }} />

                {/* Tag */}
                {p.tag && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${p.hex}, ${p.hex}99)` }}>
                    {p.tag}
                  </div>
                )}

                <div className="relative p-6 md:p-7">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.gradFrom} ${p.gradTo} flex items-center justify-center mb-4 shadow-lg`} style={{ boxShadow: `0 8px 24px ${p.hex}55` }}>
                    <I className="w-7 h-7 text-white" />
                  </div>

                  {/* Name + price */}
                  <h2 className="text-2xl font-black text-foreground mb-1">{p.name}</h2>
                  <div className="mb-5 flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${p.hex}, ${p.hex}aa)` }}>
                      {p.price}€
                    </span>
                    <span className="text-foreground/50 text-sm">/mois</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
                        <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${p.hex}33`, color: p.hex }}>
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {p.current ? (
                    <button className="w-full py-3 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground cursor-default flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />Plan actuel
                    </button>
                  ) : (
                    <button disabled className="w-full py-3 rounded-xl font-bold text-sm bg-foreground/10 text-foreground/40 cursor-not-allowed flex items-center justify-center gap-2 border border-border" data-testid={`plan-btn-${p.name}`}>
                      <Clock className="w-4 h-4" />Bientôt disponible
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bonus tip */}
        <div className="mt-10 relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 md:p-6 text-center">
          <div className="absolute -top-10 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: 'hsl(var(--primary) / 0.6)' }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40 mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <p className="text-foreground font-bold text-lg mb-1">Pas envie de payer ? Tente ta chance !</p>
            <p className="text-foreground/60 text-sm mb-4">Le <span className="text-foreground font-bold">jeu VIP quotidien</span> te permet de gagner 1 jour de VIP gratuit chaque jour.</p>
            <a href="/vip-game" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all">
              <Sparkles className="w-4 h-4" />Jouer maintenant
            </a>
          </div>
        </div>
      </div>
    </ThemedPage>
  );
}
