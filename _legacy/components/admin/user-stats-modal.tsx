"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Clock, MapPin, TrendingUp, Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserStatsModalProps {
  userId: string
  email: string | null
  username: string | null
  onClose: () => void
}

interface RoomVisit {
  room_name: string
  visit_count: number
  total_seconds: number
  avg_seconds: number
}

interface SessionDetail {
  id: string
  visited_at: string
  session_end: string | null
  session_duration_seconds: number | null
}

// Format seconds to human readable duration
const formatDuration = (seconds: number | null): string => {
  if (!seconds || seconds === 0) return "-"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// Translate room names to French
const getRoomDisplayName = (roomName: string): string => {
  const roomNames: Record<string, string> = {
    arcade: "Arcade",
    stadium: "Stade",
    disco: "Discothèque",
    cinema_1: "Cinéma 1",
    cinema_2: "Cinéma 2",
    cinema_3: "Cinéma 3",
    cinema_4: "Cinéma 4",
    cinema_5: "Cinéma 5",
  }
  return roomNames[roomName] || roomName
}

// Get room emoji
const getRoomEmoji = (roomName: string): string => {
  if (roomName.startsWith("cinema")) return "🎬"
  const emojis: Record<string, string> = {
    arcade: "🕹️",
    stadium: "🏟️",
    disco: "🪩",
  }
  return emojis[roomName] || "🏠"
}

export function UserStatsModal({ userId, email, username, onClose }: UserStatsModalProps) {
  const [roomStats, setRoomStats] = useState<RoomVisit[]>([])
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserStats = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch room visit stats
      const { data: roomData, error: roomError } = await supabase
        .from("interactive_user_room_stats")
        .select("*")
        .eq("user_id", userId)
        .order("visit_count", { ascending: false })

      if (!roomError && roomData) {
        setRoomStats(roomData)
      }

      // Fetch session history (last 20 sessions)
      const { data: sessionData, error: sessionError } = await supabase
        .from("interactive_world_visits")
        .select("id, visited_at, session_end, session_duration_seconds")
        .eq("user_id", userId)
        .order("visited_at", { ascending: false })
        .limit(20)

      if (!sessionError && sessionData) {
        setSessions(sessionData)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const totalRoomTime = roomStats.reduce((sum, room) => sum + (room.total_seconds || 0), 0)
  const totalRoomVisits = roomStats.reduce((sum, room) => sum + room.visit_count, 0)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{username || "Utilisateur"}</h2>
            <p className="text-white/80 text-sm">{email || "Email non disponible"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchUserStats}
              disabled={loading}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-400 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Temps dans les salles</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{formatDuration(totalRoomTime)}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">Entrées dans les salles</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalRoomVisits}</div>
                </div>
              </div>

              {/* Room visits */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Salles visitées
                </h3>
                {roomStats.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Aucune visite de salle enregistrée</p>
                ) : (
                  <div className="grid gap-2">
                    {roomStats.map((room) => (
                      <div
                        key={room.room_name}
                        className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getRoomEmoji(room.room_name)}</span>
                          <div>
                            <div className="text-white font-medium">{getRoomDisplayName(room.room_name)}</div>
                            <div className="text-gray-400 text-sm">
                              {room.visit_count} visite{room.visit_count > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white">{formatDuration(room.total_seconds)}</div>
                          <div className="text-gray-400 text-sm">
                            moy. {formatDuration(room.avg_seconds)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Session history */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Historique des sessions (20 dernières)
                </h3>
                {sessions.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Aucune session enregistrée</p>
                ) : (
                  <div className="bg-gray-700/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-700/50">
                          <th className="text-left px-4 py-2 text-gray-300 text-sm">Date</th>
                          <th className="text-center px-4 py-2 text-gray-300 text-sm">Durée</th>
                          <th className="text-right px-4 py-2 text-gray-300 text-sm">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id} className="border-t border-gray-700/50">
                            <td className="px-4 py-2 text-white text-sm">
                              {formatDate(session.visited_at)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="bg-blue-600/50 px-2 py-1 rounded text-sm text-white">
                                {formatDuration(session.session_duration_seconds)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {session.session_end ? (
                                <span className="text-green-400 text-sm">Terminée</span>
                              ) : (
                                <span className="text-yellow-400 text-sm">En cours</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
