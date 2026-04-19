"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import { WatchTracker } from "@/lib/watch-tracking"
import Image from "next/image"
import Link from "next/link"
import { IframeModal } from "@/components/iframe-modal"

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalUrl, setModalUrl] = useState("")
  const [currentRadio, setCurrentRadio] = useState<any | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    setMounted(true)
    setFavoriteItems(WatchTracker.getFavoriteItems())

    const handleUpdate = () => {
      setFavoriteItems(WatchTracker.getFavoriteItems())
    }

    window.addEventListener("favorites-updated", handleUpdate)
    return () => window.removeEventListener("favorites-updated", handleUpdate)
  }, [])

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audio])

  const handlePlayItem = (item: any) => {
    console.log("[v0] Playing item:", item)

    // Handle TV channels - open modal with stream
    if (item.type === "tv-channel") {
      const streamUrl = item.streamUrl || item.stream_url || item.url
      console.log("[v0] TV Channel stream URL:", streamUrl)

      if (streamUrl) {
        setModalTitle(item.title)
        setModalUrl(streamUrl)
        setIsModalOpen(true)
      } else {
        console.error("[v0] No stream URL found for TV channel")
        alert(`Impossible de lire "${item.title}". URL de streaming non disponible.`)
      }
      return
    }

    // Handle radio stations - play audio
    if (item.type === "radio") {
      const streamUrl = item.streamUrl || item.stream_url || item.url
      console.log("[v0] Radio stream URL:", streamUrl)

      if (!streamUrl) {
        console.error("[v0] No stream URL found for radio")
        alert(`Impossible de lire "${item.title}". URL de streaming non disponible.`)
        return
      }

      // Stop current radio if playing the same one
      if (audio) {
        audio.pause()
      }

      if (currentRadio?.tmdbId === item.tmdbId && isPlaying) {
        setIsPlaying(false)
        setCurrentRadio(null)
        return
      }

      // Create new audio element
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
            alert("Impossible de lire cette station radio. Veuillez réessayer.")
          })
      })

      newAudio.addEventListener("error", (e) => {
        console.error("[v0] Radio audio error:", e)
        alert("Erreur lors du chargement de la station radio.")
      })

      setAudio(newAudio)
      return
    }

    // Handle retrogaming - open modal with game
    if (item.type === "game") {
      const gameUrl = item.url || item.game_url || item.gameUrl
      console.log("[v0] Game URL:", gameUrl)

      if (gameUrl) {
        setModalTitle(item.title)
        setModalUrl(gameUrl)
        setIsModalOpen(true)
      } else {
        console.error("[v0] No game URL found")
        alert(`Impossible de lire "${item.title}". URL de jeu non disponible.`)
      }
      return
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Accès refusé</h1>
            <p className="text-gray-300">Vous devez être connecté pour accéder à cette page.</p>
          </div>
        </div>
      </div>
    )
  }

  const groupedFavorites = favoriteItems.reduce(
    (acc, item) => {
      const type = item.type || "other"
      if (!acc[type]) acc[type] = []
      acc[type].push(item)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Films"
      case "tv":
        return "Séries"
      case "tv-channel":
        return "Chaînes TV"
      case "radio":
        return "Radios"
      case "game":
        return "Jeux Rétro"
      case "actor":
        return "Acteurs"
      case "playlist":
        return "Playlists"
      default:
        return "Autres"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "movie":
        return "bg-red-600"
      case "tv":
        return "bg-blue-600"
      case "tv-channel":
        return "bg-purple-600"
      case "radio":
        return "bg-green-600"
      case "game":
        return "bg-orange-600"
      case "actor":
        return "bg-orange-600"
      case "playlist":
        return "bg-pink-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Mes Favoris</h1>
            <p className="text-gray-400">Vos films, séries, chaînes TV, radios et acteurs préférés</p>
          </div>
        </div>

        {currentRadio && isPlaying && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md">
                  <img
                    src={currentRadio.logoUrl || "/placeholder.svg"}
                    alt={currentRadio.title}
                    className="w-full h-full object-contain p-1"
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

        {favoriteItems.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Aucun favori pour le moment</p>
              <p className="text-gray-500 text-sm">
                Ajoutez des contenus à vos favoris depuis leurs pages de détails pour les retrouver ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFavorites).map(([type, items]) => (
              <Card key={type} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="h-5 w-5 text-yellow-400" />
                    {getTypeLabel(type)} ({items.length})
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Vos {getTypeLabel(type).toLowerCase()} favoris
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {items.map((item) => {
                      let imageUrl = "/placeholder.svg?height=300&width=200"

                      if (item.posterPath) {
                        if (item.posterPath.startsWith("http")) {
                          imageUrl = item.posterPath
                        } else {
                          imageUrl = `https://image.tmdb.org/t/p/w300${item.posterPath}`
                        }
                      } else if (item.profilePath) {
                        imageUrl = `https://image.tmdb.org/t/p/w300${item.profilePath}`
                      } else if (item.logoUrl) {
                        imageUrl = item.logoUrl
                      }

                      const needsCustomPlaceholder = item.type === "game" || item.type === "playlist"
                      const getPlaceholderGradient = () => {
                        if (item.type === "game") {
                          return "bg-gradient-to-br from-orange-600 via-red-600 to-purple-700"
                        }
                        if (item.type === "playlist") {
                          return "bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700"
                        }
                        return "bg-gray-700"
                      }

                      const getPlaceholderIcon = () => {
                        if (item.type === "game") {
                          return "🎮"
                        }
                        if (item.type === "playlist") {
                          return "🎵"
                        }
                        return ""
                      }

                      const getItemUrl = () => {
                        switch (item.type) {
                          case "movie":
                            return `/movies/${item.tmdbId}`
                          case "tv":
                            return `/tv-shows/${item.tmdbId}`
                          case "tv-channel":
                            return null
                          case "radio":
                            return null
                          case "game":
                            return null
                          case "actor":
                            return `/actors/${item.tmdbId}`
                          case "playlist":
                            return `/playlists/${item.id}`
                          default:
                            return `/movies/${item.tmdbId}`
                        }
                      }

                      const itemUrl = getItemUrl()
                      const isPlayableItem = item.type === "tv-channel" || item.type === "radio" || item.type === "game"

                      const handleItemClick = (e: React.MouseEvent) => {
                        if (isPlayableItem) {
                          e.preventDefault()
                          e.stopPropagation()
                          handlePlayItem(item)
                        }
                      }

                      const content = (
                        <div className="space-y-2 group cursor-pointer" key={item.id}>
                          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                            {needsCustomPlaceholder && !item.posterPath && !item.logoUrl ? (
                              <div
                                className={`w-full h-full ${getPlaceholderGradient()} flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform`}
                              >
                                <span className="text-6xl mb-3 drop-shadow-lg">{getPlaceholderIcon()}</span>
                                <p className="text-white text-center font-bold text-sm line-clamp-3 drop-shadow-md px-2">
                                  {item.title}
                                </p>
                              </div>
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
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                                <Star className="w-3 h-3" />
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className={`text-xs text-white ${getTypeColor(item.type)}`}>
                                {getTypeLabel(item.type).slice(0, -1)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(item.addedAt).toLocaleDateString()}</p>
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
                          <Link key={item.id} href={itemUrl}>
                            {content}
                          </Link>
                        )
                      } else {
                        return <div key={item.id}>{content}</div>
                      }
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <IframeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} src={modalUrl} />
    </div>
  )
}
