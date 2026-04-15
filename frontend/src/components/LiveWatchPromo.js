import React from 'react';
import { ExternalLink, Tv, Globe } from 'lucide-react';

export default function LiveWatchPromo() {
  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#112240]" data-testid="livewatch-promo">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <img src="https://i.imgur.com/ovX7j6R.png" alt="LiveWatch Logo" className="h-24 md:h-32 w-auto object-contain" />
          </div>

          {/* Content Section */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white">LiveWatch</h3>
              <span className="text-sm text-cyan-400">by WaveWatch</span>
            </div>

            <p className="text-gray-300 mb-4">Votre plateforme mondiale de streaming TV en direct</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center gap-1.5">
                <Globe className="w-4 h-4" />17 Pays
              </span>
              <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center gap-1.5">
                <Tv className="w-4 h-4" />40 000+ Chaînes
              </span>
              <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                Accès Gratuit
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Découvrez plus de 40 000 chaînes TV en direct provenant de 17 pays. Profitez de toutes les chaînes
              nationales et payantes sans abonnement, le tout accessible gratuitement et instantanément.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a href="https://livewatch.sbs/" target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium flex items-center gap-2 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25">
                <ExternalLink className="w-4 h-4" />Accéder au site
              </a>
              <a href="https://v2.livewatch.sbs/" target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg border border-cyan-500/30 text-cyan-400 font-medium flex items-center gap-2 hover:bg-cyan-500/10 transition-all">
                Serveur de secours
              </a>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              🌍 France • 🇮🇹 Italie • 🇪🇸 Espagne • 🇬🇧 Royaume-Uni • 🇩🇪 Allemagne • Et 12 autres pays...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
