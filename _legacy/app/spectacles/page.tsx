"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Clock, Calendar, MapPin, Search, Theater, Users, Star } from "lucide-react"

const spectacles = [
  {
    id: 1,
    title: "Le Roi Lion",
    description: "La comédie musicale Disney au Théâtre Mogador",
    duration: "150 min",
    date: "2024-03-15",
    venue: "Théâtre Mogador, Paris",
    genre: "Comédie musicale",
    type: "Théâtre",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    rating: 9.2,
    cast: "Troupe internationale",
  },
  {
    id: 2,
    title: "Gad Elmaleh - D'Ailleurs",
    description: "Spectacle d'humour au Palais des Sports",
    duration: "90 min",
    date: "2024-02-20",
    venue: "Palais des Sports, Paris",
    genre: "Humour",
    type: "Stand-up",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    rating: 8.7,
    cast: "Gad Elmaleh",
  },
  {
    id: 3,
    title: "Roméo et Juliette",
    description: "Ballet de l'Opéra de Paris",
    duration: "120 min",
    date: "2024-01-10",
    venue: "Opéra Bastille, Paris",
    genre: "Ballet",
    type: "Danse",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    rating: 9.5,
    cast: "Corps de ballet de l'Opéra",
  },
  {
    id: 4,
    title: "Jamel Comedy Club",
    description: "Les nouveaux talents de l'humour",
    duration: "110 min",
    date: "2024-04-05",
    venue: "Comédie de Paris",
    genre: "Humour",
    type: "Stand-up",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    rating: 7.9,
    cast: "Divers humoristes",
  },
  {
    id: 5,
    title: "La Traviata",
    description: "Opéra de Giuseppe Verdi",
    duration: "180 min",
    date: "2023-12-08",
    venue: "Opéra Garnier, Paris",
    genre: "Opéra",
    type: "Opéra",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    rating: 9.4,
    cast: "Chœurs et orchestre de l'Opéra",
  },
  {
    id: 6,
    title: "Cirque du Soleil - Kooza",
    description: "Spectacle acrobatique extraordinaire",
    duration: "135 min",
    date: "2024-05-12",
    venue: "Chapiteau Pelouse de Reuilly",
    genre: "Cirque",
    type: "Cirque",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    rating: 9.1,
    cast: "Artistes du Cirque du Soleil",
  },
]

const genres = ["Tous", "Théâtre", "Humour", "Opéra", "Ballet", "Cirque", "Comédie musicale"]
const types = ["Tous", "Théâtre", "Stand-up", "Opéra", "Danse", "Cirque"]

export default function SpectaclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Tous")
  const [selectedType, setSelectedType] = useState("Tous")

  const filteredSpectacles = spectacles
    .filter(
      (spectacle) =>
        spectacle.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedGenre === "Tous" || spectacle.genre === selectedGenre) &&
        (selectedType === "Tous" || spectacle.type === selectedType),
    )
    .sort((a, b) => b.rating - a.rating)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Spectacles</h1>
        <p className="text-gray-300 text-lg">
          Découvrez les plus beaux spectacles : théâtre, opéra, ballet, cirque et humour
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-blue-800">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un spectacle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
                <Theater className="w-4 h-4 mr-2" />
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
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
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

      {/* Section des spectacles les mieux notés */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Star className="w-6 h-6 mr-2 text-yellow-400" />
          Les mieux notés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spectacles
            .filter((s) => s.rating >= 9.0)
            .slice(0, 3)
            .map((spectacle, index) => (
              <Card
                key={spectacle.id}
                className="bg-gradient-to-br from-yellow-900/60 to-blue-900/60 border-yellow-800 hover:border-yellow-600 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={spectacle.thumbnail || "/placeholder.svg"}
                    alt={spectacle.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-600 text-white">#{index + 1} Top</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      {spectacle.quality}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-2">{spectacle.title}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                      {spectacle.genre}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-yellow-400 font-medium">{spectacle.rating}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <Play className="w-4 h-4 mr-1" />
                    Regarder
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSpectacles.map((spectacle) => (
          <Card
            key={spectacle.id}
            className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={spectacle.thumbnail || "/placeholder.svg"}
                alt={spectacle.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Button
                size="icon"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
              >
                <Play className="w-6 h-6" />
              </Button>
              <div className="absolute top-3 left-3">
                <Badge className="bg-purple-600 text-white">{spectacle.type}</Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {spectacle.quality}
                </Badge>
              </div>
              <div className="absolute bottom-3 right-3">
                <div className="flex items-center bg-black/60 rounded px-2 py-1">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="text-white text-xs font-medium">{spectacle.rating}</span>
                </div>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg line-clamp-2 group-hover:text-blue-300 transition-colors">
                {spectacle.title}
              </CardTitle>
              <div className="flex items-center justify-between text-sm">
                <Badge variant="outline" className="border-purple-600 text-purple-400">
                  {spectacle.genre}
                </Badge>
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 mr-1" />
                  {spectacle.rating}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-gray-300 text-sm line-clamp-2 mb-4">{spectacle.description}</p>

              <div className="space-y-2 mb-4 text-xs text-gray-400">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {spectacle.duration}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(spectacle.date).toLocaleDateString("fr-FR")}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="line-clamp-1">{spectacle.venue}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="line-clamp-1">{spectacle.cast}</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Regarder
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpectacles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun spectacle trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
