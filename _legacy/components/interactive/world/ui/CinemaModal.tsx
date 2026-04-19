"use client"

import { Film, X, Users, Sparkles, Clock } from "lucide-react"
import { useEffect } from "react"

interface CinemaRoom {
  id: string
  room_number: number
  name: string
  theme: string
  capacity: number
  is_open: boolean
}

interface CinemaSession {
  id: string
  room_id: string
  movie_title: string
  movie_poster: string | null
  embed_url: string
  schedule_start: string
  schedule_end: string
  is_active: boolean
}

interface CinemaSeat {
  cinema_room_id: string
  user_id: string | null
}

interface CinemaModalProps {
  cinemaRooms: CinemaRoom[]
  cinemaSessions: CinemaSession[]
  cinemaSeats: CinemaSeat[]
  onEnterRoom: (room: CinemaRoom) => void
  onClose: () => void
}

export function CinemaModal({ cinemaRooms, cinemaSessions, cinemaSeats, onEnterRoom, onClose }: CinemaModalProps) {
  const sessions = cinemaSessions || []

  useEffect(() => {
    console.log("[v0] CinemaModal - Total cinema rooms received:", cinemaRooms.length)
    console.log(
      "[v0] CinemaModal - Cinema rooms:",
      cinemaRooms.map((r) => ({
        id: r.id,
        room_number: r.room_number,
        name: r.name,
        is_open: r.is_open,
      })),
    )
    console.log("[v0] CinemaModal - Total sessions received:", sessions.length)
    console.log("[v0] CinemaModal - Current time:", new Date().toISOString())
    sessions.forEach((s) => {
      const start = new Date(s.schedule_start)
      const end = new Date(s.schedule_end)
      console.log("[v0] Session:", {
        id: s.id,
        room_id: s.room_id,
        title: s.movie_title,
        start: s.schedule_start,
        startParsed: start.toISOString(),
        end: s.schedule_end,
        endParsed: end.toISOString(),
        is_active: s.is_active,
        isValid: start < end, // Check if dates are valid
      })
    })
  }, [cinemaRooms, sessions])

  const getRoomSessions = (roomId: string) => {
    const roomSessions = sessions.filter((s) => {
      const start = new Date(s.schedule_start)
      const end = new Date(s.schedule_end)
      const isValid = start < end

      if (!isValid) {
        console.warn(`[v0] Invalid session dates for ${s.movie_title}: start ${start} >= end ${end}`)
        return false
      }

      return s.room_id === roomId && s.is_active
    })
    console.log(`[v0] getRoomSessions for ${roomId}:`, roomSessions.length, "valid sessions")
    return roomSessions.sort((a, b) => new Date(a.schedule_start).getTime() - new Date(b.schedule_start).getTime())
  }

  const getCurrentSession = (roomId: string) => {
    const now = new Date()
    const sessions = getRoomSessions(roomId)

    console.log(`[v0] getCurrentSession - Current time: ${now.toISOString()}`)
    sessions.forEach((s) => {
      const start = new Date(s.schedule_start)
      const end = new Date(s.schedule_end)
      const isCurrent = start <= now && end > now
      console.log(
        `[v0]   "${s.movie_title}": start ${start.toISOString()}, end ${end.toISOString()}, isCurrent: ${isCurrent}`,
      )
    })

    // Find currently running session
    const current = sessions.find((s) => new Date(s.schedule_start) <= now && new Date(s.schedule_end) > now)
    // If no current session, find next upcoming session
    const next = sessions.find((s) => new Date(s.schedule_start) > now)

    const result = current || next
    console.log(
      `[v0] getCurrentSession result:`,
      result ? `"${result.movie_title}" (${current ? "CURRENT" : "NEXT"})` : "NONE",
    )
    return result
  }

  const getLastOrCurrentSession = (roomId: string) => {
    const roomSessions = getRoomSessions(roomId)
    if (roomSessions.length === 0) return null

    const now = new Date()
    const currentOrFuture = roomSessions.find((s) => new Date(s.schedule_end) > now)
    return currentOrFuture || roomSessions[roomSessions.length - 1]
  }

  const getSessionTimeDisplay = (session: CinemaSession) => {
    const now = new Date()
    const start = new Date(session.schedule_start)
    const end = new Date(session.schedule_end)

    if (start <= now && end > now) {
      // Session in progress
      const elapsedMs = now.getTime() - start.getTime()
      const elapsedMins = Math.floor(elapsedMs / (1000 * 60))
      const elapsedHours = Math.floor(elapsedMins / 60)
      const mins = elapsedMins % 60

      if (elapsedHours > 0) {
        return `En cours depuis ${elapsedHours}h ${mins}min`
      }
      return `En cours depuis ${mins}min`
    } else if (start > now) {
      // Future session
      const diffMs = start.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      const mins = diffMins % 60

      if (diffHours > 0) {
        return `Dans ${diffHours}h ${mins}min`
      }
      return `Dans ${mins}min`
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-400/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Film className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            Salles de Cinéma
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {cinemaRooms.length === 0 ? (
          <div className="text-center text-white py-12">
            <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucune salle de cinéma disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cinemaRooms.map((room) => {
              const currentOccupancy = cinemaSeats.filter((s) => s.cinema_room_id === room.id && s.user_id).length
              const isFull = currentOccupancy >= room.capacity
              const isOpen = room.is_open
              const currentSession = getCurrentSession(room.id)
              const displaySession = getLastOrCurrentSession(room.id)
              const roomSessions = getRoomSessions(room.id)
              const now = new Date()
              const isSessionActive =
                currentSession &&
                new Date(currentSession.schedule_start) <= now &&
                new Date(currentSession.schedule_end) > now

              return (
                <div
                  key={room.id}
                  className={`bg-white/10 backdrop-blur rounded-xl p-4 border-2 transition-all ${
                    isFull || !isOpen
                      ? "border-gray-500/30 opacity-60"
                      : "border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    {displaySession?.movie_poster ? (
                      <img
                        src={displaySession.movie_poster || "/placeholder.svg"}
                        alt={displaySession.movie_title || "Affiche"}
                        className="w-20 h-28 object-cover rounded-lg border border-purple-400/30 flex-shrink-0"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="w-20 h-28 bg-purple-900/50 rounded-lg border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <Film className="w-8 h-8 text-purple-400/50" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-white">{room.name || `Salle ${room.room_number}`}</span>
                        {isFull && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Complète
                          </span>
                        )}
                        {!isOpen && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Fermée
                          </span>
                        )}
                        {isSessionActive && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                            En cours
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {displaySession?.movie_title || "Aucune séance"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-purple-300">
                        <Sparkles className="w-3 h-3" />
                        <span>{room.theme}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2 text-white">
                      <Users className="w-4 h-4" />
                      <span>
                        {currentOccupancy}/{room.capacity}
                      </span>
                    </div>
                  </div>

                  {roomSessions.length > 0 && (
                    <div className="mb-3 space-y-1">
                      <div className="text-xs text-purple-300 font-semibold mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Séances programmées ({roomSessions.length})
                      </div>
                      {roomSessions.slice(0, 3).map((session) => {
                        const timeDisplay = getSessionTimeDisplay(session)

                        return (
                          <div key={session.id} className="text-xs space-y-0.5">
                            <div className="text-purple-200">
                              {new Date(session.schedule_start).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}{" "}
                              à{" "}
                              {new Date(session.schedule_start).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {timeDisplay && (
                              <div
                                className={`font-semibold ${
                                  timeDisplay.startsWith("En cours") ? "text-green-400" : "text-yellow-300"
                                }`}
                              >
                                {timeDisplay}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {roomSessions.length > 3 && (
                        <div className="text-xs text-purple-300 italic">
                          +{roomSessions.length - 3} autre{roomSessions.length - 3 > 1 ? "s" : ""} séance
                          {roomSessions.length - 3 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!isFull && isOpen) {
                        onEnterRoom(room)
                      }
                    }}
                    disabled={isFull || !isOpen}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      isFull || !isOpen
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105"
                    }`}
                  >
                    {isFull ? "Salle Complète" : !isOpen ? "Salle Fermée" : "Entrer"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
