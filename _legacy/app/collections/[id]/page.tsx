"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Film, Calendar, Star, ArrowLeft, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
}

interface Collection {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  parts: Movie[]
}

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadCollection(params.id as string)
    }
  }, [params.id])

  const loadCollection = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tmdb/collection/${id}`)
      if (response.ok) {
        const data = await response.json()
        // Sort movies by release date
        if (data.parts) {
          data.parts.sort(
            (a: Movie, b: Movie) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime(),
          )
        }
        setCollection(data)
      }
    } catch (error) {
      console.error("Error loading collection:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement de la collection...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Collection introuvable</h3>
            <p className="text-gray-400 text-center mb-4">Cette collection n'existe pas ou n'est plus disponible</p>
            <Button onClick={() => router.push("/collections")} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux collections
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[300px] md:h-[500px]">
        {collection.backdrop_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/original${collection.backdrop_path}`}
            alt={collection.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 md:-mt-48 relative z-10">
        <Button
          onClick={() => router.push("/collections")}
          variant="ghost"
          className="mb-4 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux collections
        </Button>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
          {/* Poster */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="relative w-full aspect-[2/3] md:w-64 rounded-lg overflow-hidden shadow-2xl mx-auto md:mx-0">
              {collection.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${collection.poster_path}`}
                  alt={collection.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Film className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{collection.name}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-blue-600 text-white border-0">
                <Film className="w-3 h-3 mr-1" />
                {collection.parts?.length || 0} films
              </Badge>

              {collection.parts && collection.parts.length > 0 && (
                <>
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(collection.parts[0].release_date).getFullYear()} -{" "}
                    {new Date(collection.parts[collection.parts.length - 1].release_date).getFullYear()}
                  </Badge>

                  {collection.parts[0].vote_average > 0 && (
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                      {collection.parts[0].vote_average.toFixed(1)}/10
                    </Badge>
                  )}
                </>
              )}
            </div>

            {collection.overview && (
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">{collection.overview}</p>
            )}
          </div>
        </div>
      </div>

      {/* Movies List */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Films de la collection</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
          {collection.parts?.map((movie, index) => (
            <Link key={movie.id} href={`/movies/${movie.id}`}>
              <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group h-full">
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Order badge */}
                  <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-0 text-xs">#{index + 1}</Badge>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-600 rounded-full p-3 md:p-4">
                      <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current" />
                    </div>
                  </div>
                </div>

                <CardHeader className="p-3 md:pb-3">
                  <CardTitle className="text-sm md:text-base text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                    {movie.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>

                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
