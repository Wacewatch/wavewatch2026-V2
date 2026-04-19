"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Film, Radius as Stadium, Users, Calendar, Clock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type CinemaSession = {
  id: string
  movie_title: string
  movie_poster: string
  schedule_start: string
  schedule_end: string
  interactive_cinema_rooms?: {
    name?: string
    room_number?: number
  }
}

type StadiumData = {
  match_title?: string
  schedule_start: string
  schedule_end: string
} | null

async function getCinemaSessionsData() {
  try {
    const now = new Date().toISOString()

    // Get next 3 upcoming cinema sessions
    const { data: sessions } = await supabase
      .from("interactive_cinema_sessions")
      .select("*, interactive_cinema_rooms(name, room_number)")
      .eq("is_active", true)
      .gte("schedule_end", now)
      .order("schedule_start", { ascending: true })
      .limit(3)

    return sessions || []
  } catch (error) {
    console.error("Error loading cinema sessions:", error)
    return []
  }
}

async function getStadiumData() {
  try {
    const now = new Date().toISOString()

    // Get current or next stadium match
    const { data: stadium } = await supabase
      .from("interactive_stadium")
      .select("*")
      .eq("is_open", true)
      .gte("schedule_end", now)
      .order("schedule_start", { ascending: true })
      .limit(1)
      .single()

    return stadium
  } catch (error) {
    console.error("Error loading stadium data:", error)
    return null
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function isCurrentlyPlaying(startTime: string, endTime: string) {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  return now >= start && now <= end
}

function isFinished(endTime: string) {
  const now = new Date()
  const end = new Date(endTime)
  return now > end
}

function getTimeSinceStart(startTime: string) {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = now.getTime() - start.getTime()

  if (diffMs <= 0) return null

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours > 0) return `depuis ${diffHours}h ${diffMinutes % 60}min`
  return `depuis ${diffMinutes}min`
}

function getTimeUntilStart(startTime: string) {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()

  if (diffMs <= 0) return null

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `dans ${diffDays}j ${diffHours % 24}h`
  if (diffHours > 0) return `dans ${diffHours}h ${diffMinutes % 60}min`
  return `dans ${diffMinutes}min`
}

function CinemaSessionsCarousel({ sessions }: { sessions: CinemaSession[] }) {
  const [currentPage, setCurrentPage] = useState(0)
  const sessionsPerPage = 4
  const totalPages = Math.ceil(sessions.length / sessionsPerPage)

  const currentSessions = sessions.slice(currentPage * sessionsPerPage, (currentPage + 1) * sessionsPerPage)

  return (
    <div className="space-y-3">
      {/* Sessions Grid - 4 per row in 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {currentSessions.map((session) => {
          const isPlaying = isCurrentlyPlaying(session.schedule_start, session.schedule_end)
          const finished = isFinished(session.schedule_end)
          const timeElapsed = isPlaying ? getTimeSinceStart(session.schedule_start) : null
          const timeUntil = !isPlaying && !finished ? getTimeUntilStart(session.schedule_start) : null

          return (
            <div
              key={session.id}
              className={`bg-black/40 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/50 transition-colors ${finished ? "opacity-50" : ""}`}
            >
              <div className="flex gap-3">
                {session.movie_poster && (
                  <div className="relative w-12 h-18 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={session.movie_poster || "/placeholder.svg"}
                      alt={session.movie_title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm line-clamp-1">{session.movie_title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {session.interactive_cinema_rooms?.name || `Salle ${session.interactive_cinema_rooms?.room_number}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-300">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.schedule_start)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.schedule_start)}
                  </div>
                  <div className="mt-2">
                    {finished ? (
                      <Badge className="bg-gray-600 text-white text-xs border-0">TERMINÉ</Badge>
                    ) : isPlaying ? (
                      <Badge className="bg-red-600 text-white text-xs border-0 animate-pulse">
                        EN COURS {timeElapsed && `· ${timeElapsed}`}
                      </Badge>
                    ) : timeUntil ? (
                      <Badge className="bg-blue-600 text-white text-xs border-0">À VENIR · {timeUntil}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Carousel Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentPage ? "w-6 bg-purple-400" : "w-1.5 bg-gray-600"
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function InteractiveWorldPromo({
  cinemaSessions,
  stadium,
}: {
  cinemaSessions: CinemaSession[]
  stadium: StadiumData
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="w-full bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-gray-900 border-purple-500/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Monde Interactif
              </h2>
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              Découvrez un univers 3D immersif avec cinémas, stade de foot, discothèque et arcade !
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cinema Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Séances de Cinéma</h3>
              </div>

              {cinemaSessions.length > 0 ? (
                <CinemaSessionsCarousel sessions={cinemaSessions} />
              ) : (
                <div className="bg-black/40 rounded-lg p-4 border border-purple-500/20 text-center">
                  <p className="text-gray-400 text-sm">Aucune séance programmée pour le moment</p>
                </div>
              )}
            </div>

            {/* Stadium Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Stadium className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Stade de Football</h3>
              </div>

              {stadium ? (
                <div className="bg-black/40 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/50 transition-colors space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-white">{stadium.match_title || "Match en direct"}</h4>
                    {isCurrentlyPlaying(stadium.schedule_start, stadium.schedule_end) && (
                      <Badge className="bg-green-600 text-white text-xs border-0 animate-pulse">EN DIRECT</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(stadium.schedule_start)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(stadium.schedule_start)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Regardez le match en direct avec d'autres fans dans notre stade virtuel 3D !
                  </p>
                </div>
              ) : (
                <div className="bg-black/40 rounded-lg p-4 border border-blue-500/20 space-y-3">
                  <p className="text-gray-400 text-sm text-center">Aucun match programmé pour le moment</p>
                  <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded p-3 border border-blue-500/30">
                    <p className="text-sm text-gray-300 text-center">
                      <span className="font-semibold text-blue-400">bEiN Sport</span> est en{" "}
                      <span className="font-bold text-green-400">LIVE 24/24</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Features */}
              <div className="bg-gradient-to-br from-cyan-600/20 to-purple-600/20 rounded-lg p-4 border border-cyan-500/20">
                <h4 className="font-semibold text-white mb-3 text-sm">Aussi disponible :</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span>Discothèque avec musique en direct</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span>Arcade avec jeux rétro</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <span>Place publique avec décors thématique</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>Chat vocal par salle pour échanger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                <Film className="w-4 h-4" />
                <span className="text-2xl font-bold">{cinemaSessions.length}</span>
              </div>
              <p className="text-xs text-gray-400">Séances à venir</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-2xl font-bold">∞</span>
              </div>
              <p className="text-xs text-gray-400">Joueurs en ligne</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-2xl font-bold">4</span>
              </div>
              <p className="text-xs text-gray-400">Lieux à explorer</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-2">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/50"
            >
              <Link href="/interactive">
                <Users className="w-4 h-4 mr-2" />
                Entrer dans le Monde Interactif
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
