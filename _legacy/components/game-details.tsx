"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { IframeModal } from "@/components/iframe-modal"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"
import { Star, Calendar, Download, ThumbsUp, ThumbsDown, Gamepad2, HardDrive } from "lucide-react"

interface GameDetailsProps {
  game: any
}

export function GameDetails({ game }: GameDetailsProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    const seed = id * (type === "like" ? 7 : 11)
    return Math.floor((seed % 1000) + 50)
  }

  const totalLikes = getTotalVotes(game.id, "like")
  const totalDislikes = getTotalVotes(game.id, "dislike")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFavorite(WatchTracker.isFavorite("game", game.id))
      setUserRating(WatchTracker.getRating("game", game.id))
    }
  }, [game.id])

  const handleLike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleLike("game", game.id, game.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Jeu liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${game.title}` : `Like retiré de ${game.title}`,
    })
  }

  const handleDislike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleDislike("game", game.id, game.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Jeu disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${game.title}` : `Dislike retiré de ${game.title}`,
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

    const newState = WatchTracker.toggleFavorite("game", game.id, game.title, {})
    setIsFavorite(newState)
    toast({
      title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
      description: `${game.title} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
    })
  }

  const downloadUrl = game.download_url || `https://embed.wavewatch.xyz/download/game?id=${game.id}`

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${game.cover_url || "/placeholder.svg?height=1080&width=1920"})`,
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
          {/* Cover */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden">
              <Image
                src={game.cover_url || "/placeholder.svg?height=400&width=300"}
                alt={game.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-center md:text-left">
              {game.title}
            </h1>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{game.user_rating?.toFixed(1) || "N/A"}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{game.release_date ? new Date(game.release_date).getFullYear() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                <span>{game.file_size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>
                  {game.downloads > 1000000
                    ? `${(game.downloads / 1000000).toFixed(1)}M`
                    : game.downloads > 1000
                      ? `${(game.downloads / 1000).toFixed(0)}K`
                      : game.downloads}{" "}
                  téléchargements
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

            {/* Developer/Publisher */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                <span>Développé par</span>
                <span className="text-purple-400 font-medium">{game.developer}</span>
              </div>
              {game.publisher && (
                <>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <span>Édité par</span>
                    <span className="text-purple-400 font-medium">{game.publisher}</span>
                  </div>
                </>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-purple-800 text-purple-300 border-purple-700">
                {game.genre}
              </Badge>
              <Badge variant="secondary" className="bg-blue-800 text-blue-300 border-blue-700">
                {game.rating}
              </Badge>
              <Badge variant="secondary" className="bg-green-800 text-green-300 border-green-700">
                v{game.version}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-200 leading-relaxed text-center md:text-left">
              {game.description}
            </p>

            {/* Platform Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                Informations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plateformes:</span>
                  <span className="text-white">{game.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white">{game.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Taille:</span>
                  <span className="text-white">{game.file_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Classification:</span>
                  <span className="text-white">{game.rating}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
              <Button
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-purple-900/20 w-full sm:w-auto bg-transparent"
                onClick={() => setShowDownloadModal(true)}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Télécharger
              </Button>
              <AddToPlaylistButtonGeneric
                itemId={game.id}
                mediaType="game"
                title={game.title}
                posterPath={game.cover_url}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-purple-600 text-purple-400 hover:bg-purple-900/20 bg-transparent"
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
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Téléchargement - ${game.title}`}
      />
    </div>
  )
}
