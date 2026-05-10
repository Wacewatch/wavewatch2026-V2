import React from 'react';
import { Shield, FileText, Server, Globe, AlertTriangle, Mail, Sparkles, Database, Search as SearchIcon, ExternalLink, Scale, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DMCAPage() {
  return (
    <div className="relative min-h-screen text-foreground" data-testid="dmca-page">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-border mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.12) 35%, hsl(var(--ring) / 0.18) 65%, hsl(var(--secondary) / 0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14 grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Scale className="w-3 h-3" />Cadre légal
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
                <span className="block text-foreground">Politique</span>
                <span className="block">
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--ring)))' }}>
                    DMCA
                  </span>
                  <span className="text-foreground"> & Droits d'auteur</span>
                </span>
              </h1>
              <p className="text-foreground/70 max-w-2xl text-base md:text-lg leading-relaxed">
                <span className="text-foreground font-semibold">WaveWatch</span> est un moteur de référencement de liens publics. Cette page détaille notre rôle, nos obligations et la marche à suivre pour les ayants-droits.
              </p>
            </div>
            {/* Big icon panel */}
            <div className="hidden md:flex flex-col items-center justify-center px-6 py-4 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
              <Scale className="w-12 h-12 mb-2" style={{ color: 'hsl(var(--primary))' }} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 text-center">Mise à jour</p>
              <p className="text-xs font-black text-foreground">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* QUICK FACTS — bandeau de chiffres-clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Database,   label: '0 fichier',     value: 'hébergé',      hex: '#06b6d4' },
            { icon: SearchIcon, label: 'Liens',         value: 'indexés',      hex: '#3b82f6' },
            { icon: Globe,      label: 'Sources',       value: 'tierces',      hex: '#a855f7' },
            { icon: Shield,     label: 'Conformité',    value: 'EU + DMCA',    hex: '#10b981' },
          ].map(s => {
            const I = s.icon;
            return (
              <div key={s.label} className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md p-3 text-center">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30" style={{ background: s.hex }} />
                <I className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.hex }} />
                <p className="text-lg md:text-xl font-black" style={{ color: s.hex }}>{s.label}</p>
                <p className="text-[10px] uppercase tracking-widest text-foreground/60 font-semibold">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* INTRO ENCART */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-6 mb-8">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: 'hsl(var(--primary))' }} />
          <div className="relative flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', color: 'hsl(var(--primary-foreground))' }}>
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                <span className="text-foreground font-bold">En résumé :</span> WaveWatch ne dispose <span className="font-bold">d'aucune capacité de stockage de médias</span>. Notre service se limite à <span className="font-bold">indexer et référencer</span> des contenus déjà en ligne, distribués par des plateformes tierces. Toute demande de retrait doit être adressée <span className="font-bold">directement aux hébergeurs concernés</span>.
              </p>
            </div>
          </div>
        </div>

        {/* SECTIONS — colonne unique avec puces */}
        <div className="space-y-4">
          <Section
            num="01"
            icon={Server}
            title="Architecture technique de la plateforme"
            hex="#06b6d4"
            bullets={[
              "Aucune capacité d'upload, stockage ou diffusion de fichiers multimédias",
              "Infrastructure orientée index : base de données de liens hypertextes uniquement",
              "Traitement basé sur des API publiques (TMDB, métadonnées) et des annuaires de liens",
              "Aucun fichier vidéo/audio ne transite par nos serveurs",
            ]}
          />
          <Section
            num="02"
            icon={Globe}
            title="Notre rôle d'annuaire neutre"
            hex="#3b82f6"
            bullets={[
              "Référencement automatisé de ressources déjà disponibles publiquement",
              "Pas de validation, modification ou ré-encodage des contenus tiers",
              "Présentation organisée d'informations cinématographiques (synopsis, casting, jaquettes)",
              "WaveWatch n'établit aucune relation contractuelle avec les hébergeurs cibles",
            ]}
          />
          <Section
            num="03"
            icon={ExternalLink}
            title="Hébergeurs tiers — limites de notre action"
            hex="#a855f7"
            bullets={[
              "Les liens pointent vers des plateformes tierces indépendantes que nous ne contrôlons pas",
              "Le retrait d'un lien dans notre index n'a aucun effet sur le fichier source",
              "Le contenu reste disponible auprès de l'hébergeur tant qu'il n'est pas retiré à la source",
              "Nous ne pouvons pas agir techniquement sur des serveurs qui ne nous appartiennent pas",
            ]}
          />
          <Section
            num="04"
            icon={FileText}
            title="Procédure recommandée pour les ayants-droits"
            hex="#ec4899"
            bullets={[
              "Identifier l'hébergeur du fichier (visible dans l'URL du lien sortant)",
              "Adresser la notification de retrait DMCA/LCEN à cet hébergeur",
              "Une fois le fichier retiré à la source, le lien devient automatiquement obsolète chez nous",
              "Pour signaler un problème spécifique, contactez notre staff via le formulaire dédié",
            ]}
          />
        </div>

        {/* FAQ rapide */}
        <div className="mt-8 rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
            <h2 className="text-xl font-black text-foreground">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Pouvez-vous supprimer un film/série de votre site ?",
                a: "Nous pouvons retirer le référencement (la fiche) sur demande motivée d'un titulaire de droits. En revanche, cela n'affecte pas la disponibilité du fichier sur les serveurs tiers où il est hébergé." },
              { q: "Comment identifier l'hébergeur d'un lien ?",
                a: "Le domaine de l'URL de destination identifie l'hébergeur (ex: vk.com, doodstream.com, etc.). Une recherche WHOIS sur ce domaine fournit les coordonnées de l'opérateur technique." },
              { q: "WaveWatch reçoit-il une rémunération sur le visionnage ?",
                a: "Non. WaveWatch n'a pas de modèle publicitaire associé aux liens tiers, et ne perçoit aucun revenu lié au visionnage de contenus externes." },
            ].map((f, i) => (
              <details key={i} className="group rounded-xl border border-border/50 bg-background/50 p-3 cursor-pointer">
                <summary className="font-bold text-foreground text-sm md:text-base list-none flex items-center justify-between">
                  <span>{f.q}</span>
                  <span className="text-foreground/50 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* AVERTISSEMENT */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-rose-950/30 p-5 md:p-7 mt-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(35 95% 55%)' }} />
          <div className="relative flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black mb-1.5 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24, #fb923c, #ec4899)' }}>
                Responsabilité de l'utilisateur
              </h2>
              <p className="text-sm md:text-base text-amber-100/85 leading-relaxed">
                L'utilisation des liens référencés sur WaveWatch s'effectue sous la <span className="font-bold">seule responsabilité de l'utilisateur</span>. Selon votre juridiction, le visionnage de certains contenus peut être soumis à des règles spécifiques. WaveWatch décline toute responsabilité quant à l'usage qui est fait des liens proposés et recommande l'utilisation de moyens légaux pour accéder aux œuvres.
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT FOOTER */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link to="/contact-staff" className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">Contact staff</p>
                <p className="text-xs text-foreground/60">Pour toute question légale spécifique</p>
              </div>
            </div>
          </Link>
          <Link to="/faq" className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--ring)))' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">FAQ générale</p>
                <p className="text-xs text-foreground/60">Réponses aux questions courantes</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-10">
          © {new Date().getFullYear()} <span className="text-foreground/60 font-semibold">WaveWatch</span> — Indexation neutre · Politique mise à jour selon l'évolution de la jurisprudence
        </p>
      </div>
    </div>
  );
}

function Section({ num, icon: Icon, title, hex, bullets }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-6 group hover:border-foreground/25 transition-colors" data-testid={`dmca-section-${num}`}>
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: hex }} />
      <div className="relative flex items-start gap-4">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${hex}, ${hex}99)`, boxShadow: `0 6px 16px ${hex}33` }}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-black tracking-widest" style={{ color: hex }}>{num}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-black text-foreground mb-3">{title}</h2>
          <ul className="space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="text-sm md:text-base text-foreground/75 leading-relaxed flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: hex }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
