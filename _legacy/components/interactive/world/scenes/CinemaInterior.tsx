"use client"

import { Html } from "@react-three/drei"
import { HLSVideoScreen } from "../../hls-video-screen"
import { useState, useEffect, useRef } from "react"

interface CinemaRoom {
  id: string
  room_number: number
  name?: string
  capacity?: number
  theme?: string
}

interface CinemaSeat {
  id: string
  row_number: number
  seat_number: number
  user_id: string | null
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

interface CinemaInteriorProps {
  currentCinemaRoom: CinemaRoom
  cinemaRooms: CinemaRoom[]
  cinemaSessions: CinemaSession[]
  cinemaSeats: CinemaSeat[]
  mySeat: number | null
  showMovieFullscreen: boolean
  isCinemaMuted: boolean
  countdown: string
}

function generateSeatPosition(rowNumber: number, seatNumber: number, totalSeatsPerRow = 10): [number, number, number] {
  const rowSpacing = 2.5
  const seatSpacing = 1.5
  const startX = -((totalSeatsPerRow - 1) * seatSpacing) / 2
  const firstRowZ = 2

  const x = startX + (seatNumber - 1) * seatSpacing
  const y = 0.4
  const z = firstRowZ + (rowNumber - 1) * rowSpacing

  return [x, y, z]
}

function getThemeColors(theme?: string): { floor: string; wall: string; seatDefault: string } {
  switch (theme) {
    case "luxury":
      return { floor: "#1a1a2e", wall: "#16213e", seatDefault: "#c9a227" }
    case "retro":
      return { floor: "#3d0c02", wall: "#1a0f0a", seatDefault: "#8b4513" }
    case "modern":
      return { floor: "#0f0f0f", wall: "#1f1f1f", seatDefault: "#4a4a4a" }
    case "horror":
      return { floor: "#0a0000", wall: "#1a0000", seatDefault: "#8b0000" }
    default:
      return { floor: "#2d1010", wall: "#1a0f0a", seatDefault: "#374151" }
  }
}

function getVideoType(url: string): "mp4" | "m3u8" | "iframe" | "unknown" {
  if (!url) return "unknown"
  const lowerUrl = url.toLowerCase()

  if (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes(".php")
  ) {
    return "mp4"
  }
  if (lowerUrl.includes(".m3u8")) {
    return "m3u8"
  }
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("vimeo.com")) {
    return "iframe"
  }
  return "mp4"
}

function calculateSyncPosition(scheduleStart: string): number {
  const startDate = new Date(scheduleStart)
  const now = new Date()
  const elapsedSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000)
  return Math.max(0, elapsedSeconds)
}

export default function CinemaInterior({
  currentCinemaRoom,
  cinemaRooms,
  cinemaSessions,
  cinemaSeats,
  mySeat,
  showMovieFullscreen,
  isCinemaMuted,
  countdown,
}: CinemaInteriorProps) {
  console.log("[v0] ============================================")
  console.log("[v0] [CinemaInterior] RENDERING")
  console.log("[v0] [CinemaInterior] Room ID:", currentCinemaRoom?.id)
  console.log("[v0] [CinemaInterior] Room Number:", currentCinemaRoom?.room_number)
  console.log("[v0] [CinemaInterior] Room Name:", currentCinemaRoom?.name)
  console.log("[v0] [CinemaInterior] Theme:", currentCinemaRoom?.theme)
  console.log("[v0] [CinemaInterior] Capacity:", currentCinemaRoom?.capacity)
  console.log("[v0] [CinemaInterior] Total rooms in array:", cinemaRooms.length)
  console.log("[v0] [CinemaInterior] Total sessions:", cinemaSessions.length)
  console.log("[v0] [CinemaInterior] Total seats:", cinemaSeats.length)
  console.log("[v0] [CinemaInterior] My seat:", mySeat)
  console.log("[v0] ============================================")

  const room = cinemaRooms.find((r) => r.id === currentCinemaRoom.id) || currentCinemaRoom

  console.log("[v0] CinemaInterior MOUNTED")
  console.log("[v0] Room:", room.name || `Salle ${room.room_number}`, "ID:", room.id)
  console.log("[v0] Total sessions received:", cinemaSessions.length)
  console.log("[v0] Current time:", new Date().toISOString())

  const roomSessions = (cinemaSessions || [])
    .filter((s) => {
      const start = new Date(s.schedule_start)
      const end = new Date(s.schedule_end)
      const isValid = start < end

      if (!isValid) {
        console.warn(`[v0] INVALID session dates for "${s.movie_title}": start >= end`)
        return false
      }

      const matches = s.room_id === room.id && s.is_active
      console.log(
        `[v0] Session "${s.movie_title}" - room match: ${s.room_id === room.id}, active: ${s.is_active}, valid: ${isValid}`,
      )
      return matches
    })
    .sort((a, b) => new Date(a.schedule_start).getTime() - new Date(b.schedule_start).getTime())

  console.log("[v0] Filtered room sessions:", roomSessions.length)

  const now = new Date()

  roomSessions.forEach((s, idx) => {
    const start = new Date(s.schedule_start)
    const end = new Date(s.schedule_end)
    const isCurrent = start <= now && end > now
    const isFuture = start > now
    console.log(`[v0] Session ${idx + 1}: "${s.movie_title}"`)
    console.log(`[v0]   Start: ${start.toISOString()}`)
    console.log(`[v0]   End: ${end.toISOString()}`)
    console.log(`[v0]   Status: ${isCurrent ? "CURRENT" : isFuture ? "FUTURE" : "PAST"}`)
  })

  const currentSession =
    roomSessions.find((s) => {
      const start = new Date(s.schedule_start)
      const end = new Date(s.schedule_end)
      return start <= now && end > now
    }) || roomSessions.find((s) => new Date(s.schedule_start) > now)

  console.log("[v0] Selected session:", currentSession ? `"${currentSession.movie_title}"` : "NONE")

  const nextSession = roomSessions.find((s) => new Date(s.schedule_start) > now)

  const isMovieStarted = currentSession && new Date(currentSession.schedule_start).getTime() < Date.now()
  const isMovieEnded = currentSession && new Date(currentSession.schedule_end).getTime() < Date.now()
  const videoUrl = currentSession?.embed_url
  const movieTitle = currentSession?.movie_title || room.name
  const moviePoster = currentSession?.movie_poster
  const scheduleStart = currentSession?.schedule_start
  const scheduleEnd = currentSession?.schedule_end

  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoStartPosition, setVideoStartPosition] = useState(0)

  const themeColors = getThemeColors(room.theme)
  console.log("[v0] [CinemaInterior] Theme colors:", themeColors)

  // Generate seats dynamically
  const totalRows = Math.ceil((room.capacity || 50) / 10)
  const generatedSeats = []

  console.log("[v0] [CinemaInterior] Generating seats - Total rows:", totalRows, "Capacity:", room.capacity)

  for (let row = 1; row <= totalRows; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      const [x, y, z] = generateSeatPosition(row, seat)
      generatedSeats.push({ row, seat, x, y, z })
    }
  }

  console.log("[v0] [CinemaInterior] Generated", generatedSeats.length, "seat positions")

  useEffect(() => {
    if (scheduleStart && isMovieStarted && !isMovieEnded) {
      const syncPosition = calculateSyncPosition(scheduleStart)
      setVideoStartPosition(syncPosition)

      const videoSyncInterval = setInterval(() => {
        if (videoRef.current && scheduleStart) {
          const expectedPosition = calculateSyncPosition(scheduleStart)
          const currentPosition = videoRef.current.currentTime
          const drift = Math.abs(expectedPosition - currentPosition)

          if (drift > 5) {
            console.log(`[v0] Syncing video: drift ${drift}s, seeking to ${expectedPosition}s`)
            videoRef.current.currentTime = expectedPosition
          }
        }
      }, 5000)

      return () => {
        clearInterval(videoSyncInterval)
      }
    }
  }, [scheduleStart, isMovieStarted, isMovieEnded])

  const videoType = videoUrl ? getVideoType(videoUrl) : "unknown"

  const getTimeUntilNextSession = () => {
    if (!nextSession) return null
    const nextStart = new Date(nextSession.schedule_start)
    const diffMs = nextStart.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min`
    }
    return `${diffMins}min`
  }

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 50]} />
        <meshStandardMaterial color={themeColors.floor} />
      </mesh>

      {/* Horror theme decorations */}
      {room?.theme === "horror" && (
        <>
          {/* Red ambient lights */}
          <pointLight position={[-15, 3, -20]} color="#ff0000" intensity={0.5} distance={15} />
          <pointLight position={[15, 3, -20]} color="#ff0000" intensity={0.5} distance={15} />
          <pointLight position={[-15, 3, 10]} color="#aa0000" intensity={0.3} distance={12} />
          <pointLight position={[15, 3, 10]} color="#aa0000" intensity={0.3} distance={12} />

          {/* Spider webs in corners */}
          <mesh position={[-19, 7, -24]}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial color="#cccccc" transparent opacity={0.3} />
          </mesh>
          <mesh position={[19, 7, -24]}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial color="#cccccc" transparent opacity={0.3} />
          </mesh>

          {/* Skulls on walls */}
          <mesh position={[-18, 5, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>
          <mesh position={[-18, 4.5, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>

          <mesh position={[18, 5, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>
          <mesh position={[18, 4.5, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>

          {/* Blood drips on screen frame */}
          <mesh position={[-8, 9, -18]}>
            <cylinderGeometry args={[0.05, 0.08, 1.5, 8]} />
            <meshStandardMaterial color="#8b0000" />
          </mesh>
          <mesh position={[8, 9, -18]}>
            <cylinderGeometry args={[0.05, 0.08, 1.5, 8]} />
            <meshStandardMaterial color="#8b0000" />
          </mesh>

          {/* Flickering candles */}
          <mesh position={[-10, 0.5, 20]}>
            <cylinderGeometry args={[0.1, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          <pointLight position={[-10, 1, 20]} color="#ff8800" intensity={0.5} distance={3} />

          <mesh position={[10, 0.5, 20]}>
            <cylinderGeometry args={[0.1, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          <pointLight position={[10, 1, 20]} color="#ff8800" intensity={0.5} distance={3} />
        </>
      )}

      {/* Luxury theme decorations */}
      {room?.theme === "luxury" && (
        <>
          {/* Gold chandeliers */}
          <mesh position={[0, 7, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 1, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          <pointLight position={[0, 6.5, 0]} color="#ffd700" intensity={1} distance={20} />

          {/* Crystal lights */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const x = Math.cos(angle) * 1.5
            const z = Math.sin(angle) * 1.5
            return (
              <mesh key={i} position={[x, 6, z]}>
                <octahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.8} metalness={1} roughness={0} />
              </mesh>
            )
          })}

          {/* Velvet curtains */}
          <mesh position={[-9.5, 4, -18]}>
            <boxGeometry args={[0.5, 10, 0.3]} />
            <meshStandardMaterial color="#8b0a50" />
          </mesh>
          <mesh position={[9.5, 4, -18]}>
            <boxGeometry args={[0.5, 10, 0.3]} />
            <meshStandardMaterial color="#8b0a50" />
          </mesh>

          {/* Gold ornaments on walls */}
          <mesh position={[-18, 6, -10]}>
            <torusGeometry args={[0.5, 0.1, 16, 32]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[18, 6, -10]}>
            <torusGeometry args={[0.5, 0.1, 16, 32]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-18, 6, 10]}>
            <torusGeometry args={[0.5, 0.1, 16, 32]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[18, 6, 10]}>
            <torusGeometry args={[0.5, 0.1, 16, 32]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Red carpet effect with gold trim */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
            <planeGeometry args={[6, 30]} />
            <meshStandardMaterial color="#8b0000" />
          </mesh>
        </>
      )}

      {/* Retro theme decorations */}
      {room?.theme === "retro" && (
        <>
          {/* Vintage popcorn machines */}
          <mesh position={[-15, 0.8, 20]}>
            <cylinderGeometry args={[0.4, 0.5, 1.5, 8]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          <mesh position={[-15, 2, 20]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ffff00" transparent opacity={0.3} />
          </mesh>
          <pointLight position={[-15, 2, 20]} color="#ffff00" intensity={0.4} distance={5} />

          <mesh position={[15, 0.8, 20]}>
            <cylinderGeometry args={[0.4, 0.5, 1.5, 8]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          <mesh position={[15, 2, 20]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ffff00" transparent opacity={0.3} />
          </mesh>
          <pointLight position={[15, 2, 20]} color="#ffff00" intensity={0.4} distance={5} />

          {/* Vintage film reels on walls */}
          <mesh position={[-18, 5, -5]}>
            <cylinderGeometry args={[0.6, 0.6, 0.2, 32]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[-18, 5, -5]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.4, 0.05, 16, 32]} />
            <meshStandardMaterial color="#2f1f0f" />
          </mesh>

          <mesh position={[18, 5, -5]}>
            <cylinderGeometry args={[0.6, 0.6, 0.2, 32]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[18, 5, -5]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.4, 0.05, 16, 32]} />
            <meshStandardMaterial color="#2f1f0f" />
          </mesh>

          {/* Retro neon lights */}
          <mesh position={[0, 7, 24]}>
            <boxGeometry args={[12, 0.3, 0.3]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
          <pointLight position={[0, 7, 24]} color="#ff00ff" intensity={0.8} distance={15} />

          {/* Old projector in back */}
          <mesh position={[0, 2, 22]}>
            <boxGeometry args={[1, 0.8, 1.2]} />
            <meshStandardMaterial color="#4a4a4a" />
          </mesh>
          <mesh position={[0, 2.5, 21.5]}>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <pointLight position={[0, 2.5, 21]} color="#ffff88" intensity={0.3} distance={8} />
        </>
      )}

      {/* Modern theme decorations */}
      {room?.theme === "modern" && (
        <>
          {/* LED strip lights on ceiling */}
          <mesh position={[-18, 7.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[50, 0.1, 0.1]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <pointLight position={[-18, 7.5, 0]} color="#00ffff" intensity={0.5} distance={15} />

          <mesh position={[18, 7.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[50, 0.1, 0.1]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <pointLight position={[18, 7.5, 0]} color="#00ffff" intensity={0.5} distance={15} />

          {/* Minimalist light panels */}
          <mesh position={[-18, 4, -15]}>
            <boxGeometry args={[0.1, 3, 1.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight position={[-17.5, 4, -15]} color="#ffffff" intensity={0.8} distance={8} />

          <mesh position={[18, 4, -15]}>
            <boxGeometry args={[0.1, 3, 1.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight position={[17.5, 4, -15]} color="#ffffff" intensity={0.8} distance={8} />

          <mesh position={[-18, 4, 15]}>
            <boxGeometry args={[0.1, 3, 1.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight position={[-17.5, 4, 15]} color="#ffffff" intensity={0.8} distance={8} />

          <mesh position={[18, 4, 15]}>
            <boxGeometry args={[0.1, 3, 1.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight position={[17.5, 4, 15]} color="#ffffff" intensity={0.8} distance={8} />

          {/* Geometric wall art */}
          <mesh position={[-18, 5, 0]}>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.1} />
          </mesh>

          <mesh position={[18, 5, 0]}>
            <icosahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Sleek speaker systems */}
          <mesh position={[-9, 5, -18]}>
            <boxGeometry args={[0.4, 2, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[9, 5, -18]}>
            <boxGeometry args={[0.4, 2, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Default theme decorations */}
      {!room?.theme ||
        (room?.theme === "default" && (
          <>
            {/* Classic cinema sconces */}
            <mesh position={[-18, 5, -10]}>
              <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
            <pointLight position={[-17.5, 5, -10]} color="#ffaa00" intensity={0.5} distance={8} />

            <mesh position={[18, 5, -10]}>
              <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
            <pointLight position={[17.5, 5, -10]} color="#ffaa00" intensity={0.5} distance={8} />

            <mesh position={[-18, 5, 10]}>
              <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
            <pointLight position={[-17.5, 5, 10]} color="#ffaa00" intensity={0.5} distance={8} />

            <mesh position={[18, 5, 10]}>
              <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
            <pointLight position={[17.5, 5, 10]} color="#ffaa00" intensity={0.5} distance={8} />

            {/* Classic movie posters frames */}
            <mesh position={[-18, 4, 0]}>
              <boxGeometry args={[0.1, 2, 1.5]} />
              <meshStandardMaterial color="#654321" />
            </mesh>

            <mesh position={[18, 4, 0]}>
              <boxGeometry args={[0.1, 2, 1.5]} />
              <meshStandardMaterial color="#654321" />
            </mesh>

            {/* Exit signs */}
            <mesh position={[0, 6, 24]}>
              <boxGeometry args={[1.5, 0.6, 0.2]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <pointLight position={[0, 6, 24]} color="#00ff00" intensity={0.4} distance={5} />
          </>
        ))}

      {/* Side walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-20, 4, 0]}>
        <planeGeometry args={[50, 8]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>

      <mesh rotation={[0, -Math.PI / 2, 0]} position={[20, 4, 0]}>
        <planeGeometry args={[50, 8]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>

      {/* Back wall with screen */}
      <mesh position={[0, 4, 25]}>
        <boxGeometry args={[40, 8, 0.5]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>
      <mesh position={[-20, 4, 0]}>
        <boxGeometry args={[0.5, 8, 50]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>
      <mesh position={[20, 4, 0]}>
        <boxGeometry args={[0.5, 8, 50]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>
      <mesh position={[0, 4, -25]}>
        <boxGeometry args={[40, 8, 0.5]} />
        <meshStandardMaterial color={themeColors.wall} />
      </mesh>

      <mesh position={[0, 4, -18]}>
        <boxGeometry args={[18, 10, 0.2]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      <mesh position={[0, 4, -17.5]}>
        <boxGeometry args={[40, 4, 0.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {room && (
        <group position={[0, 4, -17.5]}>
          {!isMovieStarted && (
            <Html position={[0, 0, 0.5]} center zIndexRange={[100, 0]}>
              <div className="bg-black/80 p-6 rounded-lg text-white text-center backdrop-blur">
                <h2 className="text-3xl font-bold mb-2">{movieTitle || "Salle de cinéma"}</h2>
                {scheduleStart && (
                  <p className="text-lg text-gray-300 mb-4">
                    Début dans: <span className="text-yellow-400 font-bold">{countdown}</span>
                  </p>
                )}
                {moviePoster && (
                  <img
                    src={moviePoster || "/placeholder.svg"}
                    alt={movieTitle}
                    className="w-40 h-60 object-cover rounded mx-auto"
                  />
                )}
                <p className="text-sm text-gray-400 mt-4">Watch Party - Le film démarrera automatiquement</p>
              </div>
            </Html>
          )}

          {isMovieEnded && (
            <Html position={[0, 0, 0.5]} center zIndexRange={[100, 0]}>
              <div className="bg-black/80 p-6 rounded-lg text-white text-center backdrop-blur">
                {nextSession ? (
                  <>
                    <h2 className="text-2xl font-bold mb-2">Prochaine séance</h2>
                    <p className="text-gray-300 mb-4">{nextSession.movie_title}</p>
                    {nextSession.movie_poster && (
                      <img
                        src={nextSession.movie_poster || "/placeholder.svg"}
                        alt={nextSession.movie_title}
                        className="w-40 h-60 object-cover rounded mx-auto mb-4"
                      />
                    )}
                    <p className="text-lg text-yellow-400 font-bold">Début dans {getTimeUntilNextSession()}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(nextSession.schedule_start).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-2">Séance terminée</h2>
                    <p className="text-gray-300">Aucune prochaine séance programmée.</p>
                    <p className="text-sm text-gray-400 mt-2">Revenez plus tard!</p>
                  </>
                )}
              </div>
            </Html>
          )}

          {!videoUrl && !currentSession && (
            <Html position={[0, 0, 0.5]} center zIndexRange={[100, 0]}>
              <div className="bg-black/80 p-6 rounded-lg text-white text-center backdrop-blur">
                <h2 className="text-2xl font-bold mb-2">{room.name || `Salle ${room.room_number}`}</h2>
                <p className="text-gray-300">Aucune séance programmée</p>
                <p className="text-sm text-gray-400 mt-2">Revenez plus tard pour la prochaine Watch Party!</p>
              </div>
            </Html>
          )}

          {isMovieStarted && !isMovieEnded && videoUrl && !showMovieFullscreen && (
            <>
              {videoType === "mp4" && (
                <Html transform style={{ width: "1400px", height: "780px" }} position={[0, 0, 0.3]}>
                  <div className="relative w-full h-full bg-black rounded overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted={isCinemaMuted}
                      playsInline
                      controls={false}
                      controlsList="nodownload nofullscreen noremoteplayback"
                      disablePictureInPicture
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget
                        const syncTime = scheduleStart ? calculateSyncPosition(scheduleStart) : 0
                        console.log(`[v0] Video loaded, syncing to ${syncTime}s from session schedule_start`)
                        if (syncTime > 0 && video.duration > syncTime) {
                          video.currentTime = syncTime
                        }
                        video.play().catch(() => {})
                      }}
                      onCanPlay={(e) => {
                        e.currentTarget.play().catch(() => {})
                      }}
                      style={{ pointerEvents: "none" }}
                    />
                    <div className="absolute inset-0 bg-transparent" style={{ pointerEvents: "all" }} />
                  </div>
                </Html>
              )}

              {videoType === "m3u8" && (
                <HLSVideoScreen
                  key={`hls-embed-${room.id}-${currentSession?.id}`}
                  src={videoUrl}
                  width={14}
                  height={8}
                  position={[0, 0, 0.3]}
                  autoplay={true}
                  muted={isCinemaMuted}
                  scheduleStart={scheduleStart}
                />
              )}

              {videoType === "iframe" && videoUrl && (
                <Html transform style={{ width: "1400px", height: "780px" }} position={[0, 0, 0.3]}>
                  <div className="relative w-full h-full">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full rounded"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen={false}
                      style={{ border: "none" }}
                    />
                    <div
                      className="absolute inset-0 bg-transparent cursor-default"
                      style={{ pointerEvents: "all" }}
                      onClick={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                </Html>
              )}
            </>
          )}
        </group>
      )}

      {generatedSeats.length > 0 &&
        generatedSeats.map((seat) => {
          const seatId = seat.row * 100 + seat.seat
          const isMySeat = mySeat === seatId
          const isOccupied = false // Assuming cinemaSeats array does not provide user_id for generated seats

          const seatColor = isMySeat ? "#ef4444" : isOccupied ? "#f97316" : themeColors.seatDefault

          return (
            <group key={seatId} position={[seat.x, seat.y, seat.z]}>
              <mesh castShadow position={[0, 0, 0]}>
                <boxGeometry args={[1, 0.8, 0.9]} />
                <meshStandardMaterial color={seatColor} />
              </mesh>
              <mesh castShadow position={[0, 0.6, 0.35]}>
                <boxGeometry args={[1, 0.8, 0.2]} />
                <meshStandardMaterial color={seatColor} />
              </mesh>
              <mesh castShadow position={[-0.45, 0.2, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.7]} />
                <meshStandardMaterial color={seatColor} />
              </mesh>
              <mesh castShadow position={[0.45, 0.2, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.7]} />
                <meshStandardMaterial color={seatColor} />
              </mesh>
            </group>
          )
        })}
    </>
  )
}
