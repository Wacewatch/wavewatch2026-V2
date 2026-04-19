"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Clock, Calendar, Search, Filter, Trophy, Users } from "lucide-react"

const sportsContent = [
  {
    id: 1,
    title: "Ligue 1 - PSG vs OM",
    description: "Le Classique français en direct",
    duration: "Live",
    date: "2024-01-15",
    sport: "Football",
    type: "Live",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    viewers: "2.3M",
  },
  {
    id: 2,
    title: "NBA Finals 2023",
    description: "Les meilleurs moments des finales NBA",
    duration: "240 min",
    date: "2023-06-15",
    sport: "Basketball",
    type: "Replay",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    viewers: "1.8M",
  },
  {
    id: 3,
    title: "Roland Garros 2024",
    description: "Finale hommes en direct",
    duration: "Live",
    date: "2024-06-09",
    sport: "Tennis",
    type: "Live",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    viewers: "5.2M",
  },
  {
    id: 4,
    title: "Formule 1 - GP de Monaco",
    description: "Le Grand Prix le plus prestigieux",
    duration: "180 min",
    date: "2024-05-26",
    sport: "F1",
    type: "Replay",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "4K Ultra HD",
    viewers: "3.1M",
  },
  {
    id: 5,
    title: "Champions League",
    description: "Real Madrid vs Manchester City",
    duration: "120 min",
    date: "2024-04-17",
    sport: "Football",
    type: "Replay",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    viewers: "4.7M",
  },
  {
    id: 6,
    title: "Tour de France 2024",
    description: "Étape des Alpes en direct",
    duration: "Live",
    date: "2024-07-15",
    sport: "Cyclisme",
    type: "Live",
    thumbnail: "/placeholder.svg?height=300&width=200",
    quality: "HD",
    viewers: "892K",
  },
]

const sports = ["Tous", "Football", "Basketball", "Tennis", "F1", "Cyclisme", "Rugby", "Baseball"]
const types = ["Tous", "Live", "Replay", "Highlights"]

export default function SportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState("Tous")
  const [selectedType, setSelectedType] = useState("Tous")

  const filteredContent = sportsContent.filter(
    (content) =>
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedSport === "Tous" || content.sport === selectedSport) &&
      (selectedType === "Tous" || content.type === selectedType),
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Sport</h1>
        <p className="text-gray-300 text-lg">
          Suivez vos sports favoris en direct ou en replay avec la meilleure qualité
        </p>
      </div>

      {/* Section Live */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="text-2xl font-bold text-white">En Direct</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sportsContent
            .filter((content) => content.type === "Live")
            .map((content) => (
              <Card
                key={content.id}
                className="bg-gradient-to-br from-red-900/60 to-blue-900/60 border-red-800 hover:border-red-600 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={content.thumbnail || "/placeholder.svg"}
                    alt={content.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge className="bg-red-600 text-white animate-pulse">🔴 LIVE</Badge>
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      {content.quality}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="outline" className="border-white text-white bg-black/60">
                      <Users className="w-3 h-3 mr-1" />
                      {content.viewers}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-2">{content.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{content.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-blue-600 text-blue-400">
                      {content.sport}
                    </Badge>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <Play className="w-4 h-4 mr-1" />
                      Regarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-blue-800">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un événement sportif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
                <Trophy className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport} className="text-white hover:bg-blue-800">
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 bg-blue-800/50 border-blue-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredContent.map((content) => (
          <Card
            key={content.id}
            className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={content.thumbnail || "/placeholder.svg"}
                alt={content.title}
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
                {content.type === "Live" ? (
                  <Badge className="bg-red-600 text-white animate-pulse">🔴 LIVE</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {content.type}
                  </Badge>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {content.quality}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg line-clamp-2 group-hover:text-blue-300 transition-colors">
                {content.title}
              </CardTitle>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <Badge variant="outline" className="border-blue-600 text-blue-400">
                  {content.sport}
                </Badge>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {content.viewers}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-gray-300 text-sm line-clamp-2 mb-4">{content.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(content.date).toLocaleDateString("fr-FR")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {content.duration}
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                {content.type === "Live" ? "Regarder en direct" : "Regarder"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun contenu sportif trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
