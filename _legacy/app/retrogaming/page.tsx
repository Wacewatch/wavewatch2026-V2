"use client"

import { useState, useEffect } from "react"
import { WatchTracker } from "@/lib/watch-tracking"
import { useToast } from "@/hooks/use-toast"
import { IframeModal } from "@/components/iframe-modal"
import { useRetrogamingSources } from "@/hooks/use-retrogaming-sources"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RetrogamingSource {
  id: number
  name: string
  description: string
  url: string
  color: string
  category: string
  is_active?: boolean
}

export default function RetrogamingPage() {
  const { sources: gamingSources, isLoading, error } = useRetrogamingSources()
  const [selectedSource, setSelectedSource] = useState<RetrogamingSource | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [userRatings, setUserRatings] = useState<Record<number, "like" | "dislike" | null>>({})
  const { toast } = useToast()
  const [showIframe, setShowIframe] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [filteredSources, setFilteredSources] = useState<RetrogamingSource[]>([])

  const categories = ["all", ...Array.from(new Set(gamingSources.map((source) => source.category).filter(Boolean)))]

  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    if (!id || typeof id !== "number") return 0
    const seed = id * (type === "like" ? 29 : 31)
    const result = Math.floor((seed % 400) + 50)
    return isNaN(result) ? 0 : result
  }

  useEffect(() => {
    const favoriteItems = WatchTracker.getFavoriteItems()
    const gameFavorites = favoriteItems.filter((item) => item.type === "game").map((item) => item.tmdbId)
    setFavorites(gameFavorites)

    const ratings: Record<number, "like" | "dislike" | null> = {}
    gamingSources.forEach((source) => {
      ratings[source.id] = WatchTracker.getRating("game", source.id)
    })
    setUserRatings(ratings)
  }, [gamingSources])

  useEffect(() => {
    let filtered = gamingSources

    if (searchQuery) {
      filtered = filtered.filter(
        (source) =>
          (source.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (source.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((source) => source.category && source.category === selectedCategory)
    }

    setFilteredSources(filtered)
  }, [searchQuery, selectedCategory, gamingSources])

  // Domaines qui nécessitent le proxy pour contourner le referer check
  const domainsNeedingProxy = ["retrogames.onl", "www.retrogames.onl"]

  const getProxiedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const needsProxy = domainsNeedingProxy.some(
        (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )
      if (needsProxy) {
        return `/api/proxy/game?url=${encodeURIComponent(url)}`
      }
      return url
    } catch {
      return url
    }
  }

  const handlePlayGame = (source: RetrogamingSource) => {
    setSelectedSource({
      ...source,
      url: getProxiedUrl(source.url),
    })
    setShowIframe(true)
  }

  const toggleFavorite = (source: RetrogamingSource) => {
    const isCurrentlyFavorite = WatchTracker.isFavorite("game", source.id)
    WatchTracker.toggleFavorite("game", source.id, source.name, {
      logoUrl: source.url,
      url: source.url,
    })

    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((id) => id !== source.id))
    } else {
      setFavorites((prev) => [...prev, source.id])
    }

    toast({
      title: isCurrentlyFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: `${source.name} a été ${isCurrentlyFavorite ? "retiré de" : "ajouté à"} vos favoris.`,
    })
  }

  const handleLike = (source: RetrogamingSource) => {
    const newRating = WatchTracker.toggleLike("game", source.id, source.name, {
      logoUrl: source.url,
    })
    setUserRatings((prev) => ({ ...prev, [source.id]: newRating }))
    toast({
      title: newRating ? "Jeu liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${source.name}` : `Like retiré de ${source.name}`,
    })
  }

  const handleDislike = (source: RetrogamingSource) => {
    const newRating = WatchTracker.toggleDislike("game", source.id, source.name, {
      logoUrl: source.url,
    })
    setUserRatings((prev) => ({ ...prev, [source.id]: newRating }))
    toast({
      title: newRating ? "Jeu disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${source.name}` : `Dislike retiré de ${source.name}`,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-300">Chargement des jeux rétro...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <span className="text-blue-400">🎮</span>
            Retrogaming
          </h1>
          <p className="text-gray-400">Redécouvrez les jeux classiques directement dans votre navigateur</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un jeu..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => {
            const isFavorite = favorites.includes(source.id)
            const userRating = userRatings[source.id]
            const totalLikes = getTotalVotes(source.id, "like")
            const totalDislikes = getTotalVotes(source.id, "dislike")

            return (
              <div
                key={source.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-700 bg-gray-800 rounded-lg"
              >
                <div className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-20 h-20 ${source.color} rounded-2xl flex items-center justify-center`}>
                        <span className="text-3xl">🎮</span>
                      </div>
                      <button
                        onClick={() => toggleFavorite(source)}
                        className={`p-2 rounded-full ${isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}`}
                      >
                        <span className={`text-xl ${isFavorite ? "❤️" : "🤍"}`}>{isFavorite ? "❤️" : "🤍"}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{source.name}</h3>
                      <p className="text-gray-400 text-sm mb-3">{source.description}</p>
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                          {source.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2 mb-4">
                      <button
                        className={`p-1 h-auto ${
                          userRating === "like"
                            ? "text-green-500 hover:text-green-400"
                            : "text-gray-400 hover:text-green-500"
                        }`}
                        onClick={() => handleLike(source)}
                      >
                        <span className="text-sm">👍</span>
                      </button>
                      <span className="text-green-500 text-sm font-medium">
                        {Math.max(0, totalLikes + (userRating === "like" ? 1 : 0)) || 0}
                      </span>
                      <div className="w-px h-4 bg-gray-600 mx-1" />
                      <button
                        className={`p-1 h-auto ${
                          userRating === "dislike"
                            ? "text-red-500 hover:text-red-400"
                            : "text-gray-400 hover:text-red-500"
                        }`}
                        onClick={() => handleDislike(source)}
                      >
                        <span className="text-sm">👎</span>
                      </button>
                      <span className="text-red-500 text-sm font-medium">
                        {Math.max(0, totalDislikes + (userRating === "dislike" ? 1 : 0)) || 0}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className={`flex-1 ${source.color} hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium`}
                        onClick={() => handlePlayGame(source)}
                      >
                        🎮 Jouer maintenant
                      </button>
                      <AddToPlaylistButtonGeneric
                        itemId={source.id}
                        mediaType="game"
                        title={source.name}
                        posterPath={source.url}
                        variant="outline"
                        size="default"
                        className="bg-transparent px-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredSources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun jeu trouvé pour votre recherche.</p>
          </div>
        )}
        {selectedSource && (
          <IframeModal
            isOpen={showIframe}
            onClose={() => setShowIframe(false)}
            src={selectedSource.url}
            title={selectedSource.name}
          />
        )}
      </div>
    </div>
  )
}
