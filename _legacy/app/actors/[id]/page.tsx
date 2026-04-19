import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Star, Film, Tv } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ActorFavoriteButton } from "@/components/actor-favorite-button"
import { AddToPlaylistButton } from "@/components/add-to-playlist-button"

interface Actor {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  popularity: number
  gender: number
  also_known_as: string[]
}

interface MovieCredit {
  id: number
  title: string
  character: string
  release_date: string
  poster_path: string | null
  vote_average: number
  media_type: "movie"
}

interface TVCredit {
  id: number
  name: string
  character: string
  first_air_date: string
  poster_path: string | null
  vote_average: number
  episode_count: number
  media_type: "tv"
}

type Credit = MovieCredit | TVCredit

async function fetchActorDetails(actorId: string) {
  try {
    const actorResponse = await fetch(
      `https://api.themoviedb.org/3/person/${actorId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!actorResponse.ok) {
      throw new Error("Failed to fetch actor details")
    }

    const actorData = await actorResponse.json()

    const creditsResponse = await fetch(
      `https://api.themoviedb.org/3/person/${actorId}/combined_credits?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!creditsResponse.ok) {
      throw new Error("Failed to fetch actor credits")
    }

    const creditsData = await creditsResponse.json()

    // Combine and sort credits by popularity and date
    const allCredits = [
      ...creditsData.cast.map((credit: any) => ({
        ...credit,
        media_type: credit.media_type,
      })),
    ].sort((a: any, b: any) => {
      const dateA = new Date(a.release_date || a.first_air_date || "1900-01-01")
      const dateB = new Date(b.release_date || b.first_air_date || "1900-01-01")
      return dateB.getTime() - dateA.getTime()
    })

    return { actor: actorData, credits: allCredits }
  } catch (error) {
    console.error("Erreur lors du chargement des détails de l'acteur:", error)
    return null
  }
}

export default async function ActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchActorDetails(id)

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acteur non trouvé</h1>
          <p>L'acteur que vous recherchez n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  const { actor, credits } = data

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateAge = (birthday: string | null, deathday: string | null) => {
    if (!birthday) return null
    const birth = new Date(birthday)
    const end = deathday ? new Date(deathday) : new Date()
    const age = end.getFullYear() - birth.getFullYear()
    const monthDiff = end.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  const movieCredits = credits.filter((credit) => credit.media_type === "movie") as MovieCredit[]
  const tvCredits = credits.filter((credit) => credit.media_type === "tv") as TVCredit[]
  const age = calculateAge(actor.birthday, actor.deathday)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80">
          <div className="sticky top-8">
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-4">
              <Image
                src={
                  actor.profile_path
                    ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                    : "/placeholder.svg?height=600&width=400"
                }
                alt={actor.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 320px"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <ActorFavoriteButton actor={actor} />
              </div>
              <div className="flex-1">
                <AddToPlaylistButton
                  tmdbId={actor.id}
                  mediaType="movie"
                  title={actor.name}
                  posterPath={actor.profile_path}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">{actor.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
              <Badge variant="secondary" className="bg-blue-900 text-blue-300 border-blue-700">
                {actor.known_for_department}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Popularité: {actor.popularity.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actor.birthday && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>
                    Né{actor.gender === 1 ? "e" : ""} le {formatDate(actor.birthday)}
                    {age && ` (${age} ans${actor.deathday ? " au moment du décès" : ""})`}
                  </span>
                </div>
              )}

              {actor.deathday && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>
                    Décédé{actor.gender === 1 ? "e" : ""} le {formatDate(actor.deathday)}
                  </span>
                </div>
              )}

              {actor.place_of_birth && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>{actor.place_of_birth}</span>
                </div>
              )}

              {actor.also_known_as.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-white">Aussi connu sous le nom de:</h4>
                  <div className="flex flex-wrap gap-2">
                    {actor.also_known_as.slice(0, 5).map((name, index) => (
                      <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biographie */}
          {actor.biography && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Biographie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{actor.biography}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Filmographie */}
      <Tabs defaultValue="movies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="movies"
            className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
          >
            <Film className="w-4 h-4" />
            Films ({movieCredits.length})
          </TabsTrigger>
          <TabsTrigger
            value="tv"
            className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
          >
            <Tv className="w-4 h-4" />
            Séries ({tvCredits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movies" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Filmographie</CardTitle>
              <CardDescription className="text-gray-400">Films dans lesquels {actor.name} a joué</CardDescription>
            </CardHeader>
            <CardContent>
              {movieCredits.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun film trouvé pour cet acteur.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {movieCredits.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <div className="space-y-2 group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                          <Image
                            src={
                              movie.poster_path
                                ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                                : "/placeholder.svg?height=450&width=300"
                            }
                            alt={movie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                          />
                          {movie.vote_average > 0 && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                                ⭐ {movie.vote_average.toFixed(1)}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                            {movie.title}
                          </p>
                          <p className="text-xs text-gray-400">{movie.character}</p>
                          <p className="text-xs text-gray-500">
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tv" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Séries TV</CardTitle>
              <CardDescription className="text-gray-400">Séries dans lesquelles {actor.name} a joué</CardDescription>
            </CardHeader>
            <CardContent>
              {tvCredits.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune série trouvée pour cet acteur.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {tvCredits.map((show) => (
                    <Link key={show.id} href={`/tv-shows/${show.id}`}>
                      <div className="space-y-2 group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                          <Image
                            src={
                              show.poster_path
                                ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
                                : "/placeholder.svg?height=450&width=300"
                            }
                            alt={show.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                          />
                          {show.vote_average > 0 && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                                ⭐ {show.vote_average.toFixed(1)}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                            {show.name}
                          </p>
                          <p className="text-xs text-gray-400">{show.character}</p>
                          <p className="text-xs text-gray-500">
                            {show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
