"use client"

import { useState } from "react"
import { PublicPlaylistsDiscovery } from "@/components/public-playlists-discovery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, Clock, Heart } from 'lucide-react'

export default function PublicPlaylistsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "popular">("trending")

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Playlists Publiques</h1>
          <p className="text-gray-400 text-lg">Découvrez les playlists créées par la communauté WaveWatch</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher une playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sortBy === "trending" ? "default" : "outline"}
              onClick={() => setSortBy("trending")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Tendances
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Récentes
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Populaires
            </Button>
          </div>
        </div>

        {/* Playlists Grid */}
        <PublicPlaylistsDiscovery searchQuery={searchQuery} sortBy={sortBy} />
      </div>
    </div>
  )
}
