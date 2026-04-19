"use client"

import { Gamepad2, X, ExternalLink } from "lucide-react"

interface ArcadeMachine {
  id: string
  name: string
  url: string
}

interface ExternalGameModalProps {
  machine: ArcadeMachine
  countdown: number
  onOpenExternal: () => void
  onClose: () => void
}

export function ExternalGameModal({
  machine,
  countdown,
  onOpenExternal,
  onClose,
}: ExternalGameModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl max-w-lg w-full p-6 border-2 border-purple-400 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-white">
            <Gamepad2 className="w-6 h-6 text-pink-400" />
            <span className="font-bold text-xl">{machine.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Compte a rebours */}
        <div className="flex flex-col items-center justify-center py-8">
          {countdown > 0 ? (
            <>
              <div className="text-7xl font-bold text-white mb-4 animate-pulse">
                {countdown}
              </div>
              <p className="text-white/70 text-lg">
                Veuillez patienter...
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-white text-lg font-medium">
                Pret a jouer !
              </p>
            </>
          )}
        </div>

        <p className="text-white/60 text-sm mb-6 text-center">
          Ce jeu va s&apos;ouvrir dans un nouvel onglet
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onOpenExternal}
            disabled={countdown > 0}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              countdown > 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            {countdown > 0 ? `Attendre ${countdown}s` : 'Jouer'}
          </button>
        </div>
      </div>
    </div>
  )
}
