"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Monitor } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

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

export default function LogicielsPage() {
  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [selectedPlatform, setSelectedPlatform] = useState("Tous")
  const [selectedLicense, setSelectedLicense] = useState("Tous")

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const { data, error } = await supabase
          .from("software")
          .select("*")
          .eq("is_active", true)
          .order("downloads", { ascending: false })

        if (error) throw error
        setSoftware(data || [])
      } catch (error) {
        console.error("Error fetching software:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSoftware()
  }, [])

  const categories = ["Tous", ...Array.from(new Set(software.map((s) => s.category).filter(Boolean)))]
  const platforms = [
    "Tous",
    ...Array.from(new Set(software.flatMap((s) => s.platform?.split(",") || []).filter(Boolean))),
  ]
  const licenses = ["Tous", ...Array.from(new Set(software.map((s) => s.license).filter(Boolean)))]

  const filteredSoftware = software.filter(
    (soft) =>
      soft.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "Tous" || soft.category === selectedCategory) &&
      (selectedPlatform === "Tous" || soft.platform?.includes(selectedPlatform)) &&
      (selectedLicense === "Tous" || soft.license === selectedLicense),
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Logiciels</h1>
        <p className="text-gray-300 text-base md:text-lg">
          Téléchargez les meilleurs logiciels pour Windows, macOS et Linux
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8 border border-blue-800">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un logiciel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-blue-800/50 border-blue-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-white hover:bg-blue-800">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <Monitor className="w-4 h-4 mr-2" />
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

            <Select value={selectedLicense} onValueChange={setSelectedLicense}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {licenses.map((license) => (
                  <SelectItem key={license} value={license} className="text-white hover:bg-blue-800">
                    {license}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille des logiciels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {filteredSoftware.map((soft) => (
          <Link key={soft.id} href={`/logiciels/${soft.id}`}>
            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
              <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-800 to-blue-900 p-6 md:p-8 flex items-center justify-center aspect-square">
                <img
                  src={soft.icon_url || "/placeholder.svg?height=100&width=100"}
                  alt={soft.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-contain transition-transform duration-300 group-hover:scale-110"
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
              </div>

              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-white text-sm md:text-base line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {soft.name}
                </CardTitle>
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
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredSoftware.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun logiciel trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
