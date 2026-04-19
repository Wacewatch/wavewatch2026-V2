"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { IframeModal } from "@/components/iframe-modal"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"
import { Star, Calendar, Clock, Play, Download, ThumbsUp, ThumbsDown, Users, Music, ListMusic } from "lucide-react"

interface MusicDetailsProps {
  music: any
}

export function MusicDetails({ music }: MusicDetailsProps) {
  const [showStreamingModal, setShowStreamingModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showTrackListingModal, setShowTrackListingModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    const seed = id * (type === "like" ? 7 : 11)
    return Math.floor((seed % 1000) + 50)
  }

  const totalLikes = getTotalVotes(music.id, "like")
  const totalDislikes = getTotalVotes(music.id, "dislike")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFavorite(WatchTracker.isFavorite("music", music.id))
      setUserRating(WatchTracker.getRating("music", music.id))
    }
  }, [music.id])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

  const handleWatch = () => {
    if (user) {
      WatchTracker.markAsWatched("music", music.id, music.title, music.duration || 60, {
        genre: music.genre,
        artist: music.artist,
      })
    }
    setShowStreamingModal(true)
  }

  const handleDownload = () => {
    if (user) {
      WatchTracker.markAsWatched("music", music.id, music.title, music.duration || 60, {
        genre: music.genre,
        artist: music.artist,
      })
    }
    setShowDownloadModal(true)
  }

  const handleLike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleLike("music", music.id, music.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Concert liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${music.title}` : `Like retiré de ${music.title}`,
    })
  }

  const handleDislike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleDislike("music", music.id, music.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Concert disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${music.title}` : `Dislike retiré de ${music.title}`,
    })
  }

  const handleAddToFavorites = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris.",
        variant: "destructive",
      })
      return
    }

    if (typeof window === "undefined") return

    const newState = WatchTracker.toggleFavorite("music", music.id, music.title, {})
    setIsFavorite(newState)
    toast({
      title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
      description: `${music.title} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
    })
  }

  const streamingUrl = music.streaming_url || `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-music-${music.id}`
  const downloadUrl = music.download_url || streamingUrl // Utilise la même URL que streaming

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${music.thumbnail_url || "/placeholder.svg?height=1080&width=1920"})`,
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Thumbnail */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden">
              <Image
                src={music.thumbnail_url || "/placeholder.svg?height=400&width=300"}
                alt={music.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-center md:text-left">
              {music.title}
            </h1>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-medium">{music.artist}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{music.release_year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(music.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>
                  {music.views > 1000000
                    ? `${(music.views / 1000000).toFixed(1)}M vues`
                    : music.views > 1000
                      ? `${(music.views / 1000).toFixed(0)}K vues`
                      : `${music.views} vues`}
                </span>
              </div>
              {/* Votes */}
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-auto ${
                    userRating === "like" ? "text-green-500 hover:text-green-400" : "text-gray-400 hover:text-green-500"
                  }`}
                  onClick={handleLike}
                >
                  <ThumbsUp className={`w-4 h-4 ${userRating === "like" ? "fill-current" : ""}`} />
                </Button>
                <span className="text-green-500 text-sm font-medium">
                  {totalLikes + (userRating === "like" ? 1 : 0)}
                </span>
                <div className="w-px h-4 bg-gray-600 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-auto ${
                    userRating === "dislike" ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                  }`}
                  onClick={handleDislike}
                >
                  <ThumbsDown className={`w-4 h-4 ${userRating === "dislike" ? "fill-current" : ""}`} />
                </Button>
                <span className="text-red-500 text-sm font-medium">
                  {totalDislikes + (userRating === "dislike" ? 1 : 0)}
                </span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-purple-800 text-purple-300 border-purple-700">
                {music.genre}
              </Badge>
              <Badge variant="secondary" className="bg-blue-800 text-blue-300 border-blue-700">
                {music.type}
              </Badge>
              <Badge variant="secondary" className="bg-green-800 text-green-300 border-green-700">
                {music.quality}
              </Badge>
            </div>

            {/* Action Buttons */}
            {/* Primary button: View titles (if available) */}
            {music.description && (
              <div className="pb-3 border-b border-gray-700">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-900/20 w-full sm:w-auto bg-transparent"
                  onClick={() => setShowTrackListingModal(true)}
                >
                  <ListMusic className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Voir les titres
                </Button>
              </div>
            )}

            {/* Action Buttons - Other buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
              <Button
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-purple-900/20 w-full sm:w-auto bg-transparent"
                onClick={handleWatch}
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Écouter
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-900/20 w-full sm:w-auto bg-transparent"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Télécharger
              </Button>
              <AddToPlaylistButtonGeneric
                itemId={music.id}
                mediaType="music"
                title={music.title}
                posterPath={music.thumbnail_url}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-green-600 text-green-400 hover:bg-green-900/20 bg-transparent"
              />
              <Button
                size="lg"
                variant="outline"
                className={`border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 w-full sm:w-auto ${
                  isFavorite ? "bg-yellow-900/20" : ""
                }`}
                onClick={handleAddToFavorites}
              >
                <Star className={`w-4 h-4 md:w-5 md:h-5 mr-2 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                Favoris
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IframeModal
        isOpen={showStreamingModal}
        onClose={() => setShowStreamingModal(false)}
        src={streamingUrl}
        title={`Écouter - ${music.title}`}
      />

      <IframeModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Télécharger - ${music.title}`}
      />

      <Dialog open={showTrackListingModal} onOpenChange={setShowTrackListingModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-white">Liste des titres</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <p className="text-center text-gray-200 leading-relaxed whitespace-pre-line px-4 py-6">
              {music.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
