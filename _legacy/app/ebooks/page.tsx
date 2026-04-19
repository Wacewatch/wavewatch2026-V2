"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Download, Star, Search, Filter, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

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

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [selectedFormat, setSelectedFormat] = useState("Tous")

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        const { data, error } = await supabase
          .from("ebooks")
          .select("*")
          .eq("is_active", true)
          .order("downloads", { ascending: false })

        if (error) throw error
        setEbooks(data || [])
      } catch (error) {
        console.error("Error fetching ebooks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEbooks()
  }, [])

  const categories = ["Tous", ...Array.from(new Set(ebooks.map((e) => e.category).filter(Boolean)))]
  const formats = [
    "Tous",
    ...Array.from(new Set(ebooks.flatMap((e) => e.file_format?.split(",") || []).filter(Boolean))),
  ]

  const filteredEbooks = ebooks.filter(
    (book) =>
      (book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory === "Tous" || book.category === selectedCategory) &&
      (selectedFormat === "Tous" || book.file_format?.includes(selectedFormat)),
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">E-books</h1>
        <p className="text-gray-300 text-base md:text-lg">
          Découvrez notre bibliothèque numérique avec des milliers d'ouvrages gratuits
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8 border border-blue-800">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un livre ou auteur..."
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

            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-full sm:w-40 bg-blue-800/50 border-blue-700 text-white">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-700">
                {formats.map((format) => (
                  <SelectItem key={format} value={format} className="text-white hover:bg-blue-800">
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille des e-books */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {filteredEbooks.map((book) => (
          <Link key={book.id} href={`/ebooks/${book.id}`}>
            <Card className="bg-blue-900/60 border-blue-800 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group h-full">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={book.cover_url || "/placeholder.svg?height=400&width=300"}
                  alt={book.title}
                  className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-600 text-white text-xs">{book.file_format?.split(",")[0]}</Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="flex items-center bg-black/60 rounded px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-white text-xs font-medium">{book.rating?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
              </div>

              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-white text-sm md:text-base line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {book.title}
                </CardTitle>
                <p className="text-gray-400 text-xs md:text-sm font-medium line-clamp-1">{book.author}</p>
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

      {filteredEbooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Aucun e-book trouvé</p>
          <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}
