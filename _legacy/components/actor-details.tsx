"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Star, Film, Tv } from "lucide-react"

interface ActorDetailsProps {
  person: any
  credits: any
}

export function ActorDetails({ person, credits }: ActorDetailsProps) {
  const profileUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : "/placeholder.svg?height=750&width=500"

  const movies = credits.cast?.filter((item: any) => item.media_type === "movie") || []
  const tvShows = credits.cast?.filter((item: any) => item.media_type === "tv") || []

  const sortedMovies = movies.sort((a: any, b: any) => {
    const dateA = new Date(a.release_date || "1900-01-01")
    const dateB = new Date(b.release_date || "1900-01-01")
    return dateB.getTime() - dateA.getTime()
  })

  const sortedTVShows = tvShows.sort((a: any, b: any) => {
    const dateA = new Date(a.first_air_date || "1900-01-01")
    const dateB = new Date(b.first_air_date || "1900-01-01")
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-gray-800 bg-gray-900/80">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3]">
                  <Image src={profileUrl || "/placeholder.svg"} alt={person.name} fill className="object-cover" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-bold text-white">{person.name}</h1>

              {/* Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                {person.birthday && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(person.birthday).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
                <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                  {person.known_for_department}
                </Badge>
              </div>

              {person.biography && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Biographie</h2>
                  <p className="text-lg text-gray-200 leading-relaxed">{person.biography}</p>
                </div>
              )}

              {/* Movies */}
              {sortedMovies.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Film className="w-6 h-6" />
                    Films ({sortedMovies.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedMovies.slice(0, 20).map((movie: any) => (
                      <Link key={movie.id} href={`/movies/${movie.id}`}>
                        <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200 border-gray-800 bg-gray-900/50">
                          <CardContent className="p-0">
                            <div className="relative aspect-[2/3]">
                              <Image
                                src={
                                  movie.poster_path
                                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                                    : "/placeholder.svg?height=450&width=300"
                                }
                                alt={movie.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                              {movie.vote_average > 0 && (
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                    {movie.vote_average.toFixed(1)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">{movie.title}</h3>
                              <p className="text-xs text-gray-400">
                                {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                              </p>
                              {movie.character && (
                                <p className="text-xs text-gray-500 line-clamp-1">{movie.character}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* TV Shows */}
              {sortedTVShows.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Tv className="w-6 h-6" />
                    Séries TV ({sortedTVShows.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedTVShows.slice(0, 20).map((show: any) => (
                      <Link key={show.id} href={`/tv-shows/${show.id}`}>
                        <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200 border-gray-800 bg-gray-900/50">
                          <CardContent className="p-0">
                            <div className="relative aspect-[2/3]">
                              <Image
                                src={
                                  show.poster_path
                                    ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
                                    : "/placeholder.svg?height=450&width=300"
                                }
                                alt={show.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                              {show.vote_average > 0 && (
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                    {show.vote_average.toFixed(1)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">{show.name}</h3>
                              <p className="text-xs text-gray-400">
                                {show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A"}
                              </p>
                              {show.character && <p className="text-xs text-gray-500 line-clamp-1">{show.character}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
