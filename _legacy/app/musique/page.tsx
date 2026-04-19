"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Music, Clock, Users } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
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

export default function MusiquePage() {
  const [musicContent, setMusicContent] = useState<MusicContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Tous")
  const [selectedType, setSelectedType] = useState("Tous")

  useEffect(() => {
    const fetchMusicContent = async () => {
      try {
        const { data, error } = await supabase
          .from("music_content")
          .select("*")
          .eq("is_active", true)
          .order("views", { ascending: false })

        if (error) throw error
        setMusicContent(data || [])
      } catch (error) {
        console.error("Error fetching music content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMusicContent()
  }, [])

  // Extract unique genres and types from data
  const genres = ["Tous", ...Array.from(new Set(musicContent.map((m) => m.genre).filter(Boolean)))]
  const types = ["Tous", ...Array.from(new Set(musicContent.map((m) => m.type).filter(Boolean)))]

  const filteredContent = musicContent.filter(
    (content) =>
      (content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.artist.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedGenre === "Tous" || content.genre === selectedGenre) &&
      (selectedType === "Tous" || content.type === selectedType),
  )

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Musique</h1>
        <p className="text-gray-300 text-base md:text-lg">
          Découvrez concerts, festivals et documentaires musicaux en haute qualité
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8 border border-blue-800">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un concert, artiste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <Music className="w-4 h-4 mr-2" />
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

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {types.map((type) => (
                  <SelectItem key={type} value={type} className="text-white hover:bg-blue-800">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {filteredContent.map((content) => (
          <Link key={content.id} href={`/musique/${content.id}`}>
            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={content.thumbnail_url || "/placeholder.svg?height=300&width=200"}
                  alt={content.title}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <CardTitle className="text-white text-sm md:text-base line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {content.title}
                </CardTitle>
                <p className="text-gray-400 text-xs md:text-sm font-medium line-clamp-1">{content.artist}</p>
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

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun contenu musical trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
