"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Clock, Users, Search, Filter } from "lucide-react"

const documentaires = [
  {
    id: 1,
    title: "Planet Earth II",
    description: "Une exploration extraordinaire de la vie sauvage dans le monde moderne",
    duration: "360 min",
    year: 2016,
    genre: "Nature",
    rating: 9.5,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    language: "Français/Anglais",
  },
  {
    id: 2,
    title: "Free Solo",
    description: "L'ascension périlleuse d'Alex Honnold sur El Capitan sans corde",
    duration: "100 min",
    year: 2018,
    genre: "Sport",
    rating: 8.2,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    language: "Français",
  },
  {
    id: 3,
    title: "Our Planet",
    description: "La beauté naturelle de notre planète et les défis du changement climatique",
    duration: "480 min",
    year: 2019,
    genre: "Nature",
    rating: 9.3,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    language: "Français/Anglais",
  },
  {
    id: 4,
    title: "The Social Dilemma",
    description: "Les dangers cachés des réseaux sociaux révélés par leurs créateurs",
    duration: "94 min",
    year: 2020,
    genre: "Technologie",
    rating: 7.6,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    language: "Français",
  },
  {
    id: 5,
    title: "Won't You Be My Neighbor?",
    description: "La vie et l'héritage de Fred Rogers, créateur de l'émission pour enfants",
    duration: "94 min",
    year: 2018,
    genre: "Biographie",
    rating: 8.4,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    language: "Français",
  },
  {
    id: 6,
    title: "Cosmos: A Spacetime Odyssey",
    description: "Un voyage à travers l'univers avec Neil deGrasse Tyson",
    duration: "780 min",
    year: 2014,
    genre: "Science",
    rating: 9.3,
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    language: "Français/Anglais",
  },
]

const genres = ["Tous", "Nature", "Science", "Histoire", "Biographie", "Sport", "Technologie", "Société"]

export default function DocumentairesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Tous")
  const [sortBy, setSortBy] = useState("rating")

  const filteredDocumentaires = documentaires
    .filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedGenre === "Tous" || doc.genre === selectedGenre),
    )
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "year") return b.year - a.year
      if (sortBy === "title") return a.title.localeCompare(b.title)
      return 0
    })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Documentaires</h1>
        <p className="text-gray-300 text-lg">
          Découvrez des documentaires fascinants sur la nature, la science, l'histoire et bien plus encore
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-blue-800">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un documentaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                <SelectItem value="rating" className="text-white hover:bg-blue-800">
                  Note
                </SelectItem>
                <SelectItem value="year" className="text-white hover:bg-blue-800">
                  Année
                </SelectItem>
                <SelectItem value="title" className="text-white hover:bg-blue-800">
                  Titre
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille des documentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocumentaires.map((doc) => (
          <Card
            key={doc.id}
            className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={doc.thumbnail || "/placeholder.svg"}
                alt={doc.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Button
                size="icon"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
              >
                <Play className="w-6 h-6" />
              </Button>
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {doc.quality}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg line-clamp-2 group-hover:text-blue-300 transition-colors">
                {doc.title}
              </CardTitle>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{doc.year}</span>
                <Badge variant="outline" className="border-blue-600 text-blue-400">
                  {doc.genre}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-gray-300 text-sm line-clamp-3 mb-4">{doc.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {doc.duration}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {doc.rating}/10
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Regarder
                </Button>
              </div>

              <div className="mt-3 text-xs text-gray-500">Langues: {doc.language}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocumentaires.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun documentaire trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
