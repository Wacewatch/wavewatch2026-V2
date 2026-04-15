import React from 'react';
import { ExternalLink, Play } from 'lucide-react';

export default function SportsStreamPromo() {
  return (
    <div className="rounded-2xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-[#1a0a0a] via-[#2d1a1a] to-[#3d2020]" data-testid="sports-stream-promo">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <img src="https://i.imgur.com/aUOO21x.png" alt="Sports-Stream Logo" className="h-24 md:h-32 w-auto object-contain" />
          </div>

          {/* Content Section */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Sports-Stream</h3>
              <span className="text-sm text-orange-400">by WaveWatch</span>
            </div>

            <p className="text-gray-300 mb-4">Votre destination ultime pour le streaming sportif</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium flex items-center gap-1.5">
                <Play className="w-4 h-4" />Multi-sources
              </span>
              <span className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium">
                +15 Sports
              </span>
              <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                Sans inscription
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Profitez d'un streaming multi-sports de haute qualité avec plus de 15 disciplines disponibles. Accédez à
              plusieurs sources de streaming pour chaque événement, le tout sans inscription requise.
            </p>

            <a href="https://sports-stream.sbs/" target="_blank" rel="noopener noreferrer"
              className="inline-flex px-6 py-3 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium items-center gap-2 hover:from-orange-500 hover:to-red-500 transition-all shadow-lg shadow-orange-500/25">
              <ExternalLink className="w-4 h-4" />Accéder au site
            </a>

            <p className="text-xs text-gray-500 mt-4">
              🏀 Football • 🎾 Tennis • 🏈 Basketball • ⚾ Baseball • 🏒 Hockey • Et plus encore...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
