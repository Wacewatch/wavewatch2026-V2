"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Film, Tv, Zap, Clock, Star, Sparkles, ChevronDown, ChevronUp, Wand2 } from "lucide-react"
import { getTrendingMovies, getTrendingTVShows, getTrendingAnime } from "@/lib/tmdb"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { getAIRecommendation } from "@/lib/ai-recommendation"
import Link from "next/link"

export function RandomContent() {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    if (isMobile !== undefined) {
      setIsExpanded(false)
    }
  }, [isMobile])

  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState({
    type: "",
    genre: "",
    duration: "",
    rating: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [error, setError] = useState("")
  const [contentCache, setContentCache] = useState<{
    movies: any[]
    tvShows: any[]
    anime: any[]
    lastFetch: number
  }>({
    movies: [],
    tvShows: [],
    anime: [],
    lastFetch: 0,
  })
  const router = useRouter()

  const contentTypes = [
    { id: "movie", label: "Films", icon: Film, color: "from-red-500 to-pink-500" },
    { id: "tv", label: "Séries", icon: Tv, color: "from-blue-500 to-cyan-500" },
    { id: "anime", label: "Anime", icon: Zap, color: "from-purple-500 to-indigo-500" },
  ]

  const genres = [
    "Action",
    "Aventure",
    "Animation",
    "Comédie",
    "Crime",
    "Documentaire",
    "Drame",
    "Famille",
    "Fantastique",
    "Histoire",
    "Horreur",
    "Musique",
    "Mystère",
    "Romance",
    "Science-Fiction",
    "Thriller",
    "Guerre",
    "Western",
  ]

  const durations = [
    { id: "short", label: "Court", icon: Clock },
    { id: "medium", label: "Moyen", icon: Clock },
    { id: "long", label: "Long", icon: Clock },
  ]

  const ratings = [
    { id: "any", label: "Peu importe", icon: Star },
    { id: "good", label: "Bien noté", icon: Star },
    { id: "excellent", label: "Excellent", icon: Star },
  ]

  const fetchContentData = async (forceRefresh = false) => {
    const now = Date.now()
    const cacheExpiry = 5 * 60 * 1000

    if (!forceRefresh && contentCache.lastFetch && now - contentCache.lastFetch < cacheExpiry) {
      return contentCache
    }

    try {
      const [moviesData, tvShowsData, animeData] = await Promise.all([
        getTrendingMovies(),
        getTrendingTVShows(),
        getTrendingAnime(),
      ])

      const newCache = {
        movies: moviesData?.results || [],
        tvShows: tvShowsData?.results || [],
        anime: animeData?.results || [],
        lastFetch: now,
      }

      setContentCache(newCache)
      return newCache
    } catch (error) {
      console.error("Error fetching content data:", error)
      return contentCache
    }
  }

  const getRandomContent = (contentArray: any[]) => {
    if (!contentArray || contentArray.length === 0) return null

    let randomIndex
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1)
      window.crypto.getRandomValues(array)
      randomIndex = array[0] % contentArray.length
    } else {
      const entropy = Date.now() + Math.random() * 1000000
      randomIndex = Math.floor(((entropy % 1000) / 1000) * contentArray.length)
    }

    return contentArray[randomIndex]
  }

  const handleAIRecommendation = async () => {
    setIsAILoading(true)
    setError("")
    try {
      const cache = await fetchContentData(true)

      const allContent = [
        ...cache.movies.map((m) => ({ ...m, type: "movie" as const })),
        ...cache.tvShows.map((t) => ({ ...t, type: "tv" as const })),
        ...cache.anime.map((a) => ({ ...a, type: "anime" as const })),
      ]

      if (allContent.length === 0) {
        throw new Error("No content available")
      }

      const randomContent = allContent[Math.floor(Math.random() * allContent.length)]

      const content = await getAIRecommendation(randomContent)

      if (content) {
        if (content.type === "movie") {
          router.push(`/movies/${content.id}`)
        } else if (content.type === "anime") {
          router.push(`/anime/${content.id}`)
        } else {
          router.push(`/tv-shows/${content.id}`)
        }
      } else {
        throw new Error("No content available")
      }
    } catch (error) {
      console.error("[v0] Error getting AI recommendation:", error)
      setError("Erreur lors de la recommandation IA. Essayez la surprise aléatoire.")
    } finally {
      setIsAILoading(false)
    }
  }

  const handleSurpriseMe = async () => {
    setIsLoading(true)
    setError("")
    try {
      const cache = await fetchContentData(true)

      const allContent = [
        ...cache.movies.map((item) => ({ ...item, type: "movie" })),
        ...cache.tvShows.map((item) => ({ ...item, type: "tv" })),
        ...cache.anime.map((item) => ({ ...item, type: "anime" })),
      ]

      if (allContent.length === 0) {
        setError("Aucun contenu disponible pour le moment.")
        return
      }

      const content = getRandomContent(allContent)

      if (content && content.id) {
        if (content.type === "movie") {
          router.push(`/movies/${content.id}`)
        } else if (content.type === "anime") {
          router.push(`/anime/${content.id}`)
        } else {
          router.push(`/tv-shows/${content.id}`)
        }
        return
      }

      setError("Aucun contenu disponible pour le moment.")
    } catch (error) {
      console.error("Error getting random content:", error)
      setError("Erreur lors de la récupération du contenu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetRecommendation = async () => {
    setIsLoading(true)
    setError("")
    try {
      const cache = await fetchContentData()
      let contentArray: any[] = []

      if (preferences.type === "movie") {
        contentArray = cache.movies
      } else if (preferences.type === "tv") {
        contentArray = cache.tvShows
      } else if (preferences.type === "anime") {
        contentArray = cache.anime
      }

      if (contentArray.length === 0) {
        setError("Aucun contenu disponible pour le moment.")
        return
      }

      const content = getRandomContent(contentArray)

      if (content && content.id) {
        if (preferences.type === "movie") {
          router.push(`/movies/${content.id}`)
        } else if (preferences.type === "anime") {
          router.push(`/anime/${content.id}`)
        } else {
          router.push(`/tv-shows/${content.id}`)
        }
        return
      }

      setError("Aucun contenu disponible pour le moment.")
    } catch (error) {
      console.error("Error getting recommendation:", error)
      setError("Erreur lors de la récupération du contenu.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetPreferences = () => {
    setStep(0)
    setPreferences({ type: "", genre: "", duration: "", rating: "" })
    setError("")
  }

  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border">
        <div
          className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
          onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl text-foreground">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Découverte Aléatoire
              <Sparkles className="h-6 w-6 text-purple-500" />
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Laissez-nous vous surprendre !</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
            className={`absolute right-0 text-muted-foreground hover:text-foreground ${isMobile ? "hidden" : ""}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="mt-2 text-destructive hover:text-destructive/80"
              >
                Fermer
              </Button>
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground text-sm md:text-base">Que voulez-vous regarder ?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.id}
                      variant="outline"
                      className="h-16 md:h-20 flex flex-col gap-2 border-border hover:bg-accent transition-all duration-300 bg-transparent"
                      onClick={() => {
                        setPreferences({ ...preferences, type: type.id })
                        setStep(1)
                        setError("")
                      }}
                    >
                      <Icon className="h-6 w-6 md:h-8 md:w-8" />
                      <span className="text-sm md:text-base font-medium">{type.label}</span>
                    </Button>
                  )
                })}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white px-8 py-3 text-base md:text-lg shadow-lg relative overflow-hidden group"
                >
                  <Link href="https://apis.wavewatch.xyz/cinematch.php" target="_blank">
                    <Film className="h-5 w-5 mr-2" />
                    CineMatch
                    <Badge className="ml-2 bg-yellow-500 text-black text-[10px] px-1.5 py-0.5">HOT</Badge>
                  </Link>
                </Button>
                <Button
                  onClick={handleAIRecommendation}
                  disabled={isAILoading}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-base md:text-lg shadow-lg"
                >
                  <Wand2 className="h-5 w-5 mr-2" />
                  {isAILoading ? (
                    <>
                      <span className="animate-pulse">Analyse IA...</span>
                    </>
                  ) : (
                    "Recommandation IA"
                  )}
                </Button>
                <Button
                  onClick={handleSurpriseMe}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-base md:text-lg shadow-lg"
                >
                  <Shuffle className="h-5 w-5 mr-2" />
                  {isLoading ? "Recherche..." : "Surprise !"}
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm md:text-base">Genre préféré ?</p>
                <Badge variant="secondary">{contentTypes.find((t) => t.id === preferences.type)?.label}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 hover:bg-accent border-border bg-transparent"
                    onClick={() => {
                      setPreferences({ ...preferences, genre })
                      setStep(2)
                      setError("")
                    }}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={resetPreferences}>
                  Retour
                </Button>
                <Button
                  onClick={() => {
                    setStep(2)
                    setError("")
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Peu importe
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm md:text-base">Durée souhaitée ?</p>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {contentTypes.find((t) => t.id === preferences.type)?.label}
                  </Badge>
                  {preferences.genre && (
                    <Badge variant="outline" className="text-xs">
                      {preferences.genre}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {durations.map((duration) => {
                  const Icon = duration.icon
                  return (
                    <Button
                      key={duration.id}
                      variant="outline"
                      className="h-12 flex items-center gap-2 hover:bg-accent border-border bg-transparent"
                      onClick={() => {
                        setPreferences({ ...preferences, duration: duration.id })
                        setStep(3)
                        setError("")
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{duration.label}</span>
                    </Button>
                  )
                })}
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button
                  onClick={() => {
                    setStep(3)
                    setError("")
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Peu importe
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm md:text-base">Note minimale ?</p>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {contentTypes.find((t) => t.id === preferences.type)?.label}
                  </Badge>
                  {preferences.genre && (
                    <Badge variant="outline" className="text-xs">
                      {preferences.genre}
                    </Badge>
                  )}
                  {preferences.duration && (
                    <Badge variant="outline" className="text-xs">
                      {durations.find((d) => d.id === preferences.duration)?.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ratings.map((rating) => {
                  const Icon = rating.icon
                  return (
                    <Button
                      key={rating.id}
                      variant="outline"
                      className="h-12 flex items-center gap-2 hover:bg-accent border-border bg-transparent"
                      onClick={() => {
                        setPreferences({ ...preferences, rating: rating.id })
                        handleGetRecommendation()
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{rating.label}</span>
                    </Button>
                  )
                })}
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button
                  onClick={handleGetRecommendation}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {isLoading ? "Recherche..." : "Ma recommandation"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
