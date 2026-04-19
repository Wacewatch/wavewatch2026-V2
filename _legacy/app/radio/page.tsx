"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Search, Heart, Radio, ThumbsUp, ThumbsDown } from "lucide-react"
import { WatchTracker } from "@/lib/watch-tracking"
import { useToast } from "@/hooks/use-toast"
import { useRadioStations } from "@/hooks/use-radio-stations"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"

interface RadioStation {
  id: number
  name: string
  genre: string
  country: string
  frequency?: string
  logo_url: string
  stream_url: string
  description?: string
  website?: string
  is_active?: boolean
}

export default function RadioPage() {
  const { stations, isLoading, error } = useRadioStations()
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [userRatings, setUserRatings] = useState<Record<number, "like" | "dislike" | null>>({})
  const { toast } = useToast()

  // Simuler les votes totaux basés sur l'ID
  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    if (!id || typeof id !== "number" || isNaN(id)) return 0
    const seed = id * (type === "like" ? 19 : 23)
    const result = Math.floor((seed % 600) + 80)
    return isNaN(result) ? 0 : result
  }

  const categories = ["all", ...Array.from(new Set(stations.map((station) => station.genre).filter(Boolean)))]

  useEffect(() => {
    // Charger les favoris et ratings
    const favoriteItems = WatchTracker.getFavoriteItems()
    const radioFavorites = favoriteItems.filter((item) => item.type === "radio").map((item) => item.tmdbId)
    setFavorites(radioFavorites)

    // Charger les ratings
    const ratings: Record<number, "like" | "dislike" | null> = {}
    stations.forEach((station) => {
      ratings[station.id] = WatchTracker.getRating("radio", station.id)
    })
    setUserRatings(ratings)
  }, [stations])

  useEffect(() => {
    let filtered = stations

    if (searchQuery) {
      filtered = filtered.filter(
        (station) =>
          (station.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (station.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((station) => station.genre && station.genre === selectedCategory)
    }

    setFilteredStations(filtered)
  }, [searchQuery, selectedCategory, stations])

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audio])

  const handlePlay = (station: RadioStation) => {
    if (!station.stream_url || station.stream_url.trim() === "") {
      toast({
        title: "Erreur",
        description: "URL de stream non disponible pour cette station",
        variant: "destructive",
      })
      return
    }

    if (audio) {
      audio.pause()
    }

    if (currentStation?.id === station.id && isPlaying) {
      setIsPlaying(false)
      setCurrentStation(null)
      return
    }

    const newAudio = new Audio(station.stream_url)
    newAudio.crossOrigin = "anonymous"

    newAudio.addEventListener("loadstart", () => {
      console.log("Chargement de la radio...")
    })

    newAudio.addEventListener("canplay", () => {
      newAudio
        .play()
        .then(() => {
          setIsPlaying(true)
          setCurrentStation(station)
        })
        .catch((error) => {
          console.error("Erreur de lecture:", error)
          alert("Impossible de lire cette station radio. Veuillez réessayer.")
        })
    })

    newAudio.addEventListener("error", (e) => {
      console.error("Erreur audio:", e)
      alert("Erreur lors du chargement de la station radio.")
    })

    setAudio(newAudio)
  }

  const toggleFavorite = (station: RadioStation) => {
    const isCurrentlyFavorite = WatchTracker.isFavorite("radio", station.id)
    WatchTracker.toggleFavorite("radio", station.id, station.name, {
      logoUrl: station.logo_url,
      streamUrl: station.stream_url,
    })

    // Mettre à jour l'état local
    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((id) => id !== station.id))
    } else {
      setFavorites((prev) => [...prev, station.id])
    }
  }

  const handleLike = (station: RadioStation) => {
    const newRating = WatchTracker.toggleLike("radio", station.id, station.name, {
      logoUrl: station.logo_url,
    })
    setUserRatings((prev) => ({ ...prev, [station.id]: newRating }))
    toast({
      title: newRating ? "Station likée !" : "Like retiré",
      description: newRating ? `Vous avez liké ${station.name}` : `Like retiré de ${station.name}`,
    })
  }

  const handleDislike = (station: RadioStation) => {
    const newRating = WatchTracker.toggleDislike("radio", station.id, station.name, {
      logoUrl: station.logo_url,
    })
    setUserRatings((prev) => ({ ...prev, [station.id]: newRating }))
    toast({
      title: newRating ? "Station dislikée" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${station.name}` : `Dislike retiré de ${station.name}`,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-300">Chargement des stations radio...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Radio FM en Direct</h1>
          <p className="text-xl text-gray-400">Écoutez vos stations de radio préférées en streaming</p>
        </div>

        {/* Station en cours */}
        {currentStation && isPlaying && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md">
                  <img
                    src={currentStation.logo_url || "/placeholder.svg"}
                    alt={currentStation.name}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentStation.name}</h3>
                  <p className="text-sm text-blue-300">En cours de lecture...</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-blue-500 animate-pulse"></div>
                  <div className="w-1 h-6 bg-blue-500 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1 h-3 bg-blue-500 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1 h-5 bg-blue-500 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlay(currentStation)}
                  className="border-blue-600 text-blue-300 hover:bg-blue-800"
                >
                  Arrêter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">
                Tous les genres
              </SelectItem>
              {categories.slice(1).map((category) => (
                <SelectItem key={category} value={category} className="text-white">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grille des stations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStations.map((station) => {
            const isFavorite = favorites.includes(station.id)
            const isCurrentlyPlaying = currentStation?.id === station.id && isPlaying
            const userRating = userRatings[station.id]
            const totalLikes = getTotalVotes(station.id, "like")
            const totalDislikes = getTotalVotes(station.id, "dislike")

            return (
              <Card
                key={station.id}
                className={`group hover:shadow-lg transition-all duration-300 bg-gray-800 border-gray-700 ${isCurrentlyPlaying ? "ring-2 ring-blue-500" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                        <img
                          src={station.logo_url || "/placeholder.svg?height=48&width=48"}
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/radio-station-logo.jpg"
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{station.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                            {station.genre}
                          </Badge>
                          {station.frequency && (
                            <Badge variant="outline" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                              {station.frequency}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(station)}
                      className={`${isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2 text-gray-400">
                    {station.description || "Station de radio"}
                  </CardDescription>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{station.country || "Non spécifié"}</span>
                    {isCurrentlyPlaying && (
                      <div className="flex items-center text-blue-400">
                        <Radio className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">En cours</span>
                      </div>
                    )}
                  </div>

                  {/* Votes compacts */}
                  <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-auto ${
                        userRating === "like"
                          ? "text-green-500 hover:text-green-400"
                          : "text-gray-400 hover:text-green-500"
                      }`}
                      onClick={() => handleLike(station)}
                    >
                      <ThumbsUp className={`w-4 h-4 ${userRating === "like" ? "fill-current" : ""}`} />
                    </Button>
                    <span className="text-green-500 text-sm font-medium">
                      {Math.max(0, totalLikes + (userRating === "like" ? 1 : 0)) || 0}
                    </span>
                    <div className="w-px h-4 bg-gray-600 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-auto ${
                        userRating === "dislike"
                          ? "text-red-500 hover:text-red-400"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                      onClick={() => handleDislike(station)}
                    >
                      <ThumbsDown className={`w-4 h-4 ${userRating === "dislike" ? "fill-current" : ""}`} />
                    </Button>
                    <span className="text-red-500 text-sm font-medium">
                      {Math.max(0, totalDislikes + (userRating === "dislike" ? 1 : 0)) || 0}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePlay(station)}
                      className={`flex-1 ${isCurrentlyPlaying ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"} font-medium`}
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isCurrentlyPlaying ? "Arrêter" : "Écouter"}
                    </Button>
                    <AddToPlaylistButtonGeneric
                      itemId={station.id}
                      mediaType="radio"
                      title={station.name}
                      posterPath={station.logo_url}
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                    />
                    {station.website && station.website.trim() !== "" && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                      >
                        <a href={station.website} target="_blank" rel="noopener noreferrer">
                          Site
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredStations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucune station trouvée pour votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  )
}
