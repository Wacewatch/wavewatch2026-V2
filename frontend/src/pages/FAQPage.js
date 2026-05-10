import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, Sparkles, Search, X, Star, Crown, Heart, Bug, Settings, Shield, ListMusic } from 'lucide-react';

const FAQS = [
  { cat: 'general', icon: Star,     q: 'Comment regarder un film ou une série ?',                       a: "Clique sur le contenu souhaité, puis appuie sur le bouton 'Regarder' pour accéder au streaming." },
  { cat: 'vip',     icon: Crown,    q: 'Comment devenir VIP ?',                                          a: "Rends-toi sur la page Abonnement pour découvrir nos offres VIP et VIP+. Tu peux aussi tenter ta chance avec le jeu VIP quotidien gratuit." },
  { cat: 'general', icon: Star,     q: 'Les contenus sont-ils gratuits ?',                               a: "Oui, l'accès basique est entièrement gratuit. Les plans VIP/VIP+ offrent des fonctionnalités supplémentaires comme des thèmes exclusifs, la priorité sur les demandes et plus encore." },
  { cat: 'general', icon: ListMusic, q: 'Comment créer une playlist ?',                                   a: "Connecte-toi, va dans 'Mes Playlists' et clique sur 'Créer'. Tu peux ajouter des contenus depuis les pages de détail ou via le bouton + sur les cartes." },
  { cat: 'support', icon: Bug,      q: 'Comment signaler un problème ?',                                  a: "Utilise la page 'Écrire au staff' accessible depuis le footer pour nous contacter directement. On répond généralement sous 24h." },
  { cat: 'theme',   icon: Heart,    q: 'Puis-je changer le thème ?',                                      a: "Oui ! Clique sur l'icône palette dans la barre de navigation pour accéder aux thèmes. Les membres VIP ont accès à des thèmes exclusifs avec animations (Premium, Inferno, Royal, Arctique) et VIP+ ajoute Néon, Cosmique, Émeraude." },
  { cat: 'general', icon: Settings, q: "Comment fonctionne l'historique ?",                                a: "Ton historique de visionnage est automatiquement enregistré quand tu regardes un contenu. Retrouve-le dans ton tableau de bord avec des stats détaillées." },
  { cat: 'support', icon: Shield,   q: 'Mes données sont-elles en sécurité ?',                             a: "Oui, on chiffre les mots de passe (bcrypt), on utilise des cookies sécurisés (HttpOnly + SameSite) et HTTPS partout. Aucune donnée n'est revendue à des tiers." },
];

const CATS = [
  { id: 'all',     label: 'Tout',       hex: '#94a3b8' },
  { id: 'general', label: 'Général',    hex: '#3b82f6' },
  { id: 'vip',     label: 'VIP',        hex: '#f59e0b' },
  { id: 'theme',   label: 'Thèmes',     hex: '#a855f7' },
  { id: 'support', label: 'Support',    hex: '#ec4899' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(0);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return FAQS.filter(f => {
      if (cat !== 'all' && f.cat !== cat) return false;
      if (!s) return true;
      return f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s);
    });
  }, [search, cat]);

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="faq-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(245,158,11,0.5), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(236,72,153,0.12) 35%, rgba(168,85,247,0.18) 65%, rgba(59,130,246,0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(245,158,11,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />Aide & questions
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #fcd34d 40%, #f9a8d4 70%, #c4b5fd 100%)' }}>
                Questions
              </span>
              <span className="block text-white">fréquentes <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #ec4899, #a855f7)' }}>(FAQ)</span></span>
            </h1>
            <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
              Trouve rapidement une réponse à tes questions. <span className="text-white font-semibold">Recherche</span> ou filtre par catégorie.
            </p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl p-3 md:p-4 mb-5 sticky top-16 z-40 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une question..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-all"
                data-testid="faq-search-input"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10"><X className="w-3.5 h-3.5 text-slate-400" /></button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-white/10">
            {CATS.map(c => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? 'text-white shadow-lg scale-105' : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300'}`}
                  style={active ? { background: `linear-gradient(135deg, ${c.hex}, ${c.hex}99)`, boxShadow: `0 6px 24px ${c.hex}55` } : {}}
                  data-testid={`faq-cat-${c.id}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="relative overflow-hidden text-center py-12 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-950/30 via-purple-950/20 to-blue-950/30">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
              <p className="text-slate-400">Aucune question ne correspond à ta recherche.</p>
            </div>
          ) : filtered.map((f, i) => {
            const isOpen = open === i;
            const I = f.icon;
            const cMeta = CATS.find(c => c.id === f.cat) || CATS[1];
            return (
              <div key={i} className={`relative overflow-hidden rounded-2xl border bg-[#0b1220]/80 backdrop-blur-xl transition-all ${isOpen ? 'border-white/25 shadow-xl shadow-black/30' : 'border-white/10 hover:border-white/20'}`} data-testid={`faq-item-${i}`}>
                {isOpen && (
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: cMeta.hex }} />
                )}
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="relative w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: `linear-gradient(135deg, ${cMeta.hex}, ${cMeta.hex}99)`, boxShadow: `0 6px 16px ${cMeta.hex}33` }}>
                    <I className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 font-bold text-white">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
                </button>
                {isOpen && (
                  <div className="relative px-4 pb-4 -mt-1 pl-16 text-slate-300 leading-relaxed">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-950/40 via-rose-950/30 to-purple-950/40 p-6 text-center">
          <div className="absolute -top-10 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(closest-side, rgba(245,158,11,0.6), transparent 70%)' }} />
          <p className="relative text-sm text-slate-300 mb-3">Tu n'as pas trouvé ta réponse ?</p>
          <a href="/contact-staff" className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white text-sm font-bold shadow-lg shadow-amber-500/30 transition-all">
            Écrire au staff
          </a>
        </div>
      </div>
    </div>
  );
}
