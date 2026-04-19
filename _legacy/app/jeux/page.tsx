"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search, Filter, Gamepad2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

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

export default function JeuxPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Tous")
  const [selectedPlatform, setSelectedPlatform] = useState("Tous")

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("is_active", true)
          .order("downloads", { ascending: false })

        if (error) throw error
        setGames(data || [])
      } catch (error) {
        console.error("Error fetching games:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  const genres = ["Tous", ...Array.from(new Set(games.map((g) => g.genre).filter(Boolean)))]
  const platforms = ["Tous", ...Array.from(new Set(games.flatMap((g) => g.platform?.split(",") || []).filter(Boolean)))]

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedGenre === "Tous" || game.genre === selectedGenre) &&
      (selectedPlatform === "Tous" || game.platform?.includes(selectedPlatform)),
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Jeux</h1>
        <p className="text-gray-300 text-base md:text-lg">
          Découvrez et téléchargez les meilleurs jeux pour toutes les plateformes
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8 border border-blue-800">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un jeu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre} className="text-white hover:bg-blue-800">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <Gamepad2 className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform} className="text-white hover:bg-blue-800">
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille des jeux */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {filteredGames.map((game) => (
          <Link key={game.id} href={`/jeux/${game.id}`}>
            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={game.cover_url || "/placeholder.svg?height=300&width=200"}
                  alt={game.title}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 right-2">
                  <div className="flex items-center bg-black/60 rounded px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-white text-xs font-medium">{game.user_rating?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-600 text-white text-xs">{game.rating}</Badge>
                </div>
              </div>

              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-white text-sm md:text-base line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {game.title}
                </CardTitle>
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

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun jeu trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
