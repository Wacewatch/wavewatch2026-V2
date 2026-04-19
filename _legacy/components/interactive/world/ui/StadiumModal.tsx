"use client"

import { Trophy, X } from "lucide-react"

interface Stadium {
  name: string
  match_title?: string
  schedule_start?: string
}

interface StadiumModalProps {
  stadium: Stadium
  onEnter: () => void
  onClose: () => void
}

export function StadiumModal({ stadium, onEnter, onClose }: StadiumModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border-2 border-green-400/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" /> {stadium.name}
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-bold text-white text-lg mb-2">{stadium.match_title || "Match en direct"}</h3>
            {stadium.schedule_start && (
              <div className="text-green-200 text-sm">
                Debut: {new Date(stadium.schedule_start).toLocaleString("fr-FR")}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onEnter}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          Entrer dans le Stade
        </button>
      </div>
    </div>
  )
}
