"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, Lock, Calendar, Film, Trash2, Clock, Play } from "lucide-react"
import { usePlaylists } from "@/hooks/use-playlists"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IframeModal } from "@/components/iframe-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PlaylistContentPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const { playlists, getPlaylistItems, removeFromPlaylist, loading } = usePlaylists()
  const [playlist, setPlaylist] = useState<any>(null)
  const [playlistItems, setPlaylistItems] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClient()
  const [contentFilter, setContentFilter] = useState<
    "all" | "movie" | "tv" | "ebook" | "episode" | "music" | "software"
  >("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalUrl, setModalUrl] = useState("")
  const [currentRadio, setCurrentRadio] = useState<any | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && id) {
      loadPlaylistData(id as string)
    }
  }, [mounted, id, user?.id])

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audio])

  const loadPlaylistData = async (playlistId: string) => {
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single()

      if (playlistError || !playlistData) {
        console.error("Playlist not found:", playlistError)
        router.push("/discover/playlists")
        return
      }

      let username = "Utilisateur"
      let userProfile = null

      if (playlistData.user_id) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("username, avatar_url")
          .eq("id", playlistData.user_id)
          .single()

        if (profileData) {
          // Use username if available, otherwise use email prefix
          username = profileData.username || "Utilisateur"
          userProfile = profileData
          console.log("[v0] Loaded creator profile:", username, profileData)
        } else {
          console.log("[v0] No profile found for user_id:", playlistData.user_id)
        }
      }

      setCreatorProfile(userProfile)

      const { data: likesData } = await supabase.from("playlist_likes").select("is_like").eq("playlist_id", playlistId)

      const { data: itemsCountData } = await supabase.from("playlist_items").select("id").eq("playlist_id", playlistId)

      const likesCount = likesData?.filter((like) => like.is_like).length || 0
      const dislikesCount = likesData?.filter((like) => !like.is_like).length || 0
      const itemsCount = itemsCountData?.length || 0

      const canAccess = playlistData.is_public || (user?.id && playlistData.user_id === user.id)

      if (!canAccess) {
        toast({
          title: "Accès refusé",
          description: "Cette playlist est privée.",
          variant: "destructive",
        })
        router.push("/discover/playlists")
        return
      }

      const enhancedPlaylist = {
        ...playlistData,
        username: username,
        likes_count: likesCount,
        dislikes_count: dislikesCount,
        items_count: itemsCount,
      }

      console.log("[v0] Enhanced playlist with username:", enhancedPlaylist.username)
      setPlaylist(enhancedPlaylist)
      setIsOwner(user?.id === playlistData.user_id)

      const { data: itemsData, error: itemsError } = await supabase
        .from("playlist_items")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true })

      if (!itemsError && itemsData) {
        const processedItems = await Promise.all(
          itemsData.map(async (item) => {
            if (item.media_type === "tv-channel" && item.tmdb_id) {
              // Fetch full TV channel data including stream_url
              const { data: channelData } = await supabase
                .from("tv_channels")
                .select("*")
                .eq("id", item.tmdb_id)
                .single()

              if (channelData) {
                return {
                  ...item,
                  content_type: item.media_type,
                  content_id: item.tmdb_id,
                  stream_url: channelData.stream_url,
                  logo_url: channelData.logo_url || item.poster_path,
                  poster_path: channelData.logo_url || item.poster_path,
                }
              }
            }

            return {
              ...item,
              content_type: item.media_type,
              content_id: item.tmdb_id,
            }
          }),
        )

        console.log("[v0] Processed playlist items with TV channels:", processedItems)
        setPlaylistItems(processedItems)
      }
    } catch (error) {
      console.error("Error loading playlist:", error)
      router.push("/discover/playlists")
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!playlist || !isOwner) return

    try {
      await removeFromPlaylist(playlist.id, itemId)
      await loadPlaylistData(playlist.id)
      toast({
        title: "Élément supprimé",
        description: "L'élément a été retiré de la playlist.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément.",
        variant: "destructive",
      })
    }
  }

  const handlePlayItem = (item: any) => {
    console.log("[v0] Playing playlist item:", item)

    if (item.media_type === "tv-channel") {
      const streamUrl = item.stream_url || item.streamUrl || item.url
      console.log("[v0] TV Channel stream URL:", streamUrl)

      if (streamUrl) {
        setModalTitle(item.title)
        setModalUrl(streamUrl)
        setIsModalOpen(true)
      } else {
        console.error("[v0] No stream URL found for TV channel")
        toast({
          title: "Erreur",
          description: `Impossible de lire "${item.title}". URL de streaming non disponible.`,
          variant: "destructive",
        })
      }
      return
    }

    if (item.media_type === "radio") {
      const streamUrl = item.stream_url || item.streamUrl || item.url || item.poster_path
      console.log("[v0] Radio stream URL:", streamUrl)

      if (!streamUrl) {
        console.error("[v0] No stream URL found for radio")
        toast({
          title: "Erreur",
          description: "Impossible de lire cette station radio. Veuillez réessayer.",
          variant: "destructive",
        })
        return
      }

      if (audio) {
        audio.pause()
      }

      if (currentRadio?.id === item.id && isPlaying) {
        setIsPlaying(false)
        setCurrentRadio(null)
        return
      }

      const newAudio = new Audio(streamUrl)
      newAudio.crossOrigin = "anonymous"

      newAudio.addEventListener("canplay", () => {
        newAudio
          .play()
          .then(() => {
            setIsPlaying(true)
            setCurrentRadio(item)
          })
          .catch((error) => {
            console.error("[v0] Radio playback error:", error)
            toast({
              title: "Erreur",
              description: "Impossible de lire cette station radio. Veuillez réessayer.",
              variant: "destructive",
            })
          })
      })

      newAudio.addEventListener("error", (e) => {
        console.error("[v0] Radio audio error:", e)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement de la station radio.",
          variant: "destructive",
        })
      })

      setAudio(newAudio)
      return
    }

    if (item.media_type === "game") {
      const gameUrl = item.url || item.game_url || item.gameUrl || item.poster_path
      console.log("[v0] Game URL:", gameUrl)

      if (gameUrl) {
        setModalTitle(item.title)
        setModalUrl(gameUrl)
        setIsModalOpen(true)
      } else {
        console.error("[v0] No game URL found")
        toast({
          title: "Erreur",
          description: `Impossible de lire "${item.title}". URL de jeu non disponible.`,
          variant: "destructive",
        })
      }
      return
    }

    if (item.media_type === "music") {
      router.push(`/musique/${item.tmdb_id || item.content_id}`)
      return
    }

    if (item.media_type === "software") {
      router.push(`/logiciels/${item.tmdb_id || item.content_id}`)
      return
    }

    if (item.media_type === "ebook") {
      router.push(`/ebooks/${item.tmdb_id || item.content_id}`)
      return
    }

    if (item.media_type === "episode") {
      const episodeId = item.episode_id || item.tmdb_id
      const seriesId = item.series_id || item.content_id
      router.push(`/tv-shows/${seriesId}/episode/${episodeId}`)
      return
    }

    if (item.media_type === "movie") {
      router.push(`/movies/${item.tmdb_id || item.content_id}`)
      return
    } else if (item.media_type === "tv") {
      router.push(`/tv-shows/${item.tmdb_id || item.content_id}`)
      return
    }
  }

  const getExistingMediaTypes = () => {
    const types = new Set(playlistItems.map((item) => item.media_type || item.content_type))
    return Array.from(types)
  }

  const existingTypes = getExistingMediaTypes()

  const filteredPlaylistItems = playlistItems.filter((item) => {
    if (contentFilter === "all") return true
    const itemType = item.media_type || item.content_type
    return itemType === contentFilter
  })

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">Chargement...</div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Chargement de la playlist...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: playlist.theme_color.includes("gradient") ? playlist.theme_color : `${playlist.theme_color}10`,
        backgroundSize: playlist.theme_color.includes("gradient") ? "200% 200%" : "auto",
        animation: playlist.theme_color.includes("gradient") ? "gradient-shift 3s ease infinite" : "none",
      }}
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            style={{ borderColor: playlist.theme_color, color: playlist.theme_color }}
          >
            <Link href="/discover/playlists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux playlists publiques
            </Link>
          </Button>
        </div>

        {currentRadio && isPlaying && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md">
                  <img
                    src={currentRadio.logoUrl || currentRadio.poster_path || "/placeholder.svg"}
                    alt={currentRadio.title}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=200"
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentRadio.title}</h3>
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
                  onClick={() => handlePlayItem(currentRadio)}
                  className="border-blue-600 text-blue-300 hover:bg-blue-800"
                >
                  Arrêter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          className="border-gray-700"
          style={{ backgroundColor: `${playlist.theme_color}20`, borderColor: playlist.theme_color }}
        >
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-white text-2xl flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: playlist.theme_color }} />
                  {playlist.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {playlist.is_public ? (
                    <Badge
                      variant="secondary"
                      className="text-sm"
                      style={{ backgroundColor: playlist.theme_color, color: "white" }}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-sm"
                      style={{ borderColor: playlist.theme_color, color: playlist.theme_color }}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Privé
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-sm"
                    style={{ borderColor: playlist.theme_color, color: playlist.theme_color }}
                  >
                    <Film className="w-3 h-3 mr-1" />
                    {playlist.items_count} éléments
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 mt-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: playlist.theme_color }} />
                    <span>
                      Créée le{" "}
                      {new Date(playlist.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: playlist.theme_color }} />
                    <span>
                      Dernière mise à jour le{" "}
                      {new Date(playlist.updated_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creatorProfile?.avatar_url || ""} alt={playlist.username} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {playlist.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-gray-300 text-sm">Créée par {playlist.username}</p>
                </div>
              </div>
              {playlist.is_public && (
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-transparent"
                    style={{ borderColor: playlist.theme_color, color: playlist.theme_color }}
                    onClick={async () => {
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
                    }}
                  >
                    Partager
                  </Button>
                </div>
              )}
            </div>
            {playlist.description && (
              <CardDescription className="text-gray-400 mt-3">{playlist.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card
          className="border-gray-700"
          style={{ backgroundColor: `${playlist.theme_color}15`, borderColor: playlist.theme_color }}
        >
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-white">Contenu de la playlist</CardTitle>
                <CardDescription className="text-gray-400">Films et séries dans cette playlist</CardDescription>
              </div>
              <Tabs value={contentFilter} onValueChange={(value) => setContentFilter(value as any)}>
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 text-gray-300">
                    Tout
                  </TabsTrigger>
                  {existingTypes.includes("movie") && (
                    <TabsTrigger value="movie" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Films
                    </TabsTrigger>
                  )}
                  {existingTypes.includes("tv") && (
                    <TabsTrigger value="tv" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Séries
                    </TabsTrigger>
                  )}
                  {existingTypes.includes("ebook") && (
                    <TabsTrigger value="ebook" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Ebooks
                    </TabsTrigger>
                  )}
                  {existingTypes.includes("episode") && (
                    <TabsTrigger value="episode" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Épisodes
                    </TabsTrigger>
                  )}
                  {existingTypes.includes("music") && (
                    <TabsTrigger value="music" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Musique
                    </TabsTrigger>
                  )}
                  {existingTypes.includes("software") && (
                    <TabsTrigger value="software" className="data-[state=active]:bg-gray-700 text-gray-300">
                      Logiciels
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPlaylistItems.length === 0 ? (
              <div className="text-center py-12">
                <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {playlistItems.length === 0
                    ? "Cette playlist est vide"
                    : `Aucun ${contentFilter === "movie" ? "film" : contentFilter === "tv" ? "série" : contentFilter === "ebook" ? "ebook" : contentFilter === "episode" ? "épisode" : contentFilter === "music" ? "musique" : contentFilter === "software" ? "logiciel" : "contenu"} dans cette playlist`}
                </h3>
                <p className="text-gray-500 text-sm">
                  {isOwner && playlistItems.length === 0
                    ? "Ajoutez des films, séries, ebooks, épisodes, musique et logiciels depuis leurs pages de détails."
                    : contentFilter !== "all"
                      ? "Essayez un autre filtre pour voir plus de contenu."
                      : "Cette playlist ne contient aucun élément pour le moment."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {filteredPlaylistItems.map((item) => {
                  let imageUrl = "/placeholder.svg?height=300&width=200"

                  if (item.media_type === "tv-channel") {
                    imageUrl = item.logo_url || item.poster_path || "/placeholder.svg?height=300&width=200"
                    if (imageUrl && !imageUrl.startsWith("http")) {
                      imageUrl = "/placeholder.svg?height=300&width=200"
                    }
                  } else if (item.poster_path) {
                    if (item.poster_path.startsWith("http")) {
                      imageUrl = item.poster_path
                    } else {
                      imageUrl = `https://image.tmdb.org/t/p/w300${item.poster_path}`
                    }
                  }

                  const getItemUrl = () => {
                    const mediaType = item.media_type || item.content_type

                    if (mediaType === "tv-channel") return null
                    if (mediaType === "radio") return null
                    if (mediaType === "game") return null

                    if (mediaType === "music") {
                      return `/musique/${item.tmdb_id || item.content_id}`
                    }
                    if (mediaType === "software") {
                      return `/logiciels/${item.tmdb_id || item.content_id}`
                    }

                    if (mediaType === "ebook") {
                      return `/ebooks/${item.tmdb_id || item.content_id}`
                    }
                    if (mediaType === "episode") {
                      const episodeId = item.episode_id || item.tmdb_id
                      const seriesId = item.series_id || item.content_id
                      return `/tv-shows/${seriesId}/episode/${episodeId}`
                    }

                    if (mediaType === "movie") {
                      return `/movies/${item.tmdb_id || item.content_id}`
                    } else if (mediaType === "tv") {
                      return `/tv-shows/${item.tmdb_id || item.content_id}`
                    }
                    return `/movies/${item.tmdb_id || item.content_id}`
                  }

                  const itemUrl = getItemUrl()
                  const mediaType = item.media_type || item.content_type
                  const isPlayableItem = mediaType === "tv-channel" || mediaType === "radio"

                  const handleItemClick = (e: React.MouseEvent) => {
                    if (isPlayableItem) {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePlayItem(item)
                    }
                  }

                  const releaseDate = item.release_date || item.first_air_date || item.added_at
                  const formattedDate = releaseDate
                    ? new Date(releaseDate).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : null

                  const getMediaTypeLabel = (type: string) => {
                    switch (type) {
                      case "movie":
                        return "Film"
                      case "tv":
                        return "Série"
                      case "tv-channel":
                        return "Chaîne TV"
                      case "radio":
                        return "Station Radio"
                      case "game":
                        return "Jeu"
                      case "ebook":
                        return "Ebook"
                      case "episode":
                        return "Épisode"
                      case "music":
                        return "Musique"
                      case "software":
                        return "Logiciel"
                      default:
                        return "Contenu"
                    }
                  }

                  const content = (
                    <div key={item.id} className="space-y-2 group">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700 cursor-pointer">
                        {isPlayableItem ? (
                          <button
                            onClick={handleItemClick}
                            className="w-full h-full flex items-center justify-center bg-gray-800"
                            type="button"
                          >
                            {item.media_type === "tv-channel" && (item.logo_url || item.poster_path) ? (
                              <img
                                src={item.logo_url || item.poster_path}
                                alt={item.title}
                                className="w-full h-full object-contain p-4"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=300&width=200"
                                }}
                              />
                            ) : (
                              <div className="text-white text-center p-4">
                                <Play className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">{item.title}</p>
                              </div>
                            )}
                          </button>
                        ) : (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12.5vw"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=200"
                            }}
                          />
                        )}
                        {isOwner && (
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleRemoveItem(item.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white cursor-pointer">
                          {item.title}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${playlist.theme_color}20`, color: playlist.theme_color }}
                        >
                          {getMediaTypeLabel(mediaType)}
                        </Badge>
                        {formattedDate && <p className="text-xs text-gray-400">{formattedDate}</p>}
                      </div>
                    </div>
                  )

                  if (isPlayableItem) {
                    return (
                      <button key={item.id} onClick={handleItemClick} className="text-left w-full" type="button">
                        {content}
                      </button>
                    )
                  } else if (itemUrl) {
                    return (
                      <Link
                        key={item.id}
                        href={itemUrl}
                        onClick={(e) => {
                          // Allow navigation for music, software, and other types
                          if (mediaType === "music" || mediaType === "software" || mediaType === "ebook") {
                            e.preventDefault()
                            handlePlayItem(item)
                          }
                        }}
                      >
                        {content}
                      </Link>
                    )
                  } else {
                    return <div key={item.id}>{content}</div>
                  }
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <IframeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} src={modalUrl} />
    </div>
  )
}
