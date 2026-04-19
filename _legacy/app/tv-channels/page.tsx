"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Search, Heart, ThumbsUp, ThumbsDown } from "lucide-react"
import { IframeModal } from "@/components/iframe-modal"
import { WatchTracker } from "@/lib/watch-tracking"
import { useToast } from "@/hooks/use-toast"
import { useTVChannels } from "@/hooks/use-tv-channels"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"

interface TVChannel {
  id: number
  name: string
  category: string
  country: string
  language: string
  logo_url: string
  stream_url: string
  description?: string
  quality?: string
  is_active?: boolean
  trailer_url?: string
}

export default function TVChannelsPage() {
  const { channels, isLoading, error } = useTVChannels()
  const [filteredChannels, setFilteredChannels] = useState<TVChannel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [userRatings, setUserRatings] = useState<Record<number, "like" | "dislike" | null>>({})
  const { toast } = useToast()

  // Simuler les votes totaux basés sur l'ID
  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    if (!id || typeof id !== "number" || isNaN(id)) return 0
    const seed = id * (type === "like" ? 13 : 17)
    const result = Math.floor((seed % 800) + 100)
    return isNaN(result) ? 0 : result
  }

  const categories = ["all", ...Array.from(new Set(channels.map((channel) => channel.category).filter(Boolean)))]

  useEffect(() => {
    // Charger les favoris et ratings
    const favoriteItems = WatchTracker.getFavoriteItems()
    const tvChannelFavorites = favoriteItems.filter((item) => item.type === "tv-channel").map((item) => item.tmdbId)
    setFavorites(tvChannelFavorites)

    // Charger les ratings
    const ratings: Record<number, "like" | "dislike" | null> = {}
    channels.forEach((channel) => {
      ratings[channel.id] = WatchTracker.getRating("tv-channel", channel.id)
    })
    setUserRatings(ratings)
  }, [channels])

  useEffect(() => {
    let filtered = channels

    if (searchQuery) {
      filtered = filtered.filter(
        (channel) =>
          (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (channel.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((channel) => channel.category && channel.category === selectedCategory)
    }

    setFilteredChannels(filtered)
  }, [searchQuery, selectedCategory, channels])

  const handleWatch = (channel: TVChannel) => {
    setSelectedChannel(channel)
    setIsModalOpen(true)
  }

  const toggleFavorite = (channel: TVChannel) => {
    const isCurrentlyFavorite = WatchTracker.isFavorite("tv-channel", channel.id)
    WatchTracker.toggleFavorite("tv-channel", channel.id, channel.name, {
      logoUrl: channel.logo_url,
      streamUrl: channel.stream_url,
    })

    // Mettre à jour l'état local
    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((id) => id !== channel.id))
    } else {
      setFavorites((prev) => [...prev, channel.id])
    }
  }

  const handleLike = (channel: TVChannel) => {
    const newRating = WatchTracker.toggleLike("tv-channel", channel.id, channel.name, {
      logoUrl: channel.logo_url,
    })
    setUserRatings((prev) => ({ ...prev, [channel.id]: newRating }))
    toast({
      title: newRating ? "Chaîne likée !" : "Like retiré",
      description: newRating ? `Vous avez liké ${channel.name}` : `Like retiré de ${channel.name}`,
    })
  }

  const handleDislike = (channel: TVChannel) => {
    const newRating = WatchTracker.toggleDislike("tv-channel", channel.id, channel.name, {
      logoUrl: channel.logo_url,
    })
    setUserRatings((prev) => ({ ...prev, [channel.id]: newRating }))
    toast({
      title: newRating ? "Chaîne dislikée" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${channel.name}` : `Dislike retiré de ${channel.name}`,
    })
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    target.style.display = "none"
    const parent = target.parentElement
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zM4 5v10h12V5H4z"/>
            <path d="M6 7h8v2H6V7zM6 11h8v2H6v-2z"/>
          </svg>
        </div>
      `
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-300">Chargement des chaînes TV...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Chaînes TV en Direct</h1>
          <p className="text-xl text-gray-400">Regardez vos chaînes préférées en streaming direct</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une chaîne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">
                Toutes les catégories
              </SelectItem>
              {categories.slice(1).map((category) => (
                <SelectItem key={category} value={category} className="text-white">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grille des chaînes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChannels.map((channel) => {
            const isFavorite = favorites.includes(channel.id)
            const userRating = userRatings[channel.id]
            const totalLikes = getTotalVotes(channel.id, "like")
            const totalDislikes = getTotalVotes(channel.id, "dislike")

            return (
              <Card
                key={channel.id}
                className="group hover:shadow-lg transition-all duration-300 bg-gray-800 border-gray-700"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center border shadow-sm">
                        <img
                          src={channel.logo_url || "/placeholder.svg?height=48&width=48"}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/tv-channel-logo.jpg"
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{channel.name}</CardTitle>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            channel.category === "Sport"
                              ? "bg-green-900/50 text-green-300 border-green-700"
                              : channel.category === "Premium"
                                ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                                : channel.category === "Généraliste"
                                  ? "bg-blue-900/50 text-blue-300 border-blue-700"
                                  : channel.category === "Jeunesse"
                                    ? "bg-pink-900/50 text-pink-300 border-pink-700"
                                    : channel.category === "Documentaire"
                                      ? "bg-orange-900/50 text-orange-300 border-orange-700"
                                      : channel.category === "Gaming"
                                        ? "bg-purple-900/50 text-purple-300 border-purple-700"
                                        : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {channel.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(channel)}
                      className={`${isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2 text-gray-400">
                    {channel.description || "Aucune description disponible"}
                  </CardDescription>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{channel.country || "Non spécifié"}</span>
                    <div className="flex items-center gap-2">
                      {channel.quality && (
                        <Badge variant="outline" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                          {channel.quality}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-red-900/50 text-red-300 border-red-700">
                        LIVE
                      </Badge>
                    </div>
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
                      onClick={() => handleLike(channel)}
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
                      onClick={() => handleDislike(channel)}
                    >
                      <ThumbsDown className={`w-4 h-4 ${userRating === "dislike" ? "fill-current" : ""}`} />
                    </Button>
                    <span className="text-red-500 text-sm font-medium">
                      {Math.max(0, totalDislikes + (userRating === "dislike" ? 1 : 0)) || 0}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleWatch(channel)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Regarder
                    </Button>
                    <AddToPlaylistButtonGeneric
                      itemId={channel.id}
                      mediaType="tv-channel"
                      title={channel.name}
                      posterPath={channel.logo_url}
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredChannels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucune chaîne trouvée pour votre recherche.</p>
          </div>
        )}

        {/* Modal de lecture */}
        <IframeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedChannel?.name || ""}
          src={selectedChannel?.stream_url || ""}
        />
      </div>
    </div>
  )
}
