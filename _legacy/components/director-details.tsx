"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, Film } from "lucide-react"

interface DirectorDetailsProps {
  director: any
  credits: any
}

export function DirectorDetails({ director, credits }: DirectorDetailsProps) {
  const profileUrl = director.profile_path
    ? `https://image.tmdb.org/t/p/w500${director.profile_path}`
    : "/placeholder.svg?height=750&width=500"

  // Filter and sort directing credits
  const directingCredits =
    credits.crew
      ?.filter((credit: any) => credit.job === "Director" || credit.department === "Directing")
      ?.sort((a: any, b: any) => {
        const dateA = new Date(a.release_date || a.first_air_date || "")
        const dateB = new Date(b.release_date || b.first_air_date || "")
        return dateB.getTime() - dateA.getTime()
      }) || []

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue"
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Date inconnue"
    }
  }

  const calculateAge = (birthDate: string, deathDate?: string) => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const end = deathDate ? new Date(deathDate) : new Date()
    return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const age = calculateAge(director.birthday, director.deathday)

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-gray-800 bg-gray-900/80">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3]">
                  <Image src={profileUrl || "/placeholder.svg"} alt={director.name} fill className="object-cover" />
                </div>
              </CardContent>
            </Card>

            {/* Personal Info */}
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Informations personnelles</h2>

              {director.birthday && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-400">Naissance</p>
                    <p>{formatDate(director.birthday)}</p>
                    {age && <p className="text-sm text-gray-400">({age} ans)</p>}
                  </div>
                </div>
              )}

              {director.deathday && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-400">Décès</p>
                    <p>{formatDate(director.deathday)}</p>
                  </div>
                </div>
              )}

              {director.place_of_birth && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-400">Lieu de naissance</p>
                    <p>{director.place_of_birth}</p>
                  </div>
                </div>
              )}

              {director.known_for_department && (
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-400">Connu pour</p>
                    <p>{director.known_for_department}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-bold text-white">{director.name}</h1>

              {director.biography && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Biographie</h2>
                  <p className="text-lg text-gray-200 leading-relaxed">{director.biography}</p>
                </div>
              )}
            </div>

            {/* Filmography */}
            {directingCredits.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                  <Film className="w-6 h-6" />
                  Filmographie ({directingCredits.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {directingCredits.map((credit: any) => {
                    const isMovie = credit.media_type === "movie"
                    const linkPath = isMovie ? `/movies/${credit.id}` : `/tv-shows/${credit.id}`
                    const title = isMovie ? credit.title : credit.name
                    const releaseDate = credit.release_date || credit.first_air_date
                    const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A"

                    return (
                      <Link key={`${credit.id}-${credit.media_type}`} href={linkPath}>
                        <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200 border-gray-800 bg-gray-900/50">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative w-16 h-24 flex-shrink-0">
                                <Image
                                  src={
                                    credit.poster_path
                                      ? `https://image.tmdb.org/t/p/w200${credit.poster_path}`
                                      : "/placeholder.svg?height=120&width=80"
                                  }
                                  alt={title}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                                  {title}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">{year}</p>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {isMovie ? "Film" : "Série"}
                                </Badge>
                                {credit.vote_average > 0 && (
                                  <div className="flex items-center mt-2">
                                    <span className="text-yellow-400 text-sm">★</span>
                                    <span className="text-sm text-gray-400 ml-1">{credit.vote_average.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
