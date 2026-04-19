"use client"

import { Gamepad2, X } from "lucide-react"

interface ArcadeMachine {
  id: string
  name: string
  url: string
  useProxy?: boolean
}

interface ArcadeGameViewProps {
  machine: ArcadeMachine
  onClose: () => void
}

export function ArcadeGameView({ machine, onClose }: ArcadeGameViewProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header avec z-index eleve pour rester au-dessus de l'iframe */}
      <div className="bg-purple-900 px-4 py-3 flex items-center justify-between border-b-2 border-purple-400 relative z-[100]">
        <div className="flex items-center gap-3 text-white">
          <Gamepad2 className="w-5 h-5 text-pink-400" />
          <span className="font-bold text-lg">{machine.name}</span>
        </div>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <X className="w-5 h-5" />
          Fermer
        </button>
      </div>
      {/* Container pour l'iframe avec overlay bloquant le menu */}
      <div className="flex-1 relative">
        {/* Overlay en haut a gauche pour bloquer le menu hamburger de webRcade */}
        <div className="absolute top-0 left-0 w-24 h-24 z-10 bg-transparent" />
        {/* Iframe - le contenu interne (comme le menu webRcade) reste dans son contexte */}
        {/* Si useProxy est true, on passe par /api/proxy/game pour contourner les timers/modales */}
        <iframe
          src={machine.useProxy
            ? `/api/proxy/game?url=${encodeURIComponent(machine.url)}`
            : machine.url}
          className="absolute inset-0 w-full h-full border-0"
          allow="gamepad *; fullscreen *; autoplay *; clipboard-write *; encrypted-media *"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        />
      </div>
    </div>
  )
}
