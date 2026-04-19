"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Calendar, Clock, Star, ArrowLeft } from "lucide-react"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  still_path?: string
  air_date: string
  runtime?: number
  vote_average: number
}

interface Season {
  id: number
  name: string
  overview: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path?: string
  episodes?: Episode[]
}

interface SeasonDetailsProps {
  season: Season
  showId: number
  showData?: any
  isAnime?: boolean
}

export function SeasonDetails({ season, showId, showData, isAnime = false }: SeasonDetailsProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const { preferences } = useUserPreferences()

  const basePath = isAnime ? `/anime/${showId}` : `/tv-shows/${showId}`
  const episodePath = (episodeNumber: number) => `${basePath}/season/${season.season_number}/episode/${episodeNumber}`

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Link href={basePath}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{season.name}</h1>
          {showData && (
            <p className="text-sm md:text-base text-muted-foreground">
              {showData.name || showData.title} • {season.episode_count} épisodes
            </p>
          )}
        </div>
      </div>

      {/* Informations de la saison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="md:col-span-1">
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div
                className={`relative aspect-[2/3] mb-4 w-1/2 md:w-full mx-auto ${preferences.hideSpoilers ? "blur-md" : ""}`}
              >
                <Image
                  src={
                    season.poster_path
                      ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
                      : "/placeholder.svg?height=450&width=300"
                  }
                  alt={season.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, 300px"
                />
                {preferences.hideSpoilers && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
                    <p className="text-white text-center px-4 text-sm">Mode anti-spoiler activé</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {season.air_date
                      ? new Date(season.air_date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date inconnue"}
                  </span>
                </div>
                <Badge variant="secondary">{season.episode_count} épisodes</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-muted-foreground leading-relaxed ${preferences.hideSpoilers ? "blur-md select-none" : ""}`}
              >
                {season.overview || "Aucun synopsis disponible pour cette saison."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Liste des épisodes */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Épisodes</CardTitle>
        </CardHeader>
        <CardContent>
          {season.episodes && season.episodes.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {season.episodes.map((episode) => (
                <Link key={episode.id} href={episodePath(episode.episode_number)} className="block group">
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div
                      className={`relative w-full sm:w-32 md:w-40 aspect-video sm:aspect-auto sm:h-20 md:h-24 flex-shrink-0 ${preferences.hideSpoilers ? "blur-md" : ""}`}
                    >
                      <Image
                        src={
                          episode.still_path
                            ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                            : "/placeholder.svg?height=120&width=160"
                        }
                        alt={episode.name}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <Play className="h-8 w-8 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold group-hover:text-primary transition-colors text-sm md:text-base">
                            {episode.episode_number}. {episode.name}
                          </h3>
                          <p
                            className={`text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1 ${preferences.hideSpoilers ? "blur-sm select-none" : ""}`}
                          >
                            {episode.overview || "Aucun résumé disponible."}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground flex-shrink-0">
                          {episode.runtime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 md:h-4 md:w-4" />
                              <span>{episode.runtime}min</span>
                            </div>
                          )}
                          {episode.vote_average > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                              <span>{episode.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {episode.air_date && (
                        <p className="text-xs text-muted-foreground">
                          Diffusé le{" "}
                          {new Date(episode.air_date).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun épisode disponible pour cette saison.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SeasonDetails
