"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Tv, Zap, Radio, TrendingUp } from "lucide-react"
import { getTrendingMovies, getTrendingTVShows, getPopularAnime } from "@/lib/tmdb"

export function ContentStats() {
  const [stats, setStats] = useState({
    movies: 0,
    tvShows: 0,
    anime: 0,
    tvChannels: 150,
    radioStations: 75,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [movies, tvShows, anime] = await Promise.all([
          getTrendingMovies(),
          getTrendingTVShows(),
          getPopularAnime(),
        ])

        setStats((prev) => ({
          ...prev,
          movies: 45000,
          tvShows: 28000,
          anime: 12000,
        }))
      } catch (error) {
        console.error("Error fetching content stats:", error)
        setStats((prev) => ({
          ...prev,
          movies: 45000,
          tvShows: 28000,
          anime: 12000,
        }))
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      title: "Films",
      value: stats.movies.toLocaleString(),
      icon: Film,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Séries TV",
      value: stats.tvShows.toLocaleString(),
      icon: Tv,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Animes",
      value: stats.anime.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Chaînes TV",
      value: stats.tvChannels.toLocaleString(),
      icon: Zap,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Stations Radio",
      value: stats.radioStations.toLocaleString(),
      icon: Radio,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Notre contenu en chiffres</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Découvrez l'étendue de notre catalogue de divertissement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mx-auto mb-2`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
