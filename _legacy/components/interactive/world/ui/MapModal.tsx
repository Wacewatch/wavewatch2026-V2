"use client"

import { Map, X, Building2, Gamepad2, Trophy, Music, Sparkles } from "lucide-react"

interface MapModalProps {
  isArcadeOpen: boolean
  isStadiumOpen: boolean
  isDiscoOpen: boolean
  onOpenCinema: () => void
  onEnterArcade: () => void
  onEnterStadium: () => void
  onEnterDisco: () => void
  onTeleportToPlaza?: () => void
  onClose: () => void
}

export function MapModal({
  isArcadeOpen,
  isStadiumOpen,
  isDiscoOpen,
  onOpenCinema,
  onEnterArcade,
  onEnterStadium,
  onEnterDisco,
  onTeleportToPlaza,
  onClose,
}: MapModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-4 shadow-2xl border-2 border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Map className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
            Carte du Monde
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Place Centrale - toujours accessible */}
          {onTeleportToPlaza && (
            <button
              onClick={() => {
                onTeleportToPlaza()
                onClose()
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white p-4 md:p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-4"
            >
              <div className="bg-white/20 p-3 md:p-4 rounded-lg">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-lg md:text-xl">⛲ Place Centrale</div>
                <div className="text-xs md:text-sm opacity-90">Fontaine animée et point de rencontre</div>
              </div>
            </button>
          )}

          {/* Cinéma - toujours cliquable pour voir les salles */}
          <button
            onClick={onOpenCinema}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 md:p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-4"
          >
            <div className="bg-white/20 p-3 md:p-4 rounded-lg">
              <Building2 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg md:text-xl">🎬 Cinéma</div>
              <div className="text-xs md:text-sm opacity-90">Cliquez pour voir les salles</div>
            </div>
          </button>

          {/* Arcade */}
          <button
            onClick={() => {
              if (isArcadeOpen) {
                onEnterArcade()
              }
            }}
            disabled={!isArcadeOpen}
            className={`${isArcadeOpen
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed opacity-60'
            } text-white p-4 md:p-6 rounded-xl transition-all transform shadow-lg flex items-center gap-4`}
          >
            <div className="bg-white/20 p-3 md:p-4 rounded-lg">
              <Gamepad2 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg md:text-xl">🕹️ Arcade</div>
              <div className="text-xs md:text-sm opacity-90">
                {isArcadeOpen ? 'Ouvert - Jouez aux jeux rétro' : '🚫 Fermé'}
              </div>
            </div>
            {!isArcadeOpen && (
              <div className="bg-red-500/80 px-2 py-1 rounded text-xs font-bold">FERMÉ</div>
            )}
          </button>

          {/* Stade */}
          <button
            onClick={() => {
              if (isStadiumOpen) {
                onEnterStadium()
              }
            }}
            disabled={!isStadiumOpen}
            className={`${isStadiumOpen
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed opacity-60'
            } text-white p-4 md:p-6 rounded-xl transition-all transform shadow-lg flex items-center gap-4`}
          >
            <div className="bg-white/20 p-3 md:p-4 rounded-lg">
              <Trophy className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg md:text-xl">⚽ Stade</div>
              <div className="text-xs md:text-sm opacity-90">
                {isStadiumOpen ? 'Ouvert - Regardez les matchs en live' : '🚫 Fermé'}
              </div>
            </div>
            {!isStadiumOpen && (
              <div className="bg-red-500/80 px-2 py-1 rounded text-xs font-bold">FERMÉ</div>
            )}
          </button>

          {/* Discothèque */}
          <button
            onClick={() => {
              if (isDiscoOpen) {
                onEnterDisco()
              }
            }}
            disabled={!isDiscoOpen}
            className={`${isDiscoOpen
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 hover:scale-105'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed opacity-60'
            } text-white p-4 md:p-6 rounded-xl transition-all transform shadow-lg flex items-center gap-4`}
          >
            <div className="bg-white/20 p-3 md:p-4 rounded-lg">
              <Music className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg md:text-xl">🪩 Discothèque</div>
              <div className="text-xs md:text-sm opacity-90">
                {isDiscoOpen ? 'Ouvert - Dansez et écoutez de la musique' : '🚫 Fermé'}
              </div>
            </div>
            {!isDiscoOpen && (
              <div className="bg-red-500/80 px-2 py-1 rounded text-xs font-bold">FERMÉ</div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
