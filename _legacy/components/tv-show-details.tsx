"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { IframeModal } from "@/components/iframe-modal"
import { TrailerModal } from "@/components/trailer-modal"
import { AddToListSelector } from "@/components/add-to-list-selector"
import { ClassificationBadge } from "@/components/classification-badge"
import { Star, Calendar, Check, Play, Download, Youtube, ThumbsUp, ThumbsDown, Shuffle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { CastList } from "@/components/cast-list"
import { useRouter } from "next/navigation"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { WatchProviders } from "@/components/watch-providers"

interface TVShowDetailsProps {
  show: any
  credits: any
  isAnime?: boolean
}

export function TVShowDetails({ show, credits, isAnime = false }: TVShowDetailsProps) {
  const [showStreamingModal, setShowStreamingModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [similarShows, setSimilarShows] = useState<any[]>([])
  const [isMarkingWatched, setIsMarkingWatched] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [certification, setCertification] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { preferences } = useUserPreferences()

  // Simuler les votes totaux basés sur l'ID
  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    const seed = id * (type === "like" ? 7 : 11)
    return Math.floor((seed % 1000) + 50)
  }

  const totalLikes = getTotalVotes(show.id, "like")
  const totalDislikes = getTotalVotes(show.id, "dislike")

  // Vérifier les états au chargement
  useEffect(() => {
    setIsInWishlist(WatchTracker.isInWishlist("tv", show.id))
    setIsWatched(WatchTracker.isWatched("tv", show.id))
    setIsFavorite(WatchTracker.isFavorite("tv", show.id))
    setUserRating(WatchTracker.getRating("tv", show.id))
  }, [show.id])

  // Fetch similar shows
  useEffect(() => {
    const fetchSimilarShows = async () => {
      try {
        const response = await fetch(`/api/tmdb/similar/tv/${show.id}`)
        if (response.ok) {
          const similarData = await response.json()
          setSimilarShows(similarData.results.slice(0, 12))
        }
      } catch (error) {
        console.error("Error fetching similar shows:", error)
      }
    }

    fetchSimilarShows()
  }, [show.id])

  useEffect(() => {
    const fetchCertification = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${show.id}/content_ratings?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        )
        if (response.ok) {
          const data = await response.json()
          // Find US or FR rating
          const usRating = data.results?.find((r: any) => r.iso_3166_1 === "US")
          const frRating = data.results?.find((r: any) => r.iso_3166_1 === "FR")

          const cert = frRating?.rating || usRating?.rating
          if (cert) {
            setCertification(cert)
          }
        }
      } catch (error) {
        console.error("Error fetching certification:", error)
      }
    }

    fetchCertification()
  }, [show.id])

  useEffect(() => {
    async function fetchLogoImage() {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${show.id}/images?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&include_image_language=fr,en,null`,
        )
        const data = await response.json()

        // Get the first logo from fr, en, or null language
        const logo =
          data.logos?.find((img: any) => img.iso_639_1 === "fr") ||
          data.logos?.find((img: any) => img.iso_639_1 === "en") ||
          data.logos?.[0]

        if (logo?.file_path) {
          setLogoImage(`https://image.tmdb.org/t/p/original${logo.file_path}`)
        }
      } catch (error) {
        console.error("Error fetching logo:", error)
      }
    }

    fetchLogoImage()
  }, [show.id])

  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : "/placeholder.svg?height=750&width=500"

  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "/placeholder.svg?height=1080&width=1920"

  const streamingUrl = `https://wwembed.wavewatch.xyz/api/v1/streaming/ww-tv-${show.id}`
  const downloadUrl = `https://wwembed.wavewatch.xyz/api/v1/download/ww-tv-${show.id}`

  const handleRandomEpisode = () => {
    if (show.seasons && show.seasons.length > 0) {
      const availableSeasons = show.seasons.filter(
        (season: any) => season.season_number > 0 && season.episode_count > 0,
      )
      if (availableSeasons.length > 0) {
        const randomSeason = availableSeasons[Math.floor(Math.random() * availableSeasons.length)]
        const randomEpisode = Math.floor(Math.random() * randomSeason.episode_count) + 1
        const episodePath = `/${isAnime ? "anime" : "tv-shows"}/${show.id}/season/${randomSeason.season_number}/episode/${randomEpisode}`

        toast({
          title: "Épisode aléatoire sélectionné !",
          description: `${randomSeason.name} - Épisode ${randomEpisode}`,
        })

        router.push(episodePath)
      } else {
        toast({
          title: "Aucun épisode disponible",
          description: "Cette série n'a pas d'épisodes disponibles.",
          variant: "destructive",
        })
      }
    }
  }

  const handleWatch = async () => {
    setIsMarkingWatched(true)
    try {
      console.log("[v0] Starting to mark all episodes as watched from watch button")
      console.log("[v0] Available seasons:", show.seasons)

      const validSeasons = show.seasons.filter((season: any) => season.season_number > 0)
      console.log("[v0] Valid seasons:", validSeasons)

      // Fetch episode details for each season
      const seasonsWithEpisodes = await Promise.all(
        validSeasons.map(async (season: any) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${show.id}/season/${season.season_number}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
            )
            if (response.ok) {
              const seasonData = await response.json()
              console.log(`[v0] Season ${season.season_number}: ${seasonData.episodes?.length || 0} episodes fetched`)
              return {
                ...season,
                episodes: seasonData.episodes || [],
              }
            }
          } catch (error) {
            console.error(`[v0] Error fetching season ${season.season_number}:`, error)
          }

          // Fallback: create episodes based on episode_count
          const episodeCount = season.episode_count || 10
          const episodes = Array.from({ length: episodeCount }, (_, index) => ({
            id: season.id * 1000 + index + 1,
            episode_number: index + 1,
            name: `Episode ${index + 1}`,
            runtime: 45,
            still_path: null,
          }))
          console.log(`[v0] Season ${season.season_number}: ${episodes.length} episodes created (fallback)`)
          return {
            ...season,
            episodes,
          }
        }),
      )

      const totalEpisodes = seasonsWithEpisodes.reduce((sum, season) => sum + season.episodes.length, 0)
      const totalDuration = totalEpisodes * 45

      console.log(`[v0] Total episodes calculated: ${totalEpisodes}, Total duration: ${totalDuration} minutes`)

      // Always mark as watched when clicking "Regarder"
      WatchTracker.markAsWatched("tv", show.id, show.name, totalDuration, {
        genre: show.genres[0]?.name,
        rating: Math.round(show.vote_average),
        posterPath: show.poster_path,
        seasons: seasonsWithEpisodes,
      })

      setIsWatched(true)

      toast({
        title: "Série et épisodes marqués comme vus",
        description: `${show.name} et ses ${totalEpisodes} épisodes ont été ajoutés à votre historique.`,
      })

      // Force update of statistics
      window.dispatchEvent(new Event("watchlist-updated"))
    } catch (error) {
      console.error("[v0] Error marking as watched:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingWatched(false)
    }

    // Open the streaming modal
    setShowStreamingModal(true)
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  const handleLike = () => {
    const newRating = WatchTracker.toggleLike("tv", show.id, show.name, {
      posterPath: show.poster_path,
    })
    setUserRating(newRating)
    toast({
      title: newRating ? "Série likée !" : "Like retiré",
      description: newRating ? `Vous avez liké ${show.name}` : `Like retiré de ${show.name}`,
    })
  }

  const handleDislike = () => {
    const newRating = WatchTracker.toggleDislike("tv", show.id, show.name, {
      posterPath: show.poster_path,
    })
    setUserRating(newRating)
    toast({
      title: newRating ? "Série dislikée" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${show.name}` : `Dislike retiré de ${show.name}`,
    })
  }

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter à votre wishlist.",
        variant: "destructive",
      })
      return
    }

    try {
      const newState = WatchTracker.toggleWishlist("tv", show.id, show.name, show.poster_path)
      setIsInWishlist(newState)
      toast({
        title: newState ? "Ajouté à la wishlist" : "Retiré de la wishlist",
        description: `${show.name} a été ${newState ? "ajouté à" : "retiré de"} votre wishlist.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      })
    }
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
      const newState = WatchTracker.toggleFavorite("tv", show.id, show.name, {
        posterPath: show.poster_path,
      })
      setIsFavorite(newState)
      toast({
        title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
        description: `${show.name} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
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

    setIsMarkingWatched(true)

    try {
      console.log("Début du marquage de la série:", show.name)
      console.log("Saisons disponibles:", show.seasons)

      const validSeasons = show.seasons.filter((season: any) => season.season_number > 0)
      console.log("Saisons valides:", validSeasons)

      // Fetch episode details for each season
      const seasonsWithEpisodes = await Promise.all(
        validSeasons.map(async (season: any) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${show.id}/season/${season.season_number}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
            )
            if (response.ok) {
              const seasonData = await response.json()
              console.log(`Saison ${season.season_number}: ${seasonData.episodes?.length || 0} épisodes récupérés`)
              return {
                ...season,
                episodes: seasonData.episodes || [],
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération de la saison ${season.season_number}:`, error)
          }

          // Fallback: create episodes based on episode_count
          const episodeCount = season.episode_count || 10
          const episodes = Array.from({ length: episodeCount }, (_, index) => ({
            id: season.id * 1000 + index + 1,
            episode_number: index + 1,
            name: `Episode ${index + 1}`,
            runtime: 45,
            still_path: null,
          }))
          console.log(`Saison ${season.season_number}: ${episodes.length} épisodes créés (fallback)`)
          return {
            ...season,
            episodes,
          }
        }),
      )

      // Calculate total episodes and duration
      const totalEpisodes = seasonsWithEpisodes.reduce((sum, season) => sum + season.episodes.length, 0)
      const totalDuration = totalEpisodes * 45

      console.log(`Total épisodes calculé: ${totalEpisodes}, Durée totale: ${totalDuration} minutes`)

      WatchTracker.markAsWatched("tv", show.id, show.name, totalDuration, {
        genre: show.genres[0]?.name,
        rating: Math.round(show.vote_average),
        posterPath: show.poster_path,
        seasons: seasonsWithEpisodes,
      })

      const newState = WatchTracker.isWatched("tv", show.id)
      setIsWatched(newState)

      // Count marked episodes for verification
      const watchedItems = WatchTracker.getWatchedItems()
      const episodesMarked = watchedItems.filter((item) => item.type === "episode" && item.showId === show.id).length

      console.log(`Épisodes marqués dans le tracker: ${episodesMarked}`)

      toast({
        title: newState ? "Série marquée comme vue" : "Série marquée comme non vue",
        description: newState
          ? `${show.name} et ses ${totalEpisodes} épisodes ont été marqués comme vus.`
          : `${show.name} et tous ses épisodes ont été marqués comme non vus.`,
      })

      // Force update of statistics
      window.dispatchEvent(new Event("watchlist-updated"))
    } catch (error) {
      console.error("Error marking as watched:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du marquage.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingWatched(false)
    }
  }

  const handleWatchTrailer = async () => {
    const url = await getTrailerEmbedUrl()
    setTrailerUrl(url)
    setShowTrailerModal(true)
  }

  const getTrailerEmbedUrl = async () => {
    try {
      if (show.videos && show.videos.results && show.videos.results.length > 0) {
        // Find the first trailer or teaser
        const trailer =
          show.videos.results.find((video: any) => video.type === "Trailer" && video.site === "YouTube") ||
          show.videos.results.find((video: any) => video.type === "Teaser" && video.site === "YouTube") ||
          show.videos.results.find((video: any) => video.site === "YouTube")

        if (trailer && trailer.key) {
          return `https://www.youtube.com/embed/${trailer.key}?autoplay=1`
        }
      }
    } catch (error) {
      console.error("Error getting TMDB trailer:", error)
    }

    // Fallback vers une recherche générique si pas de vidéo TMDB
    const trailerQuery = encodeURIComponent(`${show.name} ${new Date(show.first_air_date).getFullYear()} trailer`)
    return `https://www.youtube.com/embed?listType=search&list=${trailerQuery}&autoplay=1`
  }

  const getShowStatus = () => {
    const today = new Date()
    const firstAirDate = show.first_air_date ? new Date(show.first_air_date) : null
    const lastAirDate = show.last_air_date ? new Date(show.last_air_date) : null

    // Pas encore sorti
    if (firstAirDate && firstAirDate > today) {
      return { label: "Pas encore sorti", color: "bg-gray-600" }
    }

    // Série terminée
    if (show.status === "Ended" || show.status === "Canceled") {
      return { label: "Terminée", color: "bg-red-600" }
    }

    // En cours de diffusion
    if (show.status === "Returning Series" || show.in_production) {
      return { label: "En cours", color: "bg-green-600" }
    }

    // Par défaut, si a déjà commencé et pas d'infos
    return { label: "En cours", color: "bg-green-600" }
  }

  const showStatus = getShowStatus()

  return (
    <div className="min-h-screen bg-black no-horizontal-scroll">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[45vh] lg:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-16 md:-mt-24 lg:-mt-32 mobile-hero-spacing relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mobile-grid">
          {/* Poster */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden">
              <Image src={posterUrl || "/placeholder.svg"} alt={show.name} fill className="object-cover" />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              {logoImage ? (
                <div className="flex justify-center md:justify-start">
                  <img
                    src={logoImage || "/placeholder.svg"}
                    alt={show.name}
                    className="h-16 md:h-20 lg:h-24 w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <h1 className="text-xl md:text-3xl lg:text-5xl font-bold text-white leading-tight text-center md:text-left">
                  {show.name}
                </h1>
              )}

              {/* Info Bar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-medium">{show.vote_average.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(show.first_air_date).getFullYear()}</span>
                </div>
                <div>
                  <span>
                    {show.number_of_seasons} saison{show.number_of_seasons > 1 ? "s" : ""}
                  </span>
                </div>
                <div>
                  <span>{show.number_of_episodes} épisodes</span>
                </div>
                <Badge className={`${showStatus.color} text-white`}>{showStatus.label}</Badge>
                <ClassificationBadge certification={certification} />
                {/* Votes compacts */}
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
                {show.genres.map((genre: any) => (
                  <Badge key={genre.id} variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                    {genre.name}
                  </Badge>
                ))}
              </div>

              <p className="text-base md:text-xl text-gray-200 leading-relaxed text-center md:text-left">
                {show.overview}
              </p>

              {/* Watch Providers for mobile */}
              {show["watch/providers"] && (
                <div className="md:hidden space-y-4">
                  <WatchProviders providers={show["watch/providers"]} />
                  <a
                    href={`https://www.themoviedb.org/tv/${show.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0 inline-block hover:scale-105 transition-transform"
                    title="Voir sur TMDB"
                  >
                    <img
                      src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                      alt="TMDB"
                      className="w-full h-full object-contain p-1.5"
                    />
                  </a>
                </div>
              )}

              {/* Watch Providers for desktop */}
              {show["watch/providers"] && (
                <div className="hidden md:block space-y-4">
                  <WatchProviders providers={show["watch/providers"]} />
                  <a
                    href={`https://www.themoviedb.org/tv/${show.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0 inline-block hover:scale-105 transition-transform"
                    title="Voir sur TMDB"
                  >
                    <img
                      src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                      alt="TMDB"
                      className="w-full h-full object-contain p-1.5"
                    />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20 px-4 md:px-6 py-3 bg-transparent"
                  onClick={handleWatch}
                  disabled={isMarkingWatched}
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  {isMarkingWatched ? "Marquage..." : "Regarder"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/20 px-4 md:px-6 py-3 bg-transparent"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Télécharger
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/20 px-4 md:px-6 py-3 bg-transparent"
                  onClick={handleRandomEpisode}
                >
                  <Shuffle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Épisode aléatoire
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-600 text-orange-400 hover:bg-orange-900/20 px-4 md:px-6 py-3 bg-transparent"
                  onClick={handleWatchTrailer}
                >
                  <Youtube className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Bande-annonce
                </Button>
              </div>

              {/* Secondary Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
                <AddToListSelector
                  content={{
                    id: show.id,
                    name: show.name,
                    poster_path: show.poster_path,
                    vote_average: show.vote_average,
                    first_air_date: show.first_air_date,
                  }}
                  contentType="tv"
                  className="w-full sm:w-auto"
                />
                <Button
                  size="lg"
                  variant="outline"
                  className={`border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 px-4 md:px-6 py-3 ${
                    isFavorite ? "bg-yellow-900/20" : ""
                  }`}
                  onClick={handleAddToFavorites}
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 mr-2 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`}
                  />
                  {isFavorite ? "Favori" : "Favoris"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={`border-green-600 text-green-400 hover:bg-green-900/20 px-4 md:px-6 py-3 ${
                    isWatched ? "bg-green-900/20" : ""
                  }`}
                  onClick={handleMarkAsWatched}
                  disabled={isMarkingWatched}
                >
                  <Check className={`w-4 h-4 md:w-5 md:h-5 mr-2 ${isWatched ? "text-green-500" : ""}`} />
                  {isMarkingWatched ? "Marquage..." : isWatched ? "Série vue" : "Marquer série vue"}
                </Button>
              </div>

              {/* Seasons */}
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Saisons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {show.seasons
                    .filter((season: any) => season.season_number > 0)
                    .map((season: any) => (
                      <Link
                        key={season.id}
                        href={`/${isAnime ? "anime" : "tv-shows"}/${show.id}/season/${season.season_number}`}
                      >
                        <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200 border-gray-800 bg-gray-900/50">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative w-16 h-24 flex-shrink-0">
                                <Image
                                  src={
                                    season.poster_path
                                      ? `https://image.tmdb.org/t/p/w200${season.poster_path}`
                                      : "/placeholder.svg?height=120&width=80"
                                  }
                                  alt={season.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {season.name}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">{season.episode_count} épisodes</p>
                                {season.air_date && (
                                  <p className="text-sm text-gray-400">{new Date(season.air_date).getFullYear()}</p>
                                )}
                                <div className="flex items-center mt-2">
                                  <Play className="w-4 h-4 mr-1 text-blue-400" />
                                  <span className="text-sm text-blue-400">Voir les épisodes</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>

              {/* Cast */}
              {credits.cast && credits.cast.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Casting</h2>
                  <CastList cast={credits.cast} />
                </div>
              )}

              {/* Similar Shows Section */}
              {similarShows.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Séries similaires</h2>

                  <div className="mobile-slider">
                    <div className="flex gap-3 md:gap-4 pb-4 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible">
                      {similarShows.map((similarShow: any) => (
                        <Link key={similarShow.id} href={`/${isAnime ? "anime" : "tv-shows"}/${similarShow.id}`}>
                          <div className="space-y-2 group cursor-pointer w-40 md:w-auto flex-shrink-0">
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                              <Image
                                src={
                                  similarShow.poster_path
                                    ? `https://image.tmdb.org/t/p/w300${similarShow.poster_path}`
                                    : "/placeholder.svg?height=450&width=300"
                                }
                                alt={similarShow.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="(max-width: 768px) 160px, (max-width: 1200px) 25vw, 16vw"
                              />
                            </div>
                            <div className="px-1">
                              <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                                {similarShow.name}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {similarShow.first_air_date
                                  ? new Date(similarShow.first_air_date).getFullYear()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IframeModal
        isOpen={showStreamingModal}
        onClose={() => setShowStreamingModal(false)}
        src={streamingUrl}
        title={`Streaming - ${show.name}`}
      />

      <IframeModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Téléchargement - ${show.name}`}
      />

      <TrailerModal
        isOpen={showTrailerModal}
        onClose={() => setShowTrailerModal(false)}
        title={show.name}
        trailerUrl={trailerUrl}
      />
    </div>
  )
}
