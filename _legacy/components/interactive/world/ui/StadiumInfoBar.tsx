"use client"

import { Trophy } from "lucide-react"

interface StadiumInfoBarProps {
  matchTitle: string
  seatSide: string
  seatRow: number
  isMuted: boolean
  onToggleMute: () => void
}

export function StadiumInfoBar({
  matchTitle,
  seatSide,
  seatRow,
  isMuted,
  onToggleMute,
}: StadiumInfoBarProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 bg-green-900/90 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-green-400/50 flex items-center gap-4">
      <div className="flex items-center gap-3 text-white">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="font-bold">{matchTitle}</span>
        <span className="text-sm text-green-300">• Tribune {seatSide.toUpperCase()} - Rangee {seatRow + 1}</span>
      </div>
      <button
        onClick={onToggleMute}
        className={`${isMuted ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white w-11 h-11 rounded-lg transition-all flex items-center justify-center`}
        title={isMuted ? 'Activer le son' : 'Couper le son'}
      >
        <span className="text-lg">{isMuted ? '🔇' : '🔊'}</span>
      </button>
    </div>
  )
}
