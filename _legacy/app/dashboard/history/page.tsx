"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import { WatchTracker } from "@/lib/watch-tracking"
import Image from "next/image"
import Link from "next/link"

export default function HistoryPage() {
  const { user } = useAuth()
  const [watchedItems, setWatchedItems] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWatchedItems(WatchTracker.getWatchedItems())
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Accès refusé</h1>
            <p className="text-gray-300">Vous devez être connecté pour accéder à cette page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Historique de visionnage</h1>
            <p className="text-gray-400">Tous vos films et épisodes regardés</p>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-blue-400" />
              Historique complet ({watchedItems.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Tous vos contenus regardés, triés par date de visionnage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {watchedItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun historique de visionnage pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {watchedItems.map((item) => {
                  let imageUrl = "/placeholder.svg?height=300&width=200"

                  if (item.posterPath) {
                    if (item.posterPath.startsWith("http")) {
                      imageUrl = item.posterPath
                    } else {
                      imageUrl = `https://image.tmdb.org/t/p/w300${item.posterPath}`
                    }
                  } else if (item.profilePath) {
                    imageUrl = `https://image.tmdb.org/t/p/w300${item.profilePath}`
                  } else if (item.logoUrl) {
                    imageUrl = item.logoUrl
                  }

                  const getItemUrl = () => {
                    if (item.type === "movie") {
                      return `/movies/${item.tmdbId}`
                    } else if (item.type === "tv") {
                      return `/tv-shows/${item.tmdbId}`
                    } else if (item.type === "episode" && item.showId) {
                      return `/tv-shows/${item.showId}`
                    }
                    return `/movies/${item.tmdbId}`
                  }

                  return (
                    <Link key={item.id} href={getItemUrl()}>
                      <div className="space-y-2 group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12.5vw"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=200"
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                              Vu
                            </Badge>
                          </div>
                          {item.duration && (
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                {Math.floor(item.duration / 60)}h {item.duration % 60}m
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(item.watchedAt).toLocaleDateString()}</p>
                          {item.type === "episode" && item.episodeNumber && (
                            <p className="text-xs text-blue-400">
                              S{item.seasonNumber}E{item.episodeNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
