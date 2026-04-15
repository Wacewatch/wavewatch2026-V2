import React from 'react';
import { Crown, Star, Clock } from 'lucide-react';

export default function SubscriptionPage() {
  const plans = [
    { name: 'Gratuit', price: '0', features: ['Acces aux films et series', 'Recherche de contenu', 'Themes standards', 'Playlists basiques'], current: true },
    { name: 'VIP', price: '4.99', badge: <Crown className="w-5 h-5 text-yellow-400" />, features: ['Tout le plan Gratuit', 'Themes VIP exclusifs', 'Badge VIP', 'Priorite de streaming', 'Pas de publicite'], highlight: true },
    { name: 'VIP+', price: '9.99', badge: <Crown className="w-5 h-5 text-purple-400" />, features: ['Tout le plan VIP', 'Themes VIP+ exclusifs', 'Badge VIP+', 'Acces anticipe aux nouveautes', 'Support prioritaire'] },
  ];

  return (
    <div className="container mx-auto px-4 py-8" data-testid="subscription-page">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
        <p className="text-xl text-muted-foreground">Debloquez des fonctionnalites exclusives</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map(p => (
          <div key={p.name} className={`bg-card border rounded-2xl p-6 ${p.highlight ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-4"><h2 className="text-2xl font-bold">{p.name}</h2>{p.badge}</div>
            <div className="mb-6"><span className="text-4xl font-bold">{p.price}EUR</span><span className="text-muted-foreground">/mois</span></div>
            <ul className="space-y-3 mb-8">
              {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-primary flex-shrink-0" />{f}</li>)}
            </ul>
            {p.current ? (
              <button className="w-full py-2.5 rounded-lg font-medium bg-secondary text-secondary-foreground cursor-default">Plan actuel</button>
            ) : (
              <button disabled className="w-full py-2.5 rounded-lg font-medium bg-gray-700 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2 opacity-60" data-testid={`plan-btn-${p.name}`}>
                <Clock className="w-4 h-4" />Bientot disponible
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
