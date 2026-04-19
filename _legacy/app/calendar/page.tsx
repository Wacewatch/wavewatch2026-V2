"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Film, Tv, Star, Play, RefreshCw } from "lucide-react"
import { WatchTracker } from "@/lib/watch-tracking"
import Image from "next/image"
import Link from "next/link"

interface CalendarEvent {
  id: number
  title: string
  date: string
  type: "movie" | "tv" | "episode"
  poster_path?: string
  season_number?: number
  episode_number?: number
  show_id?: number
  show_name?: string
  isFavorite?: boolean
  episode_name?: string
  overview?: string
  vote_average?: number
  genre_ids?: number[]
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favoriteShows, setFavoriteShows] = useState<number[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    // Récupérer les séries favorites
    const favorites = WatchTracker.getFavoriteItems()
    const tvFavorites = favorites.filter((item) => item.type === "tv").map((item) => item.tmdbId)
    setFavoriteShows(tvFavorites)
  }, [])

  useEffect(() => {
    fetchUpcomingContent()
  }, [favoriteShows, showOnlyFavorites])

  const fetchUpcomingContent = async (forceRefresh = false) => {
    setLoading(true)
    try {
      // Utiliser la nouvelle API qui utilise le cache
      const response = await fetch(`/api/content/calendar?cache=${!forceRefresh}`)
      if (!response.ok) throw new Error("Failed to fetch calendar data")

      const { upcomingMovies, upcomingTVShows } = await response.json()

      const movieEvents: CalendarEvent[] = upcomingMovies.results
        .filter((movie: any) => new Date(movie.release_date) >= new Date())
        .map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          date: movie.release_date,
          type: "movie" as const,
          poster_path: movie.poster_path,
          overview: movie.overview,
          vote_average: movie.vote_average,
          genre_ids: movie.genre_ids,
        }))

      const tvEvents: CalendarEvent[] = upcomingTVShows.results
        .filter((show: any) => new Date(show.first_air_date) >= new Date())
        .map((show: any) => ({
          id: show.id,
          title: show.name,
          date: show.first_air_date,
          type: "tv" as const,
          poster_path: show.poster_path,
          isFavorite: favoriteShows.includes(show.id),
          overview: show.overview,
          vote_average: show.vote_average,
          genre_ids: show.genre_ids,
        }))

      // Générer plus d'épisodes fictifs pour les séries populaires
      const episodeEvents: CalendarEvent[] = []
      const popularShows = upcomingTVShows.results.slice(0, 20) // Plus de séries

      for (const show of popularShows) {
        const isFavorite = favoriteShows.includes(show.id)

        // Générer 5-10 épisodes futurs pour chaque série
        const episodeCount = Math.floor(Math.random() * 6) + 5
        for (let i = 1; i <= episodeCount; i++) {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) + i * 3) // Étaler sur 2 mois

          episodeEvents.push({
            id: show.id * 1000 + i,
            title: `${show.name}`,
            episode_name: `Épisode ${i}`,
            date: futureDate.toISOString().split("T")[0],
            type: "episode" as const,
            poster_path: show.poster_path,
            season_number: Math.floor(Math.random() * 3) + 1,
            episode_number: i,
            show_id: show.id,
            show_name: show.name,
            isFavorite,
            overview: `Épisode ${i} de ${show.name}. ${show.overview?.substring(0, 100)}...`,
            vote_average: show.vote_average,
          })
        }
      }

      let allEvents = [...movieEvents, ...tvEvents, ...episodeEvents]

      // Filtrer par favoris si activé
      if (showOnlyFavorites) {
        allEvents = allEvents.filter(
          (event) =>
            event.type === "movie" ||
            (event.type === "tv" && event.isFavorite) ||
            (event.type === "episode" && event.isFavorite),
        )
      }

      // Trier par date
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setEvents(allEvents)
    } catch (error) {
      console.error("Error fetching upcoming content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchUpcomingContent(true) // Force refresh
    } catch (error) {
      console.error("Error refreshing calendar:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const getEventLink = (event: CalendarEvent) => {
    if (event.type === "movie") return `/movies/${event.id}`
    if (event.type === "tv") return `/tv-shows/${event.id}`
    return `/tv-shows/${event.show_id}/season/${event.season_number}/episode/${event.episode_number}`
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.filter((event) => event.date === dateStr)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const today = new Date()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <Calendar className="h-10 w-10 text-blue-400" />
              Calendrier des sorties
            </h1>
            <p className="text-lg text-gray-400">Films, séries et épisodes à venir</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 shadow-lg">
              <Switch id="favorites-only" checked={showOnlyFavorites} onCheckedChange={setShowOnlyFavorites} />
              <Label htmlFor="favorites-only" className="font-medium text-gray-300">
                Favoris uniquement
              </Label>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualisation..." : "Actualiser"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendrier */}
          <Card className="lg:col-span-2 bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-sm text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Jours vides du début du mois */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2 h-20"></div>
                ))}

                {/* Jours du mois */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const dayEvents = getEventsForDate(date)
                  const isToday = date.toDateString() === today.toDateString()

                  return (
                    <div
                      key={day}
                      className={`p-1 h-20 border rounded-lg transition-colors ${
                        isToday
                          ? "bg-blue-900/30 border-blue-500"
                          : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-400" : "text-gray-300"}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <button
                            key={`${event.type}-${event.id}`}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`w-full text-xs p-1 rounded truncate text-left hover:opacity-80 transition-opacity ${
                              event.type === "movie"
                                ? "bg-red-900/50 text-red-200 hover:bg-red-900/70"
                                : event.type === "tv"
                                  ? "bg-blue-900/50 text-blue-200 hover:bg-blue-900/70"
                                  : "bg-green-900/50 text-green-200 hover:bg-green-900/70"
                            }`}
                            title={event.episode_name ? `${event.title} - ${event.episode_name}` : event.title}
                          >
                            {event.type === "movie" ? (
                              <Film className="w-3 h-3 inline mr-1" />
                            ) : event.type === "tv" ? (
                              <Tv className="w-3 h-3 inline mr-1" />
                            ) : (
                              <Play className="w-3 h-3 inline mr-1" />
                            )}
                            {event.title.length > 8 ? `${event.title.substring(0, 8)}...` : event.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Liste des événements à venir */}
          <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="font-bold">Prochaines sorties</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-12 h-16 bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {events.slice(0, 50).map((event) => (
                    <button
                      key={`${event.type}-${event.id}`}
                      onClick={(e) => handleEventClick(event, e)}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors group text-left"
                    >
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
                          {event.type === "movie" ? (
                            <Film className="w-4 h-4 text-red-400" />
                          ) : event.type === "tv" ? (
                            <Tv className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Play className="w-4 h-4 text-green-400" />
                          )}
                          {event.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition-colors text-white">
                          {event.episode_name ? `${event.title} - ${event.episode_name}` : event.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {new Date(event.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de détails */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    {selectedEvent.type === "movie" ? (
                      <Film className="w-5 h-5 text-red-400" />
                    ) : selectedEvent.type === "tv" ? (
                      <Tv className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Play className="w-5 h-5 text-green-400" />
                    )}
                    {selectedEvent.episode_name
                      ? `${selectedEvent.title} - ${selectedEvent.episode_name}`
                      : selectedEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={
                        selectedEvent.poster_path
                          ? `https://image.tmdb.org/t/p/w500${selectedEvent.poster_path}`
                          : "/placeholder.svg?height=450&width=300"
                      }
                      alt={selectedEvent.title}
                      fill
                      className="object-cover rounded-lg"
                      sizes="300px"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {new Date(selectedEvent.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Badge>
                      {selectedEvent.vote_average && selectedEvent.vote_average > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-300">
                            {selectedEvent.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {selectedEvent.isFavorite && (
                        <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400 border-yellow-700">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Favori
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedEvent.overview || "Aucune description disponible."}
                    </p>
                    <div className="flex gap-2">
                      <Link href={getEventLink(selectedEvent)} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Play className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Légende */}
        <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-red-700 border border-red-400 rounded shadow-sm"></div>
                <span className="font-medium text-red-400">Films</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400 rounded shadow-sm"></div>
                <span className="font-medium text-blue-400">Séries TV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-green-700 border border-green-400 rounded shadow-sm"></div>
                <span className="font-medium text-green-400">Épisodes</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current drop-shadow-sm" />
                <span className="font-medium text-yellow-400">Favori</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
