"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, ThumbsUp, ThumbsDown, Heart, Calendar, Film, Globe, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePublicPlaylists } from "@/hooks/use-public-playlists"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export function PublicPlaylistsDiscovery() {
  const { user } = useAuth()
  const { 
    playlists, 
    loading, 
    searchQuery, 
    setSearchQuery, 
    toggleLike, 
    toggleFavorite,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    goToPage,
    sortBy,
    setSortBy,
  } = usePublicPlaylists()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Chargement des playlists publiques...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Playlists Publiques</h2>
          <p className="text-gray-400">Découvrez les collections créées par la communauté</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
            className={sortBy === "recent" ? "bg-blue-600" : "border-gray-600 text-gray-300"}
          >
            <Clock className="w-4 h-4 mr-1" />
            Récentes
          </Button>
          <Button
            variant={sortBy === "liked" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("liked")}
            className={sortBy === "liked" ? "bg-blue-600" : "border-gray-600 text-gray-300"}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            Les plus likées
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher des playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "Aucun résultat" : "Aucune playlist publique"}
            </h3>
            <p className="text-gray-400 text-center">
              {searchQuery ? "Essayez avec d'autres mots-clés" : "Soyez le premier à créer une playlist publique !"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                <Card
                  className={`border-gray-700 hover:border-opacity-80 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    playlist.theme_color.includes("gradient") ? "animate-gradient" : ""
                  }`}
                  style={{
                    backgroundColor: playlist.theme_color.includes("gradient")
                      ? "transparent"
                      : `${playlist.theme_color}15`,
                    borderColor: playlist.theme_color,
                    boxShadow: `0 4px 20px ${playlist.theme_color}20`,
                    ...(playlist.theme_color.includes("gradient") && {
                      background: playlist.theme_color,
                      backgroundSize: "200% 200%",
                    }),
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle
                          className="text-lg line-clamp-1 hover:text-opacity-90 transition-colors font-bold"
                          title={playlist.title}
                          style={{
                            color: playlist.theme_color.includes("gradient") ? "#ffffff" : playlist.theme_color,
                            textShadow: playlist.theme_color.includes("gradient")
                              ? "2px 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.9), 1px 1px 4px rgba(0,0,0,1)"
                              : "1px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {playlist.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-4 h-4 rounded-full shadow-md"
                            style={{
                              backgroundColor: playlist.theme_color.includes("gradient")
                                ? "#ffffff"
                                : playlist.theme_color,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Creator info */}
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{
                            backgroundColor: playlist.theme_color.includes("gradient")
                              ? "rgba(255,255,255,0.3)"
                              : `${playlist.theme_color}30`,
                            color: playlist.theme_color.includes("gradient") ? "#ffffff" : playlist.theme_color,
                          }}
                        >
                          {playlist.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: playlist.theme_color.includes("gradient") ? "#ffffff" : "#e5e7eb",
                          textShadow: playlist.theme_color.includes("gradient")
                            ? "2px 2px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9)"
                            : "none",
                        }}
                      >
                        par {playlist.username}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {playlist.description && (
                      <p
                        className="text-sm line-clamp-2 font-medium"
                        style={{
                          color: playlist.theme_color.includes("gradient") ? "#ffffff" : "#e5e7eb",
                          textShadow: playlist.theme_color.includes("gradient")
                            ? "2px 2px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9)"
                            : "none",
                        }}
                      >
                        {playlist.description}
                      </p>
                    )}

                    <div
                      className="flex items-center justify-between text-sm font-medium"
                      style={{
                        color: playlist.theme_color.includes("gradient") ? "#ffffff" : "#e5e7eb",
                        textShadow: playlist.theme_color.includes("gradient")
                          ? "2px 2px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9)"
                          : "none",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Film
                            className="w-3 h-3"
                            style={{
                              color: playlist.theme_color.includes("gradient") ? "#ffffff" : playlist.theme_color,
                              filter: playlist.theme_color.includes("gradient")
                                ? "drop-shadow(2px 2px 4px rgba(0,0,0,0.95))"
                                : "none",
                            }}
                          />
                          <span>{playlist.items_count} éléments</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar
                          className="w-3 h-3"
                          style={{
                            color: playlist.theme_color.includes("gradient") ? "#ffffff" : playlist.theme_color,
                            filter: playlist.theme_color.includes("gradient")
                              ? "drop-shadow(2px 2px 4px rgba(0,0,0,0.95))"
                              : "none",
                          }}
                        />
                        <span>{new Date(playlist.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2"
                      style={{
                        borderTopColor: playlist.theme_color.includes("gradient")
                          ? "rgba(255,255,255,0.3)"
                          : playlist.theme_color,
                        borderTopWidth: "1px",
                        borderTopStyle: "solid",
                      }}
                    >
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleLike(playlist.id, true)
                          }}
                          className={`hover:text-green-400 ${playlist.is_liked ? "text-green-400" : ""}`}
                          style={{
                            color: playlist.is_liked
                              ? "#4ade80"
                              : playlist.theme_color.includes("gradient")
                                ? "#ffffff"
                                : "#9ca3af",
                            filter: playlist.theme_color.includes("gradient")
                              ? "drop-shadow(2px 2px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(0,0,0,0.9))"
                              : "none",
                          }}
                          disabled={!user}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {playlist.likes_count}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleLike(playlist.id, false)
                          }}
                          className={`hover:text-red-400 ${playlist.is_disliked ? "text-red-400" : ""}`}
                          style={{
                            color: playlist.is_disliked
                              ? "#f87171"
                              : playlist.theme_color.includes("gradient")
                                ? "#ffffff"
                                : "#9ca3af",
                            filter: playlist.theme_color.includes("gradient")
                              ? "drop-shadow(2px 2px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(0,0,0,0.9))"
                              : "none",
                          }}
                          disabled={!user}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {playlist.dislikes_count}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(playlist.id)
                        }}
                        className={`hover:text-pink-400 ${playlist.is_favorited ? "text-pink-400" : ""}`}
                        style={{
                          color: playlist.is_favorited
                            ? "#f472b6"
                            : playlist.theme_color.includes("gradient")
                              ? "#ffffff"
                              : "#9ca3af",
                          filter: playlist.theme_color.includes("gradient")
                            ? "drop-shadow(2px 2px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(0,0,0,0.9))"
                            : "none",
                        }}
                        disabled={!user}
                      >
                        <Heart className={`w-4 h-4 ${playlist.is_favorited ? "fill-current" : ""}`} />
                      </Button>
                    </div>

                    {!user && (
                      <p
                        className="text-xs text-center font-medium"
                        style={{
                          color: playlist.theme_color.includes("gradient") ? "rgba(255,255,255,0.85)" : "#d1d5db",
                          textShadow: playlist.theme_color.includes("gradient")
                            ? "2px 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)"
                            : "none",
                        }}
                      >
                        Connectez-vous pour interagir avec les playlists
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-700">
              <div className="text-sm text-gray-400 text-center sm:text-left">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} playlists
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={`min-w-[2.5rem] ${currentPage === pageNum ? "bg-blue-600" : "border-gray-600 text-gray-300 hover:bg-gray-700"}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
