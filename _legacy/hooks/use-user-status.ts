"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"

export interface UserStatus {
  isWatched: boolean
  isFavorite: boolean
  isInWatchlist: boolean
  rating?: string
}

export function useUserStatus(contentId: number, contentType: "movie" | "tv" | "anime") {
  const { user } = useAuth()
  const [status, setStatus] = useState<UserStatus>({
    isWatched: false,
    isFavorite: false,
    isInWatchlist: false,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id || !contentId) {
      setLoading(false)
      return
    }

    loadUserStatus()
  }, [user?.id, contentId, contentType])

  const loadUserStatus = async () => {
    if (!user?.id) return

    try {
      const [watchData, favoriteData, wishlistData, ratingData] = await Promise.all([
        supabase
          .from("user_watch_history")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .maybeSingle(),
        supabase
          .from("user_favorites")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .maybeSingle(),
        supabase
          .from("user_wishlist")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .maybeSingle(),
        supabase
          .from("user_ratings")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .maybeSingle(),
      ])

      setStatus({
        isWatched: !!watchData.data,
        isFavorite: !!favoriteData.data,
        isInWatchlist: !!wishlistData.data,
        rating: ratingData.data?.rating,
      })
    } catch (error) {
      console.error("[v0] Error loading user status:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWatched = async (contentTitle: string) => {
    if (!user?.id) return

    try {
      if (status.isWatched) {
        await supabase
          .from("user_watch_history")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
      } else {
        await supabase.from("user_watch_history").upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          content_title: contentTitle,
          progress: 100,
          watch_duration: 0,
          total_duration: 0,
          last_watched_at: new Date().toISOString(),
          metadata: {},
        })
      }

      setStatus((prev) => ({ ...prev, isWatched: !prev.isWatched }))
      window.dispatchEvent(new Event("user-data-updated"))
    } catch (error) {
      console.error("[v0] Error toggling watched status:", error)
    }
  }

  const toggleFavorite = async (contentTitle: string) => {
    if (!user?.id) return

    try {
      if (status.isFavorite) {
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
      } else {
        await supabase.from("user_favorites").upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          content_title: contentTitle,
          metadata: {},
        })
      }

      setStatus((prev) => ({ ...prev, isFavorite: !prev.isFavorite }))
      window.dispatchEvent(new Event("user-data-updated"))
    } catch (error) {
      console.error("[v0] Error toggling favorite status:", error)
    }
  }

  const toggleWatchlist = async (contentTitle: string) => {
    if (!user?.id) return

    try {
      if (status.isInWatchlist) {
        await supabase
          .from("user_wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)
      } else {
        await supabase.from("user_wishlist").upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          content_title: contentTitle,
          metadata: {},
        })
      }

      setStatus((prev) => ({ ...prev, isInWatchlist: !prev.isInWatchlist }))
      window.dispatchEvent(new Event("user-data-updated"))
    } catch (error) {
      console.error("[v0] Error toggling watchlist status:", error)
    }
  }

  const toggleRating = async (rating: "like" | "dislike", contentTitle: string) => {
    if (!user?.id) return

    try {
      const currentRating = status.rating

      if (currentRating === rating) {
        // Remove rating if clicking the same button
        await supabase
          .from("user_ratings")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .eq("content_type", contentType)

        setStatus((prev) => ({ ...prev, rating: undefined }))
      } else {
        // Add or update rating
        await supabase.from("user_ratings").upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          rating,
        })

        setStatus((prev) => ({ ...prev, rating }))
      }

      window.dispatchEvent(new Event("user-data-updated"))
    } catch (error) {
      console.error("[v0] Error toggling rating:", error)
    }
  }

  return {
    status,
    loading,
    toggleWatched,
    toggleFavorite,
    toggleWatchlist,
    toggleRating,
  }
}
