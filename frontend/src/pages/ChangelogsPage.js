import React, { useState, useEffect } from 'react';
import { Package, Calendar, Sparkles, Tag } from 'lucide-react';
import API from '../lib/api';

const DEFAULT_CHANGELOGS = [
  { _id: 'd1', version: '2.5.0', title: 'Thèmes Premium et VIP+',           description: "Ajout de 5 nouveaux thèmes premium exclusifs pour les membres VIP et VIP+. Amélioration du système de thèmes avec support complet pour le mode sombre.\n\nCorrection de bugs mineurs dans la navigation mobile.",                                                                                                  release_date: '2026-01-15' },
  { _id: 'd2', version: '2.4.0', title: 'Calendrier des sorties',            description: "Nouveau calendrier interactif pour suivre les sorties de films et séries.\n\nAjout des épisodes à venir pour vos séries favorites.",                                                                                                                                                                  release_date: '2025-12-20' },
  { _id: 'd3', version: '2.3.0', title: 'Système de playlists publiques',    description: "Les utilisateurs peuvent maintenant créer des playlists publiques et les partager avec la communauté.\n\nDécouvrez les playlists des autres utilisateurs.",                                                                                                                                          release_date: '2025-11-15' },
  { _id: 'd4', version: '2.2.0', title: 'Retrogaming et Radio FM',           description: "Ajout de la section Retrogaming avec des jeux classiques jouables dans le navigateur.\n\nNouvelle section Radio FM avec des stations de radio en streaming.",                                                                                                                                          release_date: '2025-10-22' },
  { _id: 'd5', version: '2.1.0', title: 'Ebooks et Logiciels',               description: "Nouvelle section Ebooks avec une bibliothèque de livres numériques.\n\nSection Logiciels pour télécharger des outils gratuits.",                                                                                                                                                                       release_date: '2025-10-13' },
  { _id: 'd6', version: '2.0.0', title: 'WaveWatch 2026 - Refonte complète', description: "Refonte complète de la plateforme avec un nouveau design.\n\n17 thèmes personnalisables.\nSystème VIP avec jeu quotidien.\nTableau de bord amélioré avec statistiques détaillées.",                                                                                                                     release_date: '2025-09-15' },
];

function versionToColor(version) {
  // Extrait major number, donne un teint
  const major = parseInt((version || '').split('.')[0], 10) || 1;
  const palettes = [
    { hex: '#3b82f6', from: 'from-blue-500',    to: 'to-cyan-500'    },
    { hex: '#a855f7', from: 'from-purple-500',  to: 'to-pink-500'    },
    { hex: '#10b981', from: 'from-emerald-500', to: 'to-cyan-500'    },
    { hex: '#f59e0b', from: 'from-amber-500',   to: 'to-orange-500'  },
    { hex: '#ec4899', from: 'from-pink-500',    to: 'to-rose-500'    },
  ];
  return palettes[major % palettes.length];
}

export default function ChangelogsPage() {
  const [changelogs, setChangelogs] = useState(DEFAULT_CHANGELOGS);

  useEffect(() => {
    API.get('/api/changelogs').then(({ data }) => {
      const items = Array.isArray(data) ? data : (data.changelogs || []);
      if (items.length > 0) {
        const backendVersions = new Set(items.map(i => i.version));
        const defaults = DEFAULT_CHANGELOGS.filter(d => !backendVersions.has(d.version));
        setChangelogs([...items, ...defaults]);
      }
    }).catch(() => {});
  }, []);

  const latest = changelogs[0];

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)' }} data-testid="changelogs-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.45), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--ring) / 0.4), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(168,85,247,0.15) 35%, rgba(236,72,153,0.18) 65%, rgba(245,158,11,0.12))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" />Changelog
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
                  <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #93c5fd 40%, #c4b5fd 70%, #f9a8d4 100%)' }}>
                    Nouveautés
                  </span>
                  <span className="block text-white">& <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)' }}>Mises à jour</span></span>
                </h1>
                <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
                  Découvre les <span className="text-white font-semibold">dernières évolutions</span> de WaveWatch — features, améliorations, fixes.
                </p>
              </div>

              {latest && (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-5 w-full lg:w-72 lg:flex-shrink-0">
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-50" style={{ background: 'rgba(59,130,246,0.6)' }} />
                  <p className="relative text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Dernière version</p>
                  <p className="relative text-3xl font-black bg-clip-text text-transparent mb-1" style={{ backgroundImage: 'linear-gradient(135deg, #fff, #67e8f9)' }}>v{latest.version}</p>
                  <p className="relative text-sm font-bold text-white truncate">{latest.title}</p>
                  <p className="relative text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {latest.release_date ? new Date(latest.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="relative space-y-5 pl-6 md:pl-8 border-l border-white/10 ml-2 md:ml-3">
          {changelogs.map((c) => {
            const palette = versionToColor(c.version);
            return (
              <div key={c._id || c.version} className="relative" data-testid={`changelog-${c.version}`}>
                {/* Dot on the timeline */}
                <div className="absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full ring-4 ring-[#050b18] shadow-lg" style={{ background: palette.hex, boxShadow: `0 0 16px ${palette.hex}99` }} />

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/85 backdrop-blur-xl p-5 md:p-6 hover:border-white/25 transition-colors group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: palette.hex }} />

                  <div className="relative flex flex-wrap items-center justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${palette.from} ${palette.to} text-white text-xs font-extrabold shadow-lg`} style={{ boxShadow: `0 6px 20px ${palette.hex}55` }}>
                      <Tag className="w-3 h-3" />v{c.version}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {c.release_date ? new Date(c.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </span>
                  </div>

                  <h2 className="relative text-xl md:text-2xl font-black text-white mb-3 leading-tight">{c.title}</h2>
                  <p className="relative text-sm md:text-base text-slate-300 whitespace-pre-line leading-relaxed">{c.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5" />
            <span><span className="text-white font-bold">{changelogs.length}</span> versions publiées</span>
          </p>
        </div>
      </div>
    </div>
  );
}
