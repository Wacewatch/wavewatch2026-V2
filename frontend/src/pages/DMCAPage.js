import React from 'react';
import { Shield, FileText, Server, Globe, AlertTriangle, Mail, Sparkles, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    icon: Server,
    title: 'Zéro Hébergement de Fichiers',
    body: "WaveWatch fonctionne exclusivement comme un annuaire de liens hypertextes. Aucun fichier vidéo, audio ou multimédia n'est stocké, téléchargé ou transmis depuis nos serveurs. Notre infrastructure technique ne possède aucune capacité de stockage de contenu protégé par le droit d'auteur.",
    hex: '#06b6d4',
  },
  {
    icon: Globe,
    title: 'Nature du Service',
    body: "En tant que moteur de recherche spécialisé et indexeur, WaveWatch facilite la découverte de contenus déjà disponibles publiquement sur le réseau internet mondial. Notre rôle est strictement limité à l'indexation de liens pointant vers des services tiers indépendants.",
    hex: '#3b82f6',
  },
  {
    icon: LinkIcon,
    title: 'Responsabilité des Tiers',
    body: "Les contenus liés sont hébergés sur des plateformes externes (sites d'hébergement de fichiers, serveurs de streaming tiers) sur lesquelles WaveWatch n'exerce aucun contrôle technique, éditorial ou légal. La suppression d'un lien sur WaveWatch n'entraîne pas la suppression du contenu original de l'internet.",
    hex: '#a855f7',
  },
  {
    icon: ArrowRight,
    title: 'Procédure de Retrait',
    body: "Pour qu'un contenu soit effectivement retiré du réseau internet, les détenteurs de droits doivent contacter directement l'hébergeur physique du fichier. WaveWatch, n'étant pas l'hébergeur, n'a aucune autorité technique pour supprimer les fichiers sources ou interrompre les flux provenant de serveurs tiers.",
    hex: '#ec4899',
  },
];

export default function DMCAPage() {
  return (
    <div className="relative min-h-screen text-foreground" data-testid="dmca-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-border mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.12) 35%, hsl(var(--ring) / 0.18) 65%, hsl(var(--secondary) / 0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Shield className="w-3 h-3" />Mentions légales
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block text-foreground">Politique</span>
              <span className="block">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--ring)))' }}>
                  DMCA
                </span>
              </span>
            </h1>
            <p className="text-foreground/70 max-w-2xl text-base md:text-lg leading-relaxed">
              <span className="text-foreground font-semibold">WaveWatch</span> est un annuaire neutre de liens hypertextes. Cette page explique notre cadre légal et la marche à suivre concernant les droits d'auteur.
            </p>
          </div>
        </div>

        {/* SECTIONS */}
        <div className="space-y-4">
          {SECTIONS.map((s, i) => {
            const I = s.icon;
            return (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-6 group hover:border-foreground/25 transition-colors" data-testid={`dmca-section-${i}`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: s.hex }} />
                <div className="relative flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: `linear-gradient(135deg, ${s.hex}, ${s.hex}99)`, boxShadow: `0 6px 16px ${s.hex}33` }}>
                    <I className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-black text-foreground mb-2">{s.title}</h2>
                    <p className="text-sm md:text-base text-foreground/75 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AVERTISSEMENT FINAL */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-rose-950/30 p-6 md:p-8 mt-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(35 95% 55%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24, #fb923c, #ec4899)' }}>
                Avertissement Final
              </h2>
            </div>
            <p className="text-sm md:text-base text-amber-100/85 leading-relaxed">
              En utilisant <span className="text-white font-bold">WaveWatch</span>, vous reconnaissez que la plateforme n'est qu'un <span className="font-bold">intermédiaire technique</span>. Les informations fournies ici servent à établir la réalité technologique de notre infrastructure : WaveWatch <span className="font-bold">ne possède, ne stocke, ne télécharge et ne diffuse aucun fichier</span> protégé par le droit d'auteur. Toute action légale concernant un contenu doit être dirigée vers l'hébergeur effectif de la ressource.
            </p>
          </div>
        </div>

        {/* CTA staff */}
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground/60 mb-3">Une question légale ou un signalement spécifique ?</p>
          <Link to="/contact-staff" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', boxShadow: '0 8px 24px hsl(var(--primary) / 0.35)' }}>
            <Mail className="w-4 h-4" />Contacter le staff
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-foreground/40 mt-10">
          © {new Date().getFullYear()} <span className="text-foreground/60 font-semibold">WaveWatch</span> — Plateforme d'Indexation Neutre
        </p>
      </div>
    </div>
  );
}
