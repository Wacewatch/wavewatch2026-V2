import React, { useState } from 'react';
import { Package, Calendar } from 'lucide-react';

const changelogs = [
  { id: 1, version: '2.5.0', title: 'Themes Premium et VIP+', description: 'Ajout de 5 nouveaux themes premium exclusifs pour les membres VIP et VIP+. Amelioration du systeme de themes avec support complet pour le mode sombre.\n\nCorrection de bugs mineurs dans la navigation mobile.', date: '2026-01-15' },
  { id: 2, version: '2.4.0', title: 'Calendrier des sorties', description: 'Nouveau calendrier interactif pour suivre les sorties de films et series.\n\nAjout des episodes a venir pour vos series favorites.', date: '2025-12-20' },
  { id: 3, version: '2.3.0', title: 'Systeme de playlists publiques', description: 'Les utilisateurs peuvent maintenant creer des playlists publiques et les partager avec la communaute.\n\nDecouvrez les playlists des autres utilisateurs.', date: '2025-11-15' },
  { id: 4, version: '2.2.0', title: 'Retrogaming et Radio FM', description: 'Ajout de la section Retrogaming avec des jeux classiques jouables dans le navigateur.\n\nNouvelle section Radio FM avec des stations de radio en streaming.', date: '2025-10-22' },
  { id: 5, version: '2.1.0', title: 'Ebooks et Logiciels', description: 'Nouvelle section Ebooks avec une bibliotheque de livres numeriques.\n\nSection Logiciels pour telecharger des outils gratuits.', date: '2025-10-13' },
  { id: 6, version: '2.0.0', title: 'WaveWatch 2026 - Refonte complete', description: 'Refonte complete de la plateforme avec un nouveau design.\n\n17 themes personnalisables.\nSysteme VIP avec jeu quotidien.\nTableau de bord ameliore avec statistiques detaillees.', date: '2025-09-15' },
];

export default function ChangelogsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950" data-testid="changelogs-page">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Package className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nouveautes</h1>
          <p className="text-blue-300 text-lg">Decouvrez les dernieres mises a jour et ameliorations de WaveWatch</p>
        </div>
        <div className="space-y-6">
          {changelogs.map(c => (
            <div key={c.id} className="bg-blue-900/50 border border-blue-700 rounded-xl p-6 hover:bg-blue-900/70 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 text-sm rounded-full bg-blue-800 text-blue-200 border border-blue-600">Version {c.version}</span>
                <span className="flex items-center text-blue-300 text-sm"><Calendar className="w-4 h-4 mr-2" />{new Date(c.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{c.title}</h2>
              <p className="text-blue-200 whitespace-pre-line">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
