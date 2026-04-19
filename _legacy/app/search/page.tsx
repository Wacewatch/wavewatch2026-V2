"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MovieCard } from "@/components/movie-card"
import { TVShowCard } from "@/components/tv-show-card"
import { ActorCard } from "@/components/actor-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { searchMulti } from "@/lib/tmdb"
import { supabase } from "@/lib/supabase-client"
import { Search, Loader2, Download, BookOpen, Star, Clock, Users } from "lucide-react"
import Link from "next/link"

interface MusicContent {
  id: number
  title: string
  artist: string
  description: string
  duration: number
  release_year: number
  genre: string
  type: string
  thumbnail_url: string
  quality: string
  views: number
  is_active: boolean
}

interface Software {
  id: number
  name: string
  description: string
  version: string
  developer: string
  category: string
  platform: string
  license: string
  file_size: string
  rating: number
  downloads: number
  icon_url: string
  release_date: string
  is_active: boolean
}

interface Game {
  id: number
  title: string
  description: string
  genre: string
  platform: string
  version: string
  developer: string
  publisher: string
  file_size: string
  rating: string
  user_rating: number
  downloads: number
  cover_url: string
  release_date: string
  is_active: boolean
}

interface Ebook {
  id: number
  title: string
  author: string
  description: string
  pages: number
  publication_date: string
  category: string
  language: string
  file_format: string
  file_size: string
  rating: number
  downloads: number
  cover_url: string
  isbn: string
  publisher: string
  is_active: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [musicResults, setMusicResults] = useState<MusicContent[]>([])
  const [softwareResults, setSoftwareResults] = useState<Software[]>([])
  const [gameResults, setGameResults] = useState<Game[]>([])
  const [ebookResults, setEbookResults] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    console.log("[v0] Search page mounted, initialQuery:", initialQuery)
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      console.log("[v0] Empty query, skipping search")
      return
    }

    console.log("[v0] Performing search for:", query)
    setLoading(true)
    try {
      // Search TMDB
      console.log("[v0] Searching TMDB...")
      const tmdbData = await searchMulti(query)
      console.log("[v0] TMDB results:", tmdbData)
      setResults(tmdbData.results || [])

      // Search Music Content
      console.log("[v0] Searching music content...")
      const { data: musicData, error: musicError } = await supabase
        .from("music_content")
        .select("*")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
        .limit(20)

      if (musicError) {
        console.log("[v0] Music search error:", musicError)
      } else {
        console.log("[v0] Music results:", musicData?.length || 0)
      }
      setMusicResults(musicData || [])

      // Search Software
      console.log("[v0] Searching software...")
      const { data: softwareData, error: softwareError } = await supabase
        .from("software")
        .select("*")
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,developer.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(20)

      if (softwareError) {
        console.log("[v0] Software search error:", softwareError)
      } else {
        console.log("[v0] Software results:", softwareData?.length || 0)
      }
      setSoftwareResults(softwareData || [])

      // Search Games
      console.log("[v0] Searching games...")
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,developer.ilike.%${query}%,genre.ilike.%${query}%`)
        .limit(20)

      if (gamesError) {
        console.log("[v0] Games search error:", gamesError)
      } else {
        console.log("[v0] Games results:", gamesData?.length || 0)
      }
      setGameResults(gamesData || [])

      // Search Ebooks
      console.log("[v0] Searching ebooks...")
      const { data: ebooksData, error: ebooksError } = await supabase
        .from("ebooks")
        .select("*")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(20)

      if (ebooksError) {
        console.log("[v0] Ebooks search error:", ebooksError)
      } else {
        console.log("[v0] Ebooks results:", ebooksData?.length || 0)
      }
      setEbookResults(ebooksData || [])

      console.log("[v0] Search complete - Total results:", {
        tmdb: tmdbData.results?.length || 0,
        music: musicData?.length || 0,
        software: softwareData?.length || 0,
        games: gamesData?.length || 0,
        ebooks: ebooksData?.length || 0,
      })
    } catch (error) {
      console.error("[v0] Error searching:", error)
      setResults([])
      setMusicResults([])
      setSoftwareResults([])
      setGameResults([])
      setEbookResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery)
  }

  const filteredResults = results.filter((item) => {
    if (activeTab === "all") return true
    if (activeTab === "movies") return item.media_type === "movie"
    if (activeTab === "tvshows") return item.media_type === "tv" && !item.genre_ids?.includes(16)
    if (activeTab === "anime") return item.media_type === "tv" && item.genre_ids?.includes(16)
    if (activeTab === "people") return item.media_type === "person"
    return true
  })

  const movieResults = results.filter((item) => item.media_type === "movie")
  const tvShowResults = results.filter((item) => item.media_type === "tv" && !item.genre_ids?.includes(16))
  const animeResults = results.filter((item) => item.media_type === "tv" && item.genre_ids?.includes(16))
  const peopleResults = results.filter((item) => item.media_type === "person")

  const totalResults =
    results.length + musicResults.length + softwareResults.length + gameResults.length + ebookResults.length

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Recherche</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Films, séries, acteurs, musique, jeux, logiciels, ebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Rechercher
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-400">Recherche en cours...</p>
        </div>
      ) : (
        <>
          {totalResults > 0 ? (
            <div className="space-y-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto -mx-4 px-4 pb-2">
                  <TabsList className="inline-flex w-auto min-w-full bg-gray-800 border border-gray-700">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Tous ({totalResults})
                    </TabsTrigger>
                    <TabsTrigger
                      value="movies"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Films ({movieResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="tvshows"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Séries ({tvShowResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="anime"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Animés ({animeResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="people"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Personnes ({peopleResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="music"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Musique ({musicResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="software"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Logiciels ({softwareResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="games"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Jeux ({gameResults.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="ebooks"
                      className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
                    >
                      Ebooks ({ebookResults.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="space-y-8">
                  {movieResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Films</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {movieResults.slice(0, 6).map((movie) => (
                          <MovieCard key={movie.id} movie={movie} />
                        ))}
                      </div>
                    </div>
                  )}

                  {tvShowResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Séries TV</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {tvShowResults.slice(0, 6).map((show) => (
                          <TVShowCard key={show.id} show={show} />
                        ))}
                      </div>
                    </div>
                  )}

                  {animeResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Animés</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {animeResults.slice(0, 6).map((anime) => (
                          <TVShowCard key={anime.id} show={anime} isAnime />
                        ))}
                      </div>
                    </div>
                  )}

                  {peopleResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Personnes</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {peopleResults.slice(0, 6).map((person) => (
                          <ActorCard key={person.id} actor={person} />
                        ))}
                      </div>
                    </div>
                  )}

                  {musicResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Musique</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {musicResults.slice(0, 6).map((content) => (
                          <Link key={content.id} href={`/musique/${content.id}`}>
                            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                              <div className="relative overflow-hidden rounded-t-lg">
                                <img
                                  src={content.thumbnail_url || "/placeholder.svg?height=300&width=200"}
                                  alt={content.title}
                                  className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                                    {content.quality}
                                  </Badge>
                                </div>
                              </div>
                              <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-white text-sm line-clamp-2">{content.title}</CardTitle>
                                <p className="text-gray-400 text-xs line-clamp-1">{content.artist}</p>
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {softwareResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Logiciels</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {softwareResults.slice(0, 6).map((soft) => (
                          <Link key={soft.id} href={`/logiciels/${soft.id}`}>
                            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                              <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-800 to-blue-900 p-8 flex items-center justify-center aspect-square">
                                <img
                                  src={soft.icon_url || "/placeholder.svg?height=100&width=100"}
                                  alt={soft.name}
                                  className="w-16 h-16 object-contain"
                                />
                              </div>
                              <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-white text-sm line-clamp-2">{soft.name}</CardTitle>
                                <Badge variant="outline" className="border-blue-600 text-blue-400 text-xs w-fit">
                                  {soft.category}
                                </Badge>
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {gameResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Jeux</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {gameResults.slice(0, 6).map((game) => (
                          <Link key={game.id} href={`/jeux/${game.id}`}>
                            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                              <div className="relative overflow-hidden rounded-t-lg">
                                <img
                                  src={game.cover_url || "/placeholder.svg?height=300&width=200"}
                                  alt={game.title}
                                  className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                  <div className="flex items-center bg-black/60 rounded px-2 py-1">
                                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                    <span className="text-white text-xs">{game.user_rating?.toFixed(1) || "N/A"}</span>
                                  </div>
                                </div>
                              </div>
                              <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-white text-sm line-clamp-2">{game.title}</CardTitle>
                                <Badge variant="outline" className="border-purple-600 text-purple-400 text-xs w-fit">
                                  {game.genre}
                                </Badge>
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {ebookResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-white">Ebooks</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {ebookResults.slice(0, 6).map((book) => (
                          <Link key={book.id} href={`/ebooks/${book.id}`}>
                            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                              <div className="relative overflow-hidden rounded-t-lg">
                                <img
                                  src={book.cover_url || "/placeholder.svg?height=400&width=300"}
                                  alt={book.title}
                                  className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                  <div className="flex items-center bg-black/60 rounded px-2 py-1">
                                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                    <span className="text-white text-xs">{book.rating?.toFixed(1) || "N/A"}</span>
                                  </div>
                                </div>
                              </div>
                              <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-white text-sm line-clamp-2">{book.title}</CardTitle>
                                <p className="text-gray-400 text-xs line-clamp-1">{book.author}</p>
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="movies">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {movieResults.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tvshows">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {tvShowResults.map((show) => (
                      <TVShowCard key={show.id} show={show} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="anime">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {animeResults.map((anime) => (
                      <TVShowCard key={anime.id} show={anime} isAnime />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="people">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {peopleResults.map((person) => (
                      <ActorCard key={person.id} actor={person} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="music">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {musicResults.map((content) => (
                      <Link key={content.id} href={`/musique/${content.id}`}>
                        <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                          <div className="relative overflow-hidden rounded-t-lg">
                            <img
                              src={content.thumbnail_url || "/placeholder.svg?height=300&width=200"}
                              alt={content.title}
                              className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                                {content.quality}
                              </Badge>
                            </div>
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-purple-600 text-white text-xs">{content.type}</Badge>
                            </div>
                          </div>
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-white text-sm line-clamp-2">{content.title}</CardTitle>
                            <p className="text-gray-400 text-xs line-clamp-1">{content.artist}</p>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(content.duration)}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {content.views > 1000000
                                  ? `${(content.views / 1000000).toFixed(1)}M`
                                  : content.views > 1000
                                    ? `${(content.views / 1000).toFixed(0)}K`
                                    : content.views}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="software">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {softwareResults.map((soft) => (
                      <Link key={soft.id} href={`/logiciels/${soft.id}`}>
                        <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                          <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-800 to-blue-900 p-8 flex items-center justify-center aspect-square">
                            <img
                              src={soft.icon_url || "/placeholder.svg?height=100&width=100"}
                              alt={soft.name}
                              className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge
                                className={`${
                                  soft.license === "Gratuit"
                                    ? "bg-green-600"
                                    : soft.license === "Payant"
                                      ? "bg-red-600"
                                      : "bg-orange-600"
                                } text-white text-xs`}
                              >
                                {soft.license}
                              </Badge>
                            </div>
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center bg-black/60 rounded px-2 py-1">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span className="text-white text-xs">{soft.rating?.toFixed(1) || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-white text-sm line-clamp-2">{soft.name}</CardTitle>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className="border-blue-600 text-blue-400">
                                {soft.category}
                              </Badge>
                              <span className="text-gray-400">v{soft.version}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex items-center justify-between">
                                <span>Taille:</span>
                                <span className="text-white">{soft.file_size}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Téléchargements:</span>
                                <span className="text-white">
                                  {soft.downloads > 1000000
                                    ? `${(soft.downloads / 1000000).toFixed(1)}M`
                                    : soft.downloads > 1000
                                      ? `${(soft.downloads / 1000).toFixed(0)}K`
                                      : soft.downloads}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="games">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gameResults.map((game) => (
                      <Link key={game.id} href={`/jeux/${game.id}`}>
                        <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                          <div className="relative overflow-hidden rounded-t-lg">
                            <img
                              src={game.cover_url || "/placeholder.svg?height=300&width=200"}
                              alt={game.title}
                              className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center bg-black/60 rounded px-2 py-1">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span className="text-white text-xs">{game.user_rating?.toFixed(1) || "N/A"}</span>
                              </div>
                            </div>
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-purple-600 text-white text-xs">{game.rating}</Badge>
                            </div>
                          </div>
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-white text-sm line-clamp-2">{game.title}</CardTitle>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className="border-purple-600 text-purple-400">
                                {game.genre}
                              </Badge>
                              <span className="text-gray-400">
                                {game.release_date ? new Date(game.release_date).getFullYear() : "N/A"}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex items-center justify-between">
                                <span>Taille:</span>
                                <span className="text-white">{game.file_size}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Téléchargements:</span>
                                <span className="text-white">
                                  {game.downloads > 1000000
                                    ? `${(game.downloads / 1000000).toFixed(1)}M`
                                    : game.downloads > 1000
                                      ? `${(game.downloads / 1000).toFixed(0)}K`
                                      : game.downloads}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ebooks">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {ebookResults.map((book) => (
                      <Link key={book.id} href={`/ebooks/${book.id}`}>
                        <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
                          <div className="relative overflow-hidden rounded-t-lg">
                            <img
                              src={book.cover_url || "/placeholder.svg?height=400&width=300"}
                              alt={book.title}
                              className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-600 text-white text-xs">
                                {book.file_format?.split(",")[0]}
                              </Badge>
                            </div>
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center bg-black/60 rounded px-2 py-1">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span className="text-white text-xs">{book.rating?.toFixed(1) || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-white text-sm line-clamp-2">{book.title}</CardTitle>
                            <p className="text-gray-400 text-xs line-clamp-1">{book.author}</p>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className="border-green-600 text-green-400">
                                {book.category}
                              </Badge>
                              <span className="text-gray-400">
                                {book.publication_date ? new Date(book.publication_date).getFullYear() : "N/A"}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center">
                                <BookOpen className="w-3 h-3 mr-1" />
                                {book.pages} pages
                              </div>
                              <div className="flex items-center">
                                <Download className="w-3 h-3 mr-1" />
                                {book.downloads > 1000000
                                  ? `${(book.downloads / 1000000).toFixed(1)}M`
                                  : book.downloads > 1000
                                    ? `${(book.downloads / 1000).toFixed(0)}K`
                                    : book.downloads}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            initialQuery && (
              <div className="text-center py-12">
                <p className="text-gray-400">Aucun résultat trouvé pour "{initialQuery}"</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
