"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IframeModal } from "@/components/iframe-modal"
import { TrailerModal } from "@/components/trailer-modal"
import { AddToListSelector } from "@/components/add-to-list-selector"
import { Play, Download, Star, Clock, Calendar, Check, ArrowLeft, Youtube, ThumbsUp, ThumbsDown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface EpisodeDetailsProps {
  episode: {
    id?: number
    name?: string
    overview?: string
    still_path?: string | null
    air_date?: string
    episode_number?: number
    runtime?: number | null
    vote_average?: number
    vote_count?: number
  }
  showId: number
  seasonNumber: number
  showData?: {
    name?: string
    poster_path?: string | null
  }
  isAnime?: boolean
}

export function EpisodeDetails({ episode, showId, seasonNumber, showData, isAnime = false }: EpisodeDetailsProps) {
  const [showStreamingModal, setShowStreamingModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [showLogoImage, setShowLogoImage] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const { preferences } = useUserPreferences()

  const episodeName = episode?.name || "Épisode sans titre"
  const episodeOverview = episode?.overview || "Aucun synopsis disponible pour cet épisode."
  const episodeNumber = episode?.episode_number || 1
  const voteAverage = episode?.vote_average || 0
  const airDate = episode?.air_date || ""
  const runtime = episode?.runtime || null
  const stillPath = episode?.still_path || null

  const getTotalVotes = (showId: number, season: number, episode: number, type: "like" | "dislike") => {
    const seed = (showId * 1000 + season * 100 + episode) * (type === "like" ? 7 : 11)
    return Math.floor((seed % 500) + 20)
  }

  const totalLikes = getTotalVotes(showId, seasonNumber, episodeNumber, "like")
  const totalDislikes = getTotalVotes(showId, seasonNumber, episodeNumber, "dislike")

  useEffect(() => {
    const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`
    setIsInWishlist(WatchTracker.isInWishlist("episode", episodeId))
    setIsWatched(WatchTracker.isWatched("episode", episodeId))
    setIsFavorite(WatchTracker.isFavorite("episode", episodeId))
    setUserRating(WatchTracker.getRating("episode", episodeId))
  }, [showId, seasonNumber, episodeNumber])

  useEffect(() => {
    async function fetchShowLogoImage() {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${showId}/images?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&include_image_language=fr,en,null`,
        )
        const data = await response.json()

        const logo =
          data.logos?.find((img: any) => img.iso_639_1 === "fr") ||
          data.logos?.find((img: any) => img.iso_639_1 === "en") ||
          data.logos?.[0]

        if (logo?.file_path) {
          setShowLogoImage(`https://image.tmdb.org/t/p/original${logo.file_path}`)
        }
      } catch (error) {
        console.error("Error fetching show logo:", error)
      }
    }

    fetchShowLogoImage()
  }, [showId])

  const backdropUrl = stillPath
    ? `https://image.tmdb.org/t/p/original${stillPath}`
    : "/placeholder.svg?height=1080&width=1920"

  const streamingUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${showId}-s${seasonNumber}-e${episodeNumber}`
  const downloadUrl = `https://wwembed.wavewatch.xyz/api/v1/download/ww-tv-${showId}-s${seasonNumber}-e${episodeNumber}`

  const handleWatch = () => {
    const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`

    console.log("[v0] Marking episode as watched:", {
      showId,
      seasonNumber,
      episodeNumber,
      episodeName,
      runtime: runtime || 45,
    })

    WatchTracker.markAsWatched("episode", episodeId, episodeName, runtime || 45, {
      showName: showData?.name,
      season: seasonNumber,
      episode: episodeNumber,
      posterPath: stillPath,
      showId: showId,
    })

    setIsWatched(true)

    toast({
      title: "Épisode marqué comme vu",
      description: `${episodeName} a été ajouté à votre historique.`,
    })

    window.dispatchEvent(new Event("watchlist-updated"))

    setShowStreamingModal(true)
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  const handleWatchTrailer = async () => {
    const url = await getTrailerEmbedUrl()
    setTrailerUrl(url)
    setShowTrailerModal(true)
  }

  const getTrailerEmbedUrl = async () => {
    const trailerQuery = encodeURIComponent(`${showData?.name} season ${seasonNumber} episode ${episodeNumber} trailer`)
    return `https://www.youtube.com/embed?listType=search&list=${trailerQuery}&autoplay=1`
  }

  const handleLike = () => {
    const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`
    const newRating = WatchTracker.toggleLike("episode", episodeId, episodeName, {
      posterPath: stillPath,
      showId,
      season: seasonNumber,
      episode: episodeNumber,
    })
    setUserRating(newRating)
    toast({
      title: newRating ? "Épisode liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${episodeName}` : `Like retiré de ${episodeName}`,
    })
  }

  const handleDislike = () => {
    const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`
    const newRating = WatchTracker.toggleDislike("episode", episodeId, episodeName, {
      posterPath: stillPath,
      showId,
      season: seasonNumber,
      episode: episodeNumber,
    })
    setUserRating(newRating)
    toast({
      title: newRating ? "Épisode disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${episodeName}` : `Dislike retiré de ${episodeName}`,
    })
  }

  const handleAddToFavorites = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris.",
        variant: "destructive",
      })
      return
    }

    try {
      const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`
      const newState = WatchTracker.toggleFavorite("episode", episodeId, episodeName, stillPath)
      setIsFavorite(newState)
      toast({
        title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
        description: `${episodeName} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsWatched = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour marquer comme vu.",
        variant: "destructive",
      })
      return
    }

    try {
      const episodeId = `${showId}-${seasonNumber}-${episodeNumber}`
      WatchTracker.markAsWatched("episode", episodeId, episodeName, runtime || 45, {
        showName: showData?.name,
        season: seasonNumber,
        episode: episodeNumber,
      })

      const newState = WatchTracker.isWatched("episode", episodeId)
      setIsWatched(newState)

      toast({
        title: newState ? "Marqué comme vu" : "Marqué comme non vu",
        description: `${episodeName} a été marqué comme ${newState ? "vu" : "non vu"}.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue"
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Date inconnue"
    }
  }

  const backUrl = isAnime ? `/anime/${showId}/season/${seasonNumber}` : `/tv-shows/${showId}/season/${seasonNumber}`
  const showUrl = isAnime ? `/anime/${showId}` : `/tv-shows/${showId}`

  return (
    <div className="min-h-screen bg-black no-horizontal-scroll">
      <div className="relative h-[35vh] md:h-[40vh] lg:h-[45vh] overflow-hidden">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${preferences.hideSpoilers ? "blur-xl" : ""}`}
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 md:-mt-16 lg:-mt-20 relative z-10">
        <div className="mb-4">
          <Button asChild variant="ghost" className="text-white hover:text-blue-300">
            <Link href={backUrl}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la saison {seasonNumber}
            </Link>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Poster - centered on mobile, left on desktop */}
          <div className="flex justify-center lg:justify-start lg:flex-shrink-0">
            <div
              className={`relative aspect-[2/3] w-48 md:w-56 lg:w-64 rounded-lg overflow-hidden ${preferences.hideSpoilers ? "blur-md" : ""}`}
            >
              <Image
                src={
                  stillPath ? `https://image.tmdb.org/t/p/w500${stillPath}` : "/placeholder.svg?height=750&width=500"
                }
                alt={episodeName}
                fill
                className="object-cover"
              />
              {preferences.hideSpoilers && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <p className="text-white text-center px-4">Mode anti-spoiler activé</p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 text-center lg:text-left">
                <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                  {isAnime ? "Animé" : "Série"} • Saison {seasonNumber} • Épisode {episodeNumber}
                </Badge>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">{episodeName}</h1>
                {showData?.name &&
                  (showLogoImage ? (
                    <Link href={showUrl} className="block">
                      <img
                        src={showLogoImage || "/placeholder.svg"}
                        alt={showData.name}
                        className="h-8 md:h-10 w-auto max-w-full object-contain mx-auto lg:mx-0 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  ) : (
                    <Link href={showUrl} className="text-base md:text-lg text-blue-400 hover:text-blue-300 block">
                      {showData.name}
                    </Link>
                  ))}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 text-sm md:text-base text-gray-300">
                {voteAverage > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{voteAverage.toFixed(1)}/10</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(airDate)}</span>
                </div>
                {runtime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{runtime} min</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 h-auto ${
                      userRating === "like"
                        ? "text-green-500 hover:text-green-400"
                        : "text-gray-400 hover:text-green-500"
                    }`}
                    onClick={handleLike}
                  >
                    <ThumbsUp className={`w-4 h-4 ${userRating === "like" ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-green-500 font-medium">{totalLikes + (userRating === "like" ? 1 : 0)}</span>
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
                  <span className="text-red-500 font-medium">{totalDislikes + (userRating === "dislike" ? 1 : 0)}</span>
                </div>
              </div>

              <div className={preferences.hideSpoilers ? "blur-md select-none" : ""}>
                <p className="text-sm md:text-base text-gray-200 leading-relaxed text-center lg:text-left">
                  {episodeOverview}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {episodeNumber > 1 && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent text-xs md:text-sm"
                    >
                      <Link
                        href={`${isAnime ? `/anime/${showId}` : `/tv-shows/${showId}`}/season/${seasonNumber}/episode/${episodeNumber - 1}`}
                      >
                        ← Ép. {episodeNumber - 1}
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent text-xs md:text-sm"
                  >
                    <Link
                      href={`${isAnime ? `/anime/${showId}` : `/tv-shows/${showId}`}/season/${seasonNumber}/episode/${episodeNumber + 1}`}
                    >
                      Ép. {episodeNumber + 1} →
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent text-xs md:text-sm flex-1 sm:flex-none"
                    onClick={handleWatch}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Regarder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-900/20 bg-transparent text-xs md:text-sm flex-1 sm:flex-none"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-600 text-orange-400 hover:bg-orange-900/20 bg-transparent text-xs md:text-sm flex-1 sm:flex-none"
                    onClick={handleWatchTrailer}
                  >
                    <Youtube className="w-4 h-4 mr-1" />
                    Bande-annonce
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <AddToListSelector
                    content={{
                      id: showId,
                      name: episodeName,
                      poster_path: stillPath,
                      vote_average: voteAverage,
                      first_air_date: airDate,
                    }}
                    contentType="tv"
                    className="text-xs md:text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={`border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 text-xs md:text-sm ${
                      isFavorite ? "bg-yellow-900/20" : ""
                    }`}
                    onClick={handleAddToFavorites}
                  >
                    <Star className={`w-4 h-4 mr-1 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    Favoris
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`border-green-600 text-green-400 hover:bg-green-900/20 text-xs md:text-sm ${
                      isWatched ? "bg-green-900/20" : ""
                    }`}
                    onClick={handleMarkAsWatched}
                  >
                    <Check className={`w-4 h-4 mr-1 ${isWatched ? "text-green-500" : ""}`} />
                    Marquer vu
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800 bg-transparent text-xs md:text-sm"
                >
                  <Link href={backUrl}>Tous les épisodes</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800 bg-transparent text-xs md:text-sm"
                >
                  <Link href={showUrl}>Retour à la série</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IframeModal
        isOpen={showStreamingModal}
        onClose={() => setShowStreamingModal(false)}
        src={streamingUrl}
        title={`Streaming - ${episodeName}`}
      />

      <IframeModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Téléchargement - ${episodeName}`}
      />

      <TrailerModal
        isOpen={showTrailerModal}
        onClose={() => setShowTrailerModal(false)}
        title={`${episodeName} - ${showData?.name}`}
        trailerUrl={trailerUrl}
      />
    </div>
  )
}
