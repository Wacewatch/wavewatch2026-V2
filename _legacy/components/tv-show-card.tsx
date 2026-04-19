"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Plus, Eye, Check } from "lucide-react"
import { ContentStatusIcons } from "@/components/content-status-icons"
import { useState } from "react"
import { WatchTracker } from "@/lib/watch-tracking"
import { useAuth } from "@/components/auth-provider"
import { AddToPlaylistButton } from "@/components/add-to-playlist-button"
import { useToast } from "@/hooks/use-toast"

interface TVShowCardProps {
  show: {
    id: number
    name: string
    poster_path: string
    first_air_date: string
    vote_average: number
    genre_ids: number[]
  }
  isAnime?: boolean
  showBadges?: boolean
}

export function TVShowCard({ show, isAnime = false, showBadges = true }: TVShowCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isHovered, setIsHovered] = useState(false)
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false)
  const contentType = isAnime ? "anime" : "tv"
  const [isWatched, setIsWatched] = useState(() => WatchTracker.isWatched(contentType, show.id))

  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : "/placeholder.svg?height=750&width=500"

  const linkPath = isAnime ? `/anime/${show.id}` : `/tv-shows/${show.id}`

  const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A"

  const handleMarkAsWatched = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const currentlyWatched = WatchTracker.isWatched(contentType, show.id)

    if (currentlyWatched) {
      WatchTracker.removeFromWatched(show.id, contentType)
      setIsWatched(false)
      toast({
        title: "Retiré des vus",
        description: `"${show.name}" a été retiré de votre historique`,
      })
    } else {
      WatchTracker.markAsWatched(contentType, show.id, show.name, 45, {
        posterPath: show.poster_path,
      })
      setIsWatched(true)
      toast({
        title: "Marqué comme vu",
        description: `"${show.name}" a été ajouté à votre historique`,
      })
    }
  }

  return (
    <Link href={linkPath}>
      <Card
        className="group overflow-hidden hover:scale-105 transition-transform duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] md:aspect-[2/3]">
            <Image
              src={posterUrl || "/placeholder.svg"}
              alt={show.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

            <ContentStatusIcons
              contentId={show.id}
              contentType={contentType as "tv" | "anime"}
              contentTitle={show.name}
            />

            {user && isHovered && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition-opacity">
                <button
                  onClick={handleMarkAsWatched}
                  className={`p-3 ${isWatched ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"} rounded-full transition-colors`}
                  title={isWatched ? "Retirer des vus" : "Marquer comme vu"}
                >
                  {isWatched ? <Check className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                </button>
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowPlaylistMenu(!showPlaylistMenu)
                  }}
                >
                  <button
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                    title="Ajouter à une playlist"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {showPlaylistMenu && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <div className="bg-gray-800 rounded-lg p-4 max-w-xs w-full mx-4">
                  <AddToPlaylistButton
                    tmdbId={show.id}
                    mediaType={isAnime ? "anime" : "tv"}
                    title={show.name}
                    posterPath={show.poster_path}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPlaylistMenu(false)
                    }}
                    className="mt-2 w-full text-sm text-gray-400 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {showBadges && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/70 text-white">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {show.vote_average.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{show.name}</h3>
            <p className="text-xs text-muted-foreground">{releaseYear}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
