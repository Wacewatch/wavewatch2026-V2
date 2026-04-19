"use client"

import { Mic, MicOff, Volume2, Phone, PhoneOff, VolumeX, Volume1 } from "lucide-react"
import { useState } from "react"

interface VoiceChatPanelProps {
  isVoiceConnected: boolean
  isMicMuted: boolean
  isSpeaking: boolean
  micPermissionDenied: boolean
  micErrorMessage?: string | null
  currentRoom?: string | null
  currentCinemaRoom?: { id: string; name?: string; room_number?: number } | null
  voicePeers: Array<{
    userId: string
    username: string
    isMuted: boolean
    isSpeaking: boolean
    volume: number
  }>
  onRequestMicAccess: () => void
  onToggleMic: () => void
  onDisconnect: () => void
  onResetPermission?: () => void
  onSetPeerVolume?: (peerId: string, volume: number) => void
  onTogglePeerMute?: (peerId: string) => void
}

export function VoiceChatPanel({
  isVoiceConnected,
  isMicMuted,
  isSpeaking,
  micPermissionDenied,
  micErrorMessage,
  currentRoom,
  currentCinemaRoom,
  voicePeers,
  onRequestMicAccess,
  onToggleMic,
  onDisconnect,
  onResetPermission,
  onSetPeerVolume,
  onTogglePeerMute,
}: VoiceChatPanelProps) {
  const [expandedPeerId, setExpandedPeerId] = useState<string | null>(null)

  const getRoomDisplayName = () => {
    if (!currentRoom) return "Monde"

    // If in a cinema room, show the specific cinema room name
    if (currentRoom.startsWith("cinema_") && currentCinemaRoom) {
      return currentCinemaRoom.name || `Salle ${currentCinemaRoom.room_number || "Cinéma"}`
    }

    if (currentRoom.startsWith("arcade_")) return `Salle Arcade`
    return currentRoom
  }

  const handleJoinVoice = () => {
    console.log("[v0] [VoiceChatPanel] Join button clicked")
    onRequestMicAccess()
  }

  const handleRetryMic = () => {
    console.log("[v0] [VoiceChatPanel] Retry button clicked")
    if (onResetPermission) {
      onResetPermission()
    }
    // Wait a bit for state to reset, then request access again
    setTimeout(() => {
      onRequestMicAccess()
    }, 100)
  }

  return (
    <div
      className="fixed bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700 z-50 pointer-events-auto"
      style={{ minWidth: "200px", maxWidth: "280px" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-white">Chat Vocal</span>
      </div>

      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
        {getRoomDisplayName()}
      </div>

      {micPermissionDenied ? (
        <div className="space-y-2">
          {micErrorMessage && (
            <div className="text-xs text-red-400 p-2 bg-red-900/20 rounded border border-red-800">
              {micErrorMessage}
            </div>
          )}
          <button
            onClick={handleRetryMic}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
          >
            <Phone className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      ) : !isVoiceConnected ? (
        <button
          onClick={handleJoinVoice}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
        >
          <Phone className="w-4 h-4" />
          Rejoindre le vocal
        </button>
      ) : (
        <div className="space-y-2">
          {/* My status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-xs text-gray-300">Vous</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleMic}
                className={`p-1.5 rounded-lg transition-colors ${
                  isMicMuted
                    ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                    : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                }`}
                title={isMicMuted ? "Activer le micro" : "Couper le micro"}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={onDisconnect}
                className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                title="Quitter le vocal"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {voicePeers.length > 0 && (
            <div className="border-t border-gray-700 pt-2 space-y-2">
              {voicePeers.map((peer) => (
                <div key={peer.userId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${peer.isSpeaking ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}
                      />
                      <span className="text-xs text-gray-300 truncate">{peer.username}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedPeerId(expandedPeerId === peer.userId ? null : peer.userId)}
                        className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                        title="Contrôles audio"
                      >
                        {peer.isMuted || peer.volume === 0 ? (
                          <VolumeX className="w-3 h-3 text-red-400" />
                        ) : (
                          <Volume1 className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Volume controls */}
                  {expandedPeerId === peer.userId && (
                    <div className="ml-4 space-y-1 bg-gray-800/50 rounded p-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(peer.volume || 1) * 100}
                          onChange={(e) => {
                            if (onSetPeerVolume) {
                              onSetPeerVolume(peer.userId, Number.parseInt(e.target.value) / 100)
                            }
                          }}
                          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right">
                          {Math.round((peer.volume || 1) * 100)}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (onTogglePeerMute) {
                            onTogglePeerMute(peer.userId)
                          }
                        }}
                        className={`w-full text-xs py-1 px-2 rounded transition-colors ${
                          peer.isMuted
                            ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {peer.isMuted ? "Réactiver" : "Couper le son"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {voicePeers.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-1">Personne d'autre dans le vocal</p>
          )}
        </div>
      )}
    </div>
  )
}
