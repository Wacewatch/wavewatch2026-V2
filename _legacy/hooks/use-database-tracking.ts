"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  DatabaseTracker,
  type WatchedItem,
  type WishlistItem,
  type FavoriteItem,
  type RatingItem,
} from "@/lib/database-tracking"
import { toast } from "@/hooks/use-toast"

export function useDatabaseTracking() {
  const { user } = useAuth()
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [ratingItems, setRatingItems] = useState<RatingItem[]>([])
  const [loading, setLoading] = useState(true)

  // Charger toutes les données au montage
  useEffect(() => {
    if (user?.id) {
      loadAllData()
    } else {
      setWatchedItems([])
      setWishlistItems([])
      setFavoriteItems([])
      setRatingItems([])
      setLoading(false)
    }
  }, [user?.id])

  const loadAllData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [watched, wishlist, favorites, ratings] = await Promise.all([
        DatabaseTracker.getWatchedItems(user.id),
        DatabaseTracker.getWishlistItems(user.id),
        DatabaseTracker.getFavoriteItems(user.id),
        DatabaseTracker.getRatingItems(user.id),
      ])

      setWatchedItems(watched)
      setWishlistItems(wishlist)
      setFavoriteItems(favorites)
      setRatingItems(ratings)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // === WATCHED ITEMS ===
  const isWatched = (type: "movie" | "tv", tmdbId: number): boolean => {
    return watchedItems.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  const markAsWatched = async (
    type: "movie" | "tv" | "episode",
    tmdbId: number,
    title: string,
    duration: number,
    options?: {
      genre?: string
      season?: number
      episode?: number
      rating?: number
      posterPath?: string
      showId?: number
    },
  ) => {
    if (!user?.id) return

    try {
      await DatabaseTracker.markAsWatched(user.id, type, tmdbId, title, duration, options)
      await loadAllData() // Recharger les données

      const wasWatched = isWatched(type as "movie" | "tv", tmdbId)
      toast({
        title: wasWatched ? "Retiré des vus" : "Marqué comme vu",
        description: `${title} a été ${wasWatched ? "retiré de" : "ajouté à"} votre liste.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      })
    }
  }

  // === WISHLIST ===
  const isInWishlist = (type: "movie" | "tv", tmdbId: number): boolean => {
    return wishlistItems.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  const toggleWishlist = async (type: "movie" | "tv", tmdbId: number, title: string, posterPath?: string) => {
    if (!user?.id) return

    try {
      const added = await DatabaseTracker.toggleWishlist(user.id, type, tmdbId, title, posterPath)
      await loadAllData()

      toast({
        title: added ? "Ajouté à la wishlist" : "Retiré de la wishlist",
        description: `${title} a été ${added ? "ajouté à" : "retiré de"} votre wishlist.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la wishlist",
        variant: "destructive",
      })
    }
  }

  // === FAVORITES ===
  const isFavorite = (type: "movie" | "tv" | "tv-channel" | "radio" | "actor", tmdbId: number): boolean => {
    return favoriteItems.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  const toggleFavorite = async (
    type: "movie" | "tv" | "tv-channel" | "radio" | "actor",
    tmdbId: number,
    title: string,
    options?: {
      posterPath?: string
      profilePath?: string
      logoUrl?: string
    },
  ) => {
    if (!user?.id) return

    try {
      const added = await DatabaseTracker.toggleFavorite(user.id, type, tmdbId, title, options)
      await loadAllData()

      toast({
        title: added ? "Ajouté aux favoris" : "Retiré des favoris",
        description: `${title} a été ${added ? "ajouté à" : "retiré de"} vos favoris.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
        variant: "destructive",
      })
    }
  }

  // === RATINGS ===
  const getRating = (type: string, id: number | string): "like" | "dislike" | null => {
    const item = ratingItems.find((item) => item.type === type && item.tmdbId.toString() === id.toString())
    return item ? item.rating : null
  }

  const setRating = async (
    type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game",
    id: number | string,
    title: string,
    rating: "like" | "dislike",
    options?: {
      posterPath?: string
      logoUrl?: string
      showId?: number
      season?: number
      episode?: number
    },
  ) => {
    if (!user?.id) return

    try {
      await DatabaseTracker.setRating(user.id, type, id, title, rating, options)
      await loadAllData()

      const currentRating = getRating(type, id)
      toast({
        title: currentRating ? `${rating === "like" ? "Liké" : "Disliké"}` : "Rating retiré",
        description: `${title} - ${currentRating ? (rating === "like" ? "👍" : "👎") : "Rating supprimé"}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rating",
        variant: "destructive",
      })
    }
  }

  return {
    // Data
    watchedItems,
    wishlistItems,
    favoriteItems,
    ratingItems,
    loading,

    // Watched functions
    isWatched,
    markAsWatched,

    // Wishlist functions
    isInWishlist,
    toggleWishlist,

    // Favorites functions
    isFavorite,
    toggleFavorite,

    // Ratings functions
    getRating,
    setRating,

    // Utility
    refresh: loadAllData,
  }
}
