"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TVShowCard } from "@/components/tv-show-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getGenres, searchMulti } from "@/lib/tmdb"
import { Search, Filter, RefreshCw } from 'lucide-react'

export default function TVShowsPage() {
  const [shows, setShows] = useState<any[]>([])
  const [genres, setGenres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popularity.desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [pageInput, setPageInput] = useState("") // Adding state for page input

  const platforms = [
    { id: 8, name: "Netflix" },
    { id: 119, name: "Amazon Prime Video" },
    { id: 337, name: "Disney+" },
    { id: 531, name: "Paramount+" },
    { id: 350, name: "Apple TV+" },
    { id: 1899, name: "Max" },
    { id: 2, name: "Apple iTunes" },
  ]

  useEffect(() => {
    const savedPage = sessionStorage.getItem("tvShowsPage")
    const savedGenre = sessionStorage.getItem("tvShowsGenre")
    const savedPlatform = sessionStorage.getItem("tvShowsPlatform")
    const savedSort = sessionStorage.getItem("tvShowsSort")
    const savedSearch = sessionStorage.getItem("tvShowsSearch")

    if (savedPage) setCurrentPage(Number.parseInt(savedPage))
    if (savedGenre) setSelectedGenre(savedGenre)
    if (savedPlatform) setSelectedPlatform(savedPlatform)
    if (savedSort) setSortBy(savedSort)
    if (savedSearch) setSearchQuery(savedSearch)
  }, [])

  useEffect(() => {
    sessionStorage.setItem("tvShowsPage", currentPage.toString())
    sessionStorage.setItem("tvShowsGenre", selectedGenre)
    sessionStorage.setItem("tvShowsPlatform", selectedPlatform)
    sessionStorage.setItem("tvShowsSort", sortBy)
    sessionStorage.setItem("tvShowsSearch", searchQuery)
  }, [currentPage, selectedGenre, selectedPlatform, sortBy, searchQuery])

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresData = await getGenres("tv")
        setGenres(genresData.genres)
      } catch (error) {
        console.error("Error fetching genres:", error)
      }
    }

    fetchGenres()
  }, [])

  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true)
      try {
        let data

        if (searchQuery) {
          data = await searchMulti(searchQuery, currentPage)
          data.results = data.results.filter(
            (item: any) =>
              item.media_type === "tv" && !item.genre_ids?.includes(16) && !item.genre_ids?.includes(10767),
          )
        } else {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            sort_by: sortBy,
          })

          if (selectedGenre !== "all") {
            params.append("with_genres", selectedGenre)
          }

          if (selectedPlatform !== "all") {
            params.append("with_watch_providers", selectedPlatform)
            params.append("watch_region", "FR")
          }

          const response = await fetch(`/api/content/tv-shows?${params.toString()}`)
          if (!response.ok) throw new Error("Failed to fetch TV shows")
          data = await response.json()
        }

        setShows(data.results || [])
        setTotalPages(data.total_pages || 1)
      } catch (error) {
        console.error("Error fetching TV shows:", error)
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    fetchShows()
  }, [searchQuery, selectedGenre, selectedPlatform, sortBy, currentPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value)
    setCurrentPage(1)
    setSearchQuery("")
  }

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value)
    setCurrentPage(1)
    setSearchQuery("")
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        cache: "false",
        sort_by: sortBy,
      })

      if (selectedGenre !== "all") {
        params.append("with_genres", selectedGenre)
      }

      if (selectedPlatform !== "all") {
        params.append("with_watch_providers", selectedPlatform)
        params.append("watch_region", "FR")
      }

      const response = await fetch(`/api/content/tv-shows?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to refresh TV shows")
      const data = await response.json()

      setShows(data.results || [])
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error("Error refreshing TV shows:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleGoToPage = () => { // Adding handleGoToPage function
    const page = Number.parseInt(pageInput)
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page)
      setPageInput("")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Séries TV</h1>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher des séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <Select value={selectedGenre} onValueChange={handleGenreChange}>
            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
              <Filter className="w-4 h-4 mr-2 text-blue-500" />
              <SelectValue placeholder="Tous les genres" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                Tous les genres
              </SelectItem>
              {(genres || [])
                .filter((genre) => genre.id !== 16 && genre.id !== 10767)
                .map((genre) => (
                  <SelectItem key={genre.id} value={genre.id.toString()} className="text-white hover:bg-gray-700">
                    {genre.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
              <Filter className="w-4 h-4 mr-2 text-purple-500" />
              <SelectValue placeholder="Toutes les plateformes" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                Toutes les plateformes
              </SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id.toString()} className="text-white hover:bg-gray-700">
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity.desc">Popularité ↓</SelectItem>
              <SelectItem value="vote_average.desc">Mieux notées ⭐</SelectItem>
              <SelectItem value="first_air_date.desc">Plus récentes</SelectItem>
              <SelectItem value="first_air_date.asc">Plus anciennes</SelectItem>
              <SelectItem value="vote_average.asc">Moins bien notées</SelectItem>
              <SelectItem value="name.asc">Titre A-Z</SelectItem>
              <SelectItem value="name.desc">Titre Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TV Shows Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shows.map((show) => (
              <TVShowCard key={show.id} show={show} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Précédent
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (page > totalPages) return null

                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={page === currentPage ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </span>
                <span className="text-muted-foreground">|</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  placeholder="Page..."
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGoToPage()
                  }}
                  className="w-20 h-8"
                />
                <Button size="sm" onClick={handleGoToPage} disabled={!pageInput} variant="outline">
                  Aller
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {shows.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune série trouvée.</p>
        </div>
      )}
    </div>
  )
}
