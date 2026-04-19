"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Film, Tv, Trash2, ExternalLink, Radio, Gamepad2, Music, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { WatchTracker, type FavoriteItem } from "@/lib/watch-tracking"

export default function FavoritesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    loadFavorites()

    const handleUpdate = () => {
      loadFavorites()
    }

    window.addEventListener("favorites-updated", handleUpdate)
    return () => window.removeEventListener("favorites-updated", handleUpdate)
  }, [])

  const loadFavorites = () => {
    const allFavorites = WatchTracker.getFavoriteItems()
    setFavorites(allFavorites)
  }

  const removeFavorite = (id: string, type: string) => {
    WatchTracker.removeFromFavorites(id, type)
    loadFavorites()
  }

  const filteredFavorites = activeTab === "all" ? favorites : favorites.filter((f) => f.type === activeTab)

  const getContentLink = (item: FavoriteItem) => {
    switch (item.type) {
      case "movie":
        return `/movies/${item.tmdbId}`
      case "tv":
        return `/tv-shows/${item.tmdbId}`
      case "actor":
        return `/actors/${item.tmdbId}`
      case "playlist":
        return `/playlists/${item.tmdbId}`
      case "tv-channel":
        return `/tv-channels`
      case "radio":
        return `/radios`
      case "game":
        return `/games`
      default:
        return "#"
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-4 h-4" />
      case "tv":
        return <Tv className="w-4 h-4" />
      case "actor":
        return <User className="w-4 h-4" />
      case "tv-channel":
        return <Tv className="w-4 h-4" />
      case "radio":
        return <Radio className="w-4 h-4" />
      case "game":
        return <Gamepad2 className="w-4 h-4" />
      case "playlist":
        return <Music className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Film"
      case "tv":
        return "Série"
      case "actor":
        return "Acteur"
      case "tv-channel":
        return "Chaîne TV"
      case "radio":
        return "Radio"
      case "game":
        return "Jeu"
      case "playlist":
        return "Playlist"
      default:
        return type
    }
  }

  const getImageUrl = (item: FavoriteItem) => {
    if (item.posterPath) {
      return `https://image.tmdb.org/t/p/w500${item.posterPath}`
    }
    if (item.profilePath) {
      return `https://image.tmdb.org/t/p/w500${item.profilePath}`
    }
    if (item.logoUrl) {
      return item.logoUrl
    }
    return "/placeholder.svg?height=750&width=500"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Mes Favoris
          </h1>
          <p className="text-muted-foreground mt-2">Retrouvez tous vos contenus favoris en un seul endroit</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-auto">
            <TabsTrigger value="all">Tous ({favorites.length})</TabsTrigger>
            <TabsTrigger value="movie">Films ({favorites.filter((f) => f.type === "movie").length})</TabsTrigger>
            <TabsTrigger value="tv">Séries ({favorites.filter((f) => f.type === "tv").length})</TabsTrigger>
            <TabsTrigger value="actor">Acteurs ({favorites.filter((f) => f.type === "actor").length})</TabsTrigger>
            <TabsTrigger value="tv-channel">
              Chaînes TV ({favorites.filter((f) => f.type === "tv-channel").length})
            </TabsTrigger>
            <TabsTrigger value="radio">Radios ({favorites.filter((f) => f.type === "radio").length})</TabsTrigger>
            <TabsTrigger value="game">Jeux ({favorites.filter((f) => f.type === "game").length})</TabsTrigger>
            <TabsTrigger value="playlist">
              Playlists ({favorites.filter((f) => f.type === "playlist").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredFavorites.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Star className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucun favori pour le moment</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Commencez à ajouter vos films, séries et autres contenus préférés à vos favoris !
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/">Découvrir du contenu</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFavorites.map((item) => (
                  <Card key={item.id} className="group overflow-hidden">
                    <div className="relative aspect-[2/3]">
                      <Link href={getContentLink(item)}>
                        <Image
                          src={getImageUrl(item) || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                          <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={() => removeFavorite(item.id, item.type)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Badge className="absolute top-2 left-2 gap-1">
                        {getContentIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <Link href={getContentLink(item)}>
                        <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      {item.addedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ajouté le {new Date(item.addedAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
