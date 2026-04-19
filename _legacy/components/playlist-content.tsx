"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { ThumbsUp, ThumbsDown, Share2, Globe, Lock, User, Calendar, Music, Star, StarOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface PlaylistContentProps {
  playlist: {
    id: string
    title: string
    description?: string
    is_public: boolean
    created_at: string
    user_id: string
    username: string
    theme_color: string
    items: Array<{
      id: string
      tmdb_id: number
      media_type:
        | "movie"
        | "tv"
        | "tv-channel"
        | "radio"
        | "game"
        | "ebook"
        | "episode"
        | "music"
        | "software"
        | "retrogaming"
      title: string
      poster_path?: string
      position: number
      added_at: string
    }>
    likes_count: number
    dislikes_count: number
    items_count: number
  }
}

export function PlaylistContent({ playlist }: PlaylistContentProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState<boolean | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likesCount, setLikesCount] = useState(playlist.likes_count)
  const [dislikesCount, setDislikesCount] = useState(playlist.dislikes_count)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      checkUserInteractions()
    }
  }, [user, playlist.id])

  const checkUserInteractions = async () => {
    if (!user) return

    try {
      // Check if user liked/disliked
      const { data: likeData } = await supabase
        .from("playlist_likes")
        .select("is_like")
        .eq("playlist_id", playlist.id)
        .eq("user_id", user.id)
        .single()

      if (likeData) {
        setIsLiked(likeData.is_like)
      }

      const favoriteItems = WatchTracker.getFavoriteItems()
      const isFav = favoriteItems.some((item) => item.type === "playlist" && item.id === playlist.id)
      setIsFavorited(isFav)
    } catch (error) {
      console.error("Error checking user interactions:", error)
    }
  }

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour évaluer une playlist",
        variant: "destructive",
      })
      return
    }

    try {
      if (isLiked === isLike) {
        // Remove like/dislike
        await supabase.from("playlist_likes").delete().eq("playlist_id", playlist.id).eq("user_id", user.id)

        setIsLiked(null)
        if (isLike) {
          setLikesCount((prev) => prev - 1)
        } else {
          setDislikesCount((prev) => prev - 1)
        }
      } else {
        // Add or update like/dislike
        await supabase.from("playlist_likes").upsert({
          playlist_id: playlist.id,
          user_id: user.id,
          is_like: isLike,
        })

        const oldIsLiked = isLiked
        setIsLiked(isLike)

        if (oldIsLiked === true && !isLike) {
          setLikesCount((prev) => prev - 1)
          setDislikesCount((prev) => prev + 1)
        } else if (oldIsLiked === false && isLike) {
          setDislikesCount((prev) => prev - 1)
          setLikesCount((prev) => prev + 1)
        } else if (oldIsLiked === null) {
          if (isLike) {
            setLikesCount((prev) => prev + 1)
          } else {
            setDislikesCount((prev) => prev + 1)
          }
        }
      }

      toast({
        title: isLike ? "Playlist likée" : "Playlist dislikée",
        description: `Votre évaluation a été ${isLiked === isLike ? "supprimée" : "enregistrée"}`,
      })
    } catch (error) {
      console.error("Error updating like:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre évaluation",
        variant: "destructive",
      })
    }
  }

  const handleFavorite = () => {
    const playlistData = {
      id: playlist.id,
      title: playlist.title,
      type: "playlist" as const,
      posterPath: "/music-playlist.png",
      addedAt: new Date(),
      tmdbId: 0, // Not applicable for playlists
    }

    if (isFavorited) {
      WatchTracker.removeFromFavorites(playlist.id, "playlist")
      setIsFavorited(false)
      toast({
        title: "Retiré des favoris",
        description: "La playlist a été retirée de vos favoris",
      })
    } else {
      WatchTracker.addToFavorites(playlistData)
      setIsFavorited(true)
      toast({
        title: "Ajouté aux favoris",
        description: "La playlist a été ajoutée à vos favoris",
      })
    }
  }

  const handleShare = async () => {
    if (!playlist.is_public) {
      toast({
        title: "Partage impossible",
        description: "Seules les playlists publiques peuvent être partagées",
        variant: "destructive",
      })
      return
    }

    const shareUrl = `${window.location.origin}/playlists/${playlist.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist.title,
          text: playlist.description || `Découvrez la playlist "${playlist.title}" sur WaveWatch`,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Lien copié",
          description: "Le lien de la playlist a été copié dans le presse-papiers",
        })
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien",
          variant: "destructive",
        })
      }
    }
  }

  const isOwner = user?.id === playlist.user_id

  const getMediaTypeInfo = (item: any) => {
    switch (item.media_type) {
      case "movie":
        return { label: "Film", url: `/movies/${item.tmdb_id}` }
      case "tv":
        return { label: "Série", url: `/tv-shows/${item.tmdb_id}` }
      case "tv-channel":
        return { label: "Chaîne TV", url: `/tv-channels` }
      case "radio":
        return { label: "Radio", url: `/radio` }
      case "game":
        return { label: "Jeu", url: `/games/${item.tmdb_id}` }
      case "retrogaming":
        return { label: "Jeu Rétro", url: `/retrogaming` }
      case "ebook":
        return { label: "Ebook", url: `/ebooks` }
      case "music":
        return { label: "Musique", url: `/musique/${item.tmdb_id}` }
      case "software":
        return { label: "Logiciel", url: `/logiciels/${item.tmdb_id}` }
      default:
        return { label: "Contenu", url: "#" }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{playlist.title}</h1>
              {playlist.description && <p className="text-gray-400 text-lg mb-4">{playlist.description}</p>}

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Par {playlist.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {playlist.created_at
                      ? new Date(playlist.created_at).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date inconnue"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  <span>{playlist.items_count} éléments</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {playlist.is_public ? (
                <Globe className="h-5 w-5 text-green-400" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
              <Badge variant={playlist.is_public ? "default" : "secondary"}>
                {playlist.is_public ? "Publique" : "Privée"}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button
                  onClick={() => handleLike(true)}
                  variant={isLiked === true ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {likesCount}
                </Button>

                <Button
                  onClick={() => handleLike(false)}
                  variant={isLiked === false ? "destructive" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  {dislikesCount}
                </Button>

                <Button
                  onClick={handleFavorite}
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isFavorited ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                  {isFavorited ? "Favoris" : "Ajouter aux favoris"}
                </Button>
              </>
            )}

            {playlist.is_public && (
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            )}
          </div>
        </div>

        {/* Playlist Items */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Contenu de la playlist</CardTitle>
            <CardDescription className="text-gray-400">
              {playlist.items_count} élément{playlist.items_count > 1 ? "s" : ""} dans cette playlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playlist.items.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Cette playlist est vide pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {playlist.items.map((item, index) => {
                  const imageUrl = item.poster_path
                    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                    : "/placeholder.svg?height=300&width=200"

                  const mediaInfo = getMediaTypeInfo(item)

                  return (
                    <Link key={item.id} href={mediaInfo.url}>
                      <div className="space-y-2 group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=200"
                            }}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-gray-800 text-white text-xs">
                              {index + 1}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                            {item.title}
                          </p>
                          <Badge variant="secondary" className="bg-gray-800 text-white text-xs">
                            {mediaInfo.label}
                          </Badge>
                          {item.added_at && (
                            <p className="text-xs text-gray-500">
                              Ajouté le{" "}
                              {new Date(item.added_at).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
