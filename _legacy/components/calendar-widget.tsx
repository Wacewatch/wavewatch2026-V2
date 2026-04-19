"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star, Film, Tv, ChevronDown, ChevronUp } from "lucide-react"
import { getUpcomingMovies, getUpcomingTVShows } from "@/lib/tmdb"
import Link from "next/link"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"

interface CalendarEvent {
  id: number
  title: string
  type: "movie" | "tv"
  date: string
  poster_path?: string
  vote_average?: number
  overview?: string
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    if (isMobile !== undefined) {
      setIsExpanded(false)
    }
  }, [isMobile])

  useEffect(() => {
    const fetchUpcomingContent = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching upcoming content for calendar...")

        const fetchWithRetry = async (fetchFn: Function, page: number, retries = 2): Promise<any> => {
          for (let i = 0; i <= retries; i++) {
            try {
              const result = await fetchFn(page)
              return result
            } catch (error) {
              console.warn(`[v0] Retry ${i + 1} failed for page ${page}:`, error)
              if (i === retries) throw error
              await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
            }
          }
        }

        // Récupérer plus de pages pour avoir plus de contenu
        const moviePromises = []
        const tvPromises = []

        for (let page = 1; page <= 5; page++) {
          moviePromises.push(fetchWithRetry(getUpcomingMovies, page))
          tvPromises.push(fetchWithRetry(getUpcomingTVShows, page))
        }

        const [movieResponses, tvResponses] = await Promise.allSettled([
          Promise.allSettled(moviePromises),
          Promise.allSettled(tvPromises),
        ])

        // Extract successful responses
        const allMovies: any[] = []
        const allTVShows: any[] = []

        if (movieResponses.status === "fulfilled") {
          movieResponses.value.forEach((result) => {
            if (result.status === "fulfilled" && result.value?.results) {
              allMovies.push(...result.value.results)
            }
          })
        }

        if (tvResponses.status === "fulfilled") {
          tvResponses.value.forEach((result) => {
            if (result.status === "fulfilled" && result.value?.results) {
              allTVShows.push(...result.value.results)
            }
          })
        }

        console.log("[v0] Fetched movies:", allMovies.length, "TV shows:", allTVShows.length)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const movieEvents: CalendarEvent[] = allMovies
          .filter((movie: any) => {
            if (!movie.release_date) return false
            const releaseDate = new Date(movie.release_date)
            return releaseDate >= today && movie.title && movie.id
          })
          .map((movie: any) => ({
            id: movie.id,
            title: movie.title,
            type: "movie" as const,
            date: movie.release_date,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            overview: movie.overview,
          }))

        const tvEvents: CalendarEvent[] = allTVShows
          .filter((show: any) => {
            if (!show.first_air_date) return false
            const airDate = new Date(show.first_air_date)
            return airDate >= today && show.name && show.id
          })
          .map((show: any) => ({
            id: show.id,
            title: show.name,
            type: "tv" as const,
            date: show.first_air_date,
            poster_path: show.poster_path,
            vote_average: show.vote_average,
            overview: show.overview,
          }))

        const allEvents = [...movieEvents, ...tvEvents]
          // Remove duplicates based on id and type
          .filter((event, index, self) => index === self.findIndex((e) => e.id === event.id && e.type === event.type))
          // Sort by date, then by rating
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            if (dateA !== dateB) return dateA - dateB
            return (b.vote_average || 0) - (a.vote_average || 0)
          })
          .slice(0, 20) // Show more events

        console.log("[v0] Final calendar events:", allEvents.length)
        setEvents(allEvents)
      } catch (err) {
        console.error("[v0] Error loading calendar data:", err)
        setError("Impossible de charger les prochaines sorties")
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingContent()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)

    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Demain"
    if (diffDays < 7) return `Dans ${diffDays} jours`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? "Dans 1 semaine" : `Dans ${weeks} semaines`
    }

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: diffDays > 365 ? "numeric" : undefined,
    })
  }

  const getEventLink = (event: CalendarEvent) => {
    return event.type === "movie" ? `/movies/${event.id}` : `/tv-shows/${event.id}`
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-950 to-purple-900 border-blue-700">
        <CardHeader>
          <div
            className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
            onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">Prochaines sorties</CardTitle>
              </div>
              <CardDescription className="text-blue-300">Chargement des prochaines sorties...</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
              className={`absolute right-0 text-gray-400 hover:text-white hover:bg-blue-800 ${isMobile ? "hidden" : ""}`}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/30">
                  <div className="w-12 h-16 bg-blue-800 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-blue-800 rounded animate-pulse" />
                    <div className="h-3 bg-blue-800 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-blue-950 to-purple-900 border-blue-700">
        <CardHeader>
          <div
            className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
            onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">Prochaines sorties</CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
              className={`absolute right-0 text-gray-400 hover:text-white hover:bg-blue-800 ${isMobile ? "hidden" : ""}`}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <p className="text-red-300 text-center py-4">{error}</p>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-950 to-purple-900 border-blue-700">
      <CardHeader>
        <div
          className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
          onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Prochaines sorties</CardTitle>
            </div>
            <CardDescription className="text-blue-300">Films et séries à venir selon TMDB</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
            className={`absolute right-0 text-gray-400 hover:text-white hover:bg-blue-800 ${isMobile ? "hidden" : ""}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <p className="text-blue-300 text-center py-4">Aucune sortie prévue prochainement</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={`${event.type}-${event.id}`} href={getEventLink(event)} className="block group">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/30 hover:bg-blue-800/50 transition-colors border border-blue-700/50 hover:border-blue-600">
                    <div className="relative w-12 h-16 flex-shrink-0">
                      <Image
                        src={
                          event.poster_path
                            ? `https://image.tmdb.org/t/p/w200${event.poster_path}`
                            : "/placeholder.svg?height=64&width=48"
                        }
                        alt={event.title}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                          {event.title}
                        </h4>
                        {event.type === "movie" ? (
                          <Film className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Tv className="w-4 h-4 text-green-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-blue-300">
                        <Badge variant="outline" className="border-blue-600 text-blue-300">
                          {event.type === "movie" ? "Film" : "Série"}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.date)}
                        </div>

                        {event.vote_average && event.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {event.vote_average.toFixed(1)}
                          </div>
                        )}
                      </div>

                      {event.overview && (
                        <p className="text-xs text-blue-200 mt-1 line-clamp-2">
                          {event.overview.length > 100 ? `${event.overview.substring(0, 100)}...` : event.overview}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bouton pour voir plus */}
          <div className="pt-4 border-t border-blue-700">
            <Button
              asChild
              variant="outline"
              className="w-full border-blue-600 text-white hover:bg-blue-800 bg-transparent"
            >
              <Link href="/calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Voir le calendrier complet
              </Link>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
