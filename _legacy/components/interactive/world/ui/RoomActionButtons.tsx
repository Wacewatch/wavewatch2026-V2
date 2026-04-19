"use client"

import { LogOut } from "lucide-react"

interface RoomActionButtonsProps {
  currentRoom: string | null
  currentCinemaRoom: any
  // Cinema
  mySeat: number | null
  isCinemaMuted: boolean
  onSitCinema: () => void
  onStandCinema: () => void
  onToggleCinemaMute: () => void
  // Disco
  isDiscoMuted: boolean
  onToggleDiscoMute: () => void
  // Stadium
  stadiumSeat: { row: number; side: string } | null
  onSitStadium: () => void
  onStandStadium: () => void
  // Leave handlers
  onLeaveCinema: () => void
  onLeaveArcade: () => void
  onLeaveDisco: () => void
  onLeaveStadium: () => void
}

export function RoomActionButtons({
  currentRoom,
  currentCinemaRoom,
  mySeat,
  isCinemaMuted,
  onSitCinema,
  onStandCinema,
  onToggleCinemaMute,
  isDiscoMuted,
  onToggleDiscoMute,
  stadiumSeat,
  onSitStadium,
  onStandStadium,
  onLeaveCinema,
  onLeaveArcade,
  onLeaveDisco,
  onLeaveStadium,
}: RoomActionButtonsProps) {
  const isInRoom = currentCinemaRoom || currentRoom === "stadium" || currentRoom === "arcade" || currentRoom === "disco"

  if (!isInRoom) return null

  const handleLeave = () => {
    if (currentCinemaRoom) return onLeaveCinema()
    if (currentRoom === "arcade") return onLeaveArcade()
    if (currentRoom === "disco") return onLeaveDisco()
    return onLeaveStadium()
  }

  return (
    <div className="fixed bottom-6 right-48 z-30 flex items-center gap-3">
      {/* Bouton S'asseoir/Se lever - dans le cinéma */}
      {currentCinemaRoom && (
        mySeat === null ? (
          <button
            onClick={onSitCinema}
            className="bg-blue-600 hover:bg-blue-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="S'asseoir"
          >
            <span className="text-lg">💺</span>
          </button>
        ) : (
          <button
            onClick={onStandCinema}
            className="bg-gray-600 hover:bg-gray-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="Se lever"
          >
            <span className="text-lg">🚶</span>
          </button>
        )
      )}

      {/* Bouton Mute/Unmute - dans le cinéma */}
      {currentCinemaRoom && (
        <button
          onClick={onToggleCinemaMute}
          className={`${isCinemaMuted ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20`}
          title={isCinemaMuted ? 'Activer le son' : 'Couper le son'}
        >
          <span className="text-lg">{isCinemaMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* Bouton Mute/Unmute - dans la disco */}
      {currentRoom === "disco" && (
        <button
          onClick={onToggleDiscoMute}
          className={`${isDiscoMuted ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20`}
          title={isDiscoMuted ? 'Activer le son' : 'Couper le son'}
        >
          <span className="text-lg">{isDiscoMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* Bouton S'asseoir/Se lever - dans le stade */}
      {currentRoom === "stadium" && (
        stadiumSeat === null ? (
          <button
            onClick={onSitStadium}
            className="bg-blue-600 hover:bg-blue-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="S'asseoir"
          >
            <span className="text-lg">💺</span>
          </button>
        ) : (
          <button
            onClick={onStandStadium}
            className="bg-gray-600 hover:bg-gray-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="Se lever"
          >
            <span className="text-lg">🚶</span>
          </button>
        )
      )}

      {/* Bouton Sortir */}
      <button
        onClick={handleLeave}
        className="bg-red-600 hover:bg-red-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
        title="Sortir"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  )
}
