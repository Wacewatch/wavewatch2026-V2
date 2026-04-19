"use client"

import { Gamepad2, X } from "lucide-react"

interface ArcadeMachine {
  id: string
  name: string
  description?: string
  category?: string
}

interface ArcadeModalProps {
  arcadeMachines: ArcadeMachine[]
  onSelectMachine: (machine: ArcadeMachine) => void
  onClose: () => void
}

export function ArcadeModal({
  arcadeMachines,
  onSelectMachine,
  onClose,
}: ArcadeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-2xl p-6 md:p-8 max-w-4xl w-full my-8 shadow-2xl border-2 border-purple-400/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
            Arcade - Jeux Retro
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {arcadeMachines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => onSelectMachine(machine)}
              className="bg-gradient-to-br from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-xl transition-all transform hover:scale-105 shadow-lg text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="font-bold text-lg">{machine.name}</div>
              </div>
              {machine.description && <div className="text-sm opacity-90 line-clamp-2">{machine.description}</div>}
              <div className="mt-2 text-xs opacity-75">{machine.category || "Jeu Retro"}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
