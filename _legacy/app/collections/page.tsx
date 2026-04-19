"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Film, TrendingUp, Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Collection {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  parts: Array<{
    id: number
    title: string
    release_date: string
    vote_average: number
  }>
}

const ITEMS_PER_PAGE = 24

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [collections, setCollections] = useState<Collection[]>([])
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "parts" | "recent">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [tmdbPage, setTmdbPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadInitialCollections()
  }, [])

  useEffect(() => {
    filterAndSortCollections()
  }, [collections, sortBy])

  const loadInitialCollections = async () => {
    setLoading(true)
    try {
      // Search for popular collection keywords to get a variety of collections
      const searchTerms = ["collection", "saga", "series", "trilogy", "universe"]
      const allCollections: Collection[] = []
      const seenIds = new Set<number>()

      for (const term of searchTerms) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/collection?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR&query=${term}&page=1`,
          )
          if (response.ok) {
            const data = await response.json()
            for (const collection of data.results || []) {
              if (!seenIds.has(collection.id)) {
                seenIds.add(collection.id)
                // Fetch full collection details to get parts count
                try {
                  const detailResponse = await fetch(
                    `https://api.themoviedb.org/3/collection/${collection.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR`,
                  )
                  if (detailResponse.ok) {
                    const detailData = await detailResponse.json()
                    allCollections.push(detailData)
                  }
                } catch (e) {
                  // Skip if details fail
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error searching for ${term}:`, e)
        }
      }

      // Also add some known popular collections
      const popularIds = [
        10, 119, 295, 328, 404, 495, 528, 556, 645, 748, 1241, 1570, 1575, 1709, 2150, 2344, 2806, 8091, 8354, 8650,
        8917, 8945, 9485, 86311, 87359, 121938, 131292, 131295, 263, 529892, 535313, 623, 2980, 230, 448150, 173710,
        131296, 313086, 422837, 435259, 468552, 531241, 645458, 726871, 9743, 1565, 115575, 1570, 115776, 87096, 91361,
        403374, 519, 1570,
      ]

      for (const id of popularIds) {
        if (!seenIds.has(id)) {
          seenIds.add(id)
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/collection/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR`,
            )
            if (response.ok) {
              const data = await response.json()
              allCollections.push(data)
            }
          } catch (e) {
            // Skip failed collections
          }
        }
      }

      setCollections(allCollections)
      setTotalResults(allCollections.length)
    } catch (error) {
      console.error("Error loading collections:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchCollections = async (query: string) => {
    if (!query.trim()) {
      filterAndSortCollections()
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/collection?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`,
      )

      if (response.ok) {
        const data = await response.json()
        const detailedCollections: Collection[] = []

        // Fetch details for each collection to get parts
        for (const collection of data.results || []) {
          try {
            const detailResponse = await fetch(
              `https://api.themoviedb.org/3/collection/${collection.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=fr-FR`,
            )
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              detailedCollections.push(detailData)
            }
          } catch (e) {
            // Use basic data if detail fetch fails
            detailedCollections.push({
              ...collection,
              parts: [],
            })
          }
        }

        setFilteredCollections(detailedCollections)
        setTotalResults(data.total_results || detailedCollections.length)
      }
    } catch (error) {
      console.error("Error searching collections:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const filterAndSortCollections = () => {
    let filtered = [...collections]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (collection) =>
          collection.name.toLowerCase().includes(query) || collection.overview?.toLowerCase().includes(query),
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "parts":
          return (b.parts?.length || 0) - (a.parts?.length || 0)
        case "recent":
          const aDate = a.parts?.[a.parts.length - 1]?.release_date || "0"
          const bDate = b.parts?.[b.parts.length - 1]?.release_date || "0"
          return bDate.localeCompare(aDate)
        default:
          return 0
      }
    })

    setFilteredCollections(filtered)
    setCurrentPage(1)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      await searchCollections(searchQuery)
    } else {
      filterAndSortCollections()
    }
  }

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCollections = filteredCollections.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Film className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">Collections & Sagas</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Découvrez toutes les sagas et collections de films disponibles sur TMDB
          {totalResults > 0 && <span className="text-blue-400 ml-2">({totalResults} collections)</span>}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une collection sur TMDB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="name" className="text-white">
                    Nom (A-Z)
                  </SelectItem>
                  <SelectItem value="parts" className="text-white">
                    Nombre de films
                  </SelectItem>
                  <SelectItem value="recent" className="text-white">
                    Plus récent
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={searchLoading}>
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Collections Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des collections depuis TMDB...</p>
          </div>
        </div>
      ) : filteredCollections.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "Aucun résultat" : "Aucune collection"}
            </h3>
            <p className="text-gray-400 text-center">
              {searchQuery ? "Essayez avec d'autres mots-clés" : "Les collections seront bientôt disponibles"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentCollections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group h-full">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    {collection.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${collection.poster_path}`}
                        alt={collection.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Film className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Film count badge */}
                    <Badge className="absolute top-2 right-2 bg-blue-600 text-white border-0 text-xs">
                      <Film className="w-2.5 h-2.5 mr-0.5" />
                      {collection.parts?.length || 0}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-white group-hover:text-blue-400 transition-colors line-clamp-2 text-sm">
                      {collection.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => goToPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700 mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">Toutes les collections TMDB</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Explorez toutes les sagas cinématographiques disponibles sur The Movie Database (TMDB). Utilisez la
                recherche pour trouver n'importe quelle collection de films. Chaque collection regroupe tous les films
                d'une même franchise, vous permettant de suivre l'évolution des histoires et des personnages à travers
                les années.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
