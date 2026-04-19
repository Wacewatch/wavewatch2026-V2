"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Save, Film, ImageIcon, Trash2, ChevronDown, ChevronUp } from "lucide-react"

interface CinemaRoom {
  id: string
  room_number: number
  name: string
  capacity: number
  theme: string
  access_level: string
  is_open: boolean
}

interface CinemaSession {
  id: string
  room_id: string
  movie_title: string
  embed_url: string
  schedule_start: string
  schedule_end: string
  movie_poster: string | null
  movie_tmdb_id: number | null
  is_active: boolean
}

async function generateSeatsForRoom(supabase: any, roomId: string, capacity: number) {
  // Calculate rows and seats per row based on capacity
  const seatsPerRow = Math.min(10, Math.ceil(Math.sqrt(capacity)))
  const totalRows = Math.ceil(capacity / seatsPerRow)

  const seats = []
  let seatCount = 0

  for (let row = 1; row <= totalRows && seatCount < capacity; row++) {
    const seatsInThisRow = Math.min(seatsPerRow, capacity - seatCount)
    for (let seat = 1; seat <= seatsInThisRow; seat++) {
      seats.push({
        room_id: roomId,
        row_number: row,
        seat_number: seat,
        is_occupied: false,
        user_id: null,
      })
      seatCount++
    }
  }

  if (seats.length > 0) {
    const { error } = await supabase.from("interactive_cinema_seats").insert(seats)

    if (error) {
      console.error("Error creating seats:", error)
      return false
    }
  }

  return true
}

async function updateSeatsForRoom(supabase: any, roomId: string, newCapacity: number) {
  // First, delete all existing seats for this room
  await supabase.from("interactive_cinema_seats").delete().eq("room_id", roomId)

  // Then regenerate seats with new capacity
  return await generateSeatsForRoom(supabase, roomId, newCapacity)
}

function formatDateForInput(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ""
  }
}

function formatTimeForInput(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  } catch {
    return ""
  }
}

function parseDateTime(dateStr: string, timeStr: string): string {
  try {
    // Parse date in format DD/MM/YYYY
    const dateParts = dateStr.split("/")
    if (dateParts.length !== 3) return new Date().toISOString()

    const day = Number.parseInt(dateParts[0])
    const month = Number.parseInt(dateParts[1]) - 1 // JS months are 0-indexed
    const year = Number.parseInt(dateParts[2])

    // Parse time in format HH:MM
    const timeParts = timeStr.split(":")
    if (timeParts.length !== 2) return new Date().toISOString()

    const hours = Number.parseInt(timeParts[0])
    const minutes = Number.parseInt(timeParts[1])

    const date = new Date(year, month, day, hours, minutes)
    return date.toISOString()
  } catch (error) {
    console.error("Error parsing date/time:", error)
    return new Date().toISOString()
  }
}

export function CinemaRoomsPanel({ rooms, sessions }: { rooms: any[]; sessions: any[] }) {
  const [cinemaRooms, setCinemaRooms] = useState<CinemaRoom[]>(rooms)
  const [cinemaSessions, setCinemaSessions] = useState<CinemaSession[]>(sessions)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const toggleRoomSessions = (roomId: string) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

  const handleCreateSession = async (roomId: string) => {
    const now = new Date()
    const defaultStart = new Date(now.getTime() + 3600000) // +1 hour
    const defaultEnd = new Date(defaultStart.getTime() + 7200000) // +2 hours

    const { data, error } = await supabase
      .from("interactive_cinema_sessions")
      .insert({
        room_id: roomId,
        movie_title: "",
        embed_url: "",
        schedule_start: defaultStart.toISOString(),
        schedule_end: defaultEnd.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la séance",
        variant: "destructive",
      })
      return
    }

    setCinemaSessions([...cinemaSessions, data])
    toast({
      title: "Séance créée",
      description: "Nouvelle séance ajoutée à la salle",
    })
  }

  const handleUpdateSession = async (session: CinemaSession) => {
    setIsSaving(session.id)

    const { error } = await supabase
      .from("interactive_cinema_sessions")
      .update({
        movie_title: session.movie_title,
        embed_url: session.embed_url,
        schedule_start: new Date(session.schedule_start).toISOString(),
        schedule_end: new Date(session.schedule_end).toISOString(),
        movie_poster: session.movie_poster,
        movie_tmdb_id: session.movie_tmdb_id,
        is_active: session.is_active,
      })
      .eq("id", session.id)

    if (error) {
      console.error("Error updating session:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la séance",
        variant: "destructive",
      })
      setIsSaving(null)
      return
    }

    toast({
      title: "Séance mise à jour",
      description: "Les informations de la séance ont été sauvegardées",
    })
    setIsSaving(null)
  }

  const handleDeleteSession = async (sessionId: string, movieTitle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la séance "${movieTitle}" ?`)) {
      return
    }

    const { error } = await supabase.from("interactive_cinema_sessions").delete().eq("id", sessionId)

    if (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la séance",
        variant: "destructive",
      })
      return
    }

    setCinemaSessions(cinemaSessions.filter((s) => s.id !== sessionId))
    toast({
      title: "Séance supprimée",
      description: `La séance "${movieTitle}" a été supprimée`,
    })
  }

  const handleCreateRoom = async () => {
    const newRoomNumber = cinemaRooms.length > 0 ? Math.max(...cinemaRooms.map((r) => r.room_number)) + 1 : 1
    const defaultCapacity = 30

    const { data, error } = await supabase
      .from("interactive_cinema_rooms")
      .insert({
        room_number: newRoomNumber,
        name: `Salle ${newRoomNumber}`,
        capacity: defaultCapacity,
        theme: "default",
        access_level: "public",
        is_open: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la salle",
        variant: "destructive",
      })
      return
    }

    const seatsCreated = await generateSeatsForRoom(supabase, data.id, defaultCapacity)

    if (!seatsCreated) {
      toast({
        title: "Attention",
        description: "La salle a été créée mais les sièges n'ont pas pu être générés",
        variant: "destructive",
      })
    }

    setCinemaRooms([...cinemaRooms, data])
    toast({
      title: "Salle créée",
      description: `La salle ${data.name} a été créée avec ${defaultCapacity} sièges`,
    })
  }

  const [originalCapacities, setOriginalCapacities] = useState<Record<string, number>>(
    Object.fromEntries(rooms.map((r) => [r.id, r.capacity])),
  )

  const handleUpdateRoom = async (room: CinemaRoom) => {
    setIsSaving(room.id)

    const { error } = await supabase
      .from("interactive_cinema_rooms")
      .update({
        room_number: room.room_number,
        name: room.name,
        capacity: room.capacity,
        theme: room.theme,
        access_level: room.access_level,
        is_open: room.is_open,
      })
      .eq("id", room.id)

    if (error) {
      console.error("Error updating room:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la salle",
        variant: "destructive",
      })
      setIsSaving(null)
      return
    }

    if (originalCapacities[room.id] !== room.capacity) {
      const seatsUpdated = await updateSeatsForRoom(supabase, room.id, room.capacity)
      if (seatsUpdated) {
        setOriginalCapacities((prev) => ({ ...prev, [room.id]: room.capacity }))
        toast({
          title: "Salle mise à jour",
          description: `La salle ${room.name} a été mise à jour avec ${room.capacity} sièges`,
        })
      } else {
        toast({
          title: "Attention",
          description: "La salle a été mise à jour mais les sièges n'ont pas pu être régénérés",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Salle mise à jour",
        description: `La salle ${room.name} a été mise à jour avec succès`,
      })
    }

    setIsSaving(null)
  }

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la salle "${roomName}" ?`)) {
      return
    }

    await supabase.from("interactive_cinema_seats").delete().eq("room_id", roomId)
    await supabase.from("interactive_cinema_sessions").delete().eq("room_id", roomId)

    const { error } = await supabase.from("interactive_cinema_rooms").delete().eq("id", roomId)

    if (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle",
        variant: "destructive",
      })
      return
    }

    setCinemaRooms(cinemaRooms.filter((r) => r.id !== roomId))
    setCinemaSessions(cinemaSessions.filter((s) => s.room_id !== roomId))
    toast({
      title: "Salle supprimée",
      description: `La salle ${roomName} a été supprimée`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Film className="w-5 h-5" />
          Gestion des Salles de Cinéma
        </h3>
        <Button onClick={handleCreateRoom} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer une Salle
        </Button>
      </div>

      <div className="space-y-4">
        {cinemaRooms.map((room) => {
          const roomSessions = cinemaSessions.filter((s) => s.room_id === room.id)
          const isExpanded = expandedRooms.has(room.id)
          const latestSession = roomSessions.sort(
            (a, b) => new Date(b.schedule_start).getTime() - new Date(a.schedule_start).getTime(),
          )[0]

          return (
            <div key={room.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {latestSession?.movie_poster ? (
                    <img
                      src={latestSession.movie_poster || "/placeholder.svg"}
                      alt={latestSession.movie_title || "Affiche"}
                      className="w-24 h-36 object-cover rounded-lg border border-gray-600"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="w-24 h-36 bg-gray-600 rounded-lg border border-gray-500 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Numéro de Salle</label>
                      <Input
                        type="number"
                        value={room.room_number}
                        onChange={(e) => {
                          setCinemaRooms(
                            cinemaRooms.map((r) =>
                              r.id === room.id ? { ...r, room_number: Number.parseInt(e.target.value) } : r,
                            ),
                          )
                        }}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Nom de la Salle</label>
                      <Input
                        value={room.name}
                        onChange={(e) => {
                          setCinemaRooms(
                            cinemaRooms.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r)),
                          )
                        }}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Capacité (sièges)</label>
                      <Input
                        type="number"
                        value={room.capacity}
                        onChange={(e) => {
                          setCinemaRooms(
                            cinemaRooms.map((r) =>
                              r.id === room.id ? { ...r, capacity: Number.parseInt(e.target.value) } : r,
                            ),
                          )
                        }}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                      {originalCapacities[room.id] !== room.capacity && (
                        <p className="text-xs text-yellow-400">⚠️ Les sièges seront régénérés à la sauvegarde</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Thème</label>
                      <select
                        value={room.theme}
                        onChange={(e) => {
                          setCinemaRooms(
                            cinemaRooms.map((r) => (r.id === room.id ? { ...r, theme: e.target.value } : r)),
                          )
                        }}
                        className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
                      >
                        <option value="default">Par défaut</option>
                        <option value="luxury">Luxe</option>
                        <option value="retro">Rétro</option>
                        <option value="modern">Moderne</option>
                        <option value="horror">Horreur</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Niveau d'Accès</label>
                      <select
                        value={room.access_level}
                        onChange={(e) => {
                          setCinemaRooms(
                            cinemaRooms.map((r) => (r.id === room.id ? { ...r, access_level: e.target.value } : r)),
                          )
                        }}
                        className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
                      >
                        <option value="public">Public</option>
                        <option value="vip">VIP</option>
                        <option value="vip_plus">VIP+</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-2 flex items-center">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={room.is_open}
                          onChange={(e) => {
                            setCinemaRooms(
                              cinemaRooms.map((r) => (r.id === room.id ? { ...r, is_open: e.target.checked } : r)),
                            )
                          }}
                        />
                        Salle Ouverte
                      </label>
                    </div>

                    <div className="lg:col-span-3 flex justify-end gap-2">
                      <Button
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                      <Button
                        onClick={() => handleUpdateRoom(room)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isSaving === room.id}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving === room.id ? "Sauvegarde..." : "Sauvegarder"}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <button
                      onClick={() => toggleRoomSessions(room.id)}
                      className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Film className="w-4 h-4" />
                        Séances programmées ({roomSessions.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {roomSessions.map((session) => (
                          <div key={session.id} className="p-4 bg-gray-600 rounded-lg border border-gray-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Titre du Film</label>
                                <Input
                                  value={session.movie_title}
                                  onChange={(e) => {
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, movie_title: e.target.value } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="F1 le Film (2025)"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">URL Video</label>
                                <Input
                                  value={session.embed_url}
                                  onChange={(e) => {
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, embed_url: e.target.value } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="https://apis.wavewatch.xyz/videocinema.php"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Date de Début</label>
                                <Input
                                  value={formatDateForInput(session.schedule_start)}
                                  onChange={(e) => {
                                    const dateStr = e.target.value
                                    const timeStr = formatTimeForInput(session.schedule_start) || "00:00"
                                    const newDateTime = parseDateTime(dateStr, timeStr)
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, schedule_start: newDateTime } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="12/25/2025"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Heure de Début</label>
                                <Input
                                  value={formatTimeForInput(session.schedule_start)}
                                  onChange={(e) => {
                                    const timeStr = e.target.value
                                    const dateStr = formatDateForInput(session.schedule_start) || "01/01/2025"
                                    const newDateTime = parseDateTime(dateStr, timeStr)
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, schedule_start: newDateTime } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="14:30"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Date de Fin</label>
                                <Input
                                  value={formatDateForInput(session.schedule_end)}
                                  onChange={(e) => {
                                    const dateStr = e.target.value
                                    const timeStr = formatTimeForInput(session.schedule_end) || "00:00"
                                    const newDateTime = parseDateTime(dateStr, timeStr)
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, schedule_end: newDateTime } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="12/25/2025"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Heure de Fin</label>
                                <Input
                                  value={formatTimeForInput(session.schedule_end)}
                                  onChange={(e) => {
                                    const timeStr = e.target.value
                                    const dateStr = formatDateForInput(session.schedule_end) || "01/01/2025"
                                    const newDateTime = parseDateTime(dateStr, timeStr)
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, schedule_end: newDateTime } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="16:30"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">URL Affiche</label>
                                <Input
                                  value={session.movie_poster || ""}
                                  onChange={(e) => {
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id ? { ...s, movie_poster: e.target.value } : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="https://fr.web.img6.acsta.net/..."
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">ID TMDB</label>
                                <Input
                                  type="number"
                                  value={session.movie_tmdb_id || ""}
                                  onChange={(e) => {
                                    setCinemaSessions(
                                      cinemaSessions.map((s) =>
                                        s.id === session.id
                                          ? { ...s, movie_tmdb_id: Number.parseInt(e.target.value) || null }
                                          : s,
                                      ),
                                    )
                                  }}
                                  className="bg-gray-500 border-gray-400 text-white"
                                  placeholder="1"
                                />
                              </div>

                              <div className="space-y-2 flex items-center">
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={session.is_active}
                                    onChange={(e) => {
                                      setCinemaSessions(
                                        cinemaSessions.map((s) =>
                                          s.id === session.id ? { ...s, is_active: e.target.checked } : s,
                                        ),
                                      )
                                    }}
                                  />
                                  Active
                                </label>
                              </div>

                              <div className="md:col-span-2 flex justify-end gap-2">
                                <Button
                                  onClick={() => handleDeleteSession(session.id, session.movie_title)}
                                  size="sm"
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </Button>
                                <Button
                                  onClick={() => handleUpdateSession(session)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={isSaving === session.id}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  {isSaving === session.id ? "Sauvegarde..." : "Sauver"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={() => handleCreateSession(room.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une Séance
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {cinemaRooms.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Aucune salle de cinéma. Cliquez sur "Créer une Salle" pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}
