import { supabase } from "./supabase"

export interface WatchedItem {
  id: string
  type: "movie" | "tv" | "episode"
  tmdbId: number
  title: string
  duration: number
  watchedAt: Date
  genre?: string
  season?: number
  episode?: number
  rating?: number
  posterPath?: string
  showId?: number
}

export interface WishlistItem {
  id: string
  type: "movie" | "tv"
  tmdbId: number
  title: string
  addedAt: Date
  posterPath?: string
}

export interface FavoriteItem {
  id: string
  type: "movie" | "tv" | "tv-channel" | "radio" | "actor"
  tmdbId: number
  title: string
  addedAt: Date
  posterPath?: string
  profilePath?: string
  logoUrl?: string
}

export interface RatingItem {
  id: string
  type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game"
  tmdbId: number | string
  title: string
  rating: "like" | "dislike"
  ratedAt: Date
  posterPath?: string
  logoUrl?: string
  showId?: number
  season?: number
  episode?: number
}

export class DatabaseTracker {
  // Vérifier si les tables existent
  static async checkTablesExist(): Promise<boolean> {
    try {
      const { error } = await supabase.from("watched_items").select("id").limit(1)
      return !error
    } catch (error) {
      console.error("Tables do not exist:", error)
      return false
    }
  }

  // === RATINGS (LIKE/DISLIKE) ===
  static async getRatingItems(userId: string): Promise<RatingItem[]> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return []

      const { data, error } = await supabase
        .from("rating_items")
        .select("*")
        .eq("user_id", userId)
        .order("rated_at", { ascending: false })

      if (error) {
        console.error("Error fetching rating items:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          type: item.type,
          tmdbId: item.tmdb_id,
          title: item.title,
          rating: item.rating,
          ratedAt: new Date(item.rated_at),
          posterPath: item.poster_path,
          logoUrl: item.logo_url,
          showId: item.show_id,
          season: item.season,
          episode: item.episode,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching rating items:", error)
      return []
    }
  }

  static async getRating(userId: string, type: string, id: number | string): Promise<"like" | "dislike" | null> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return null

      const { data, error } = await supabase
        .from("rating_items")
        .select("rating")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", id.toString())
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching rating:", error)
        return null
      }

      return data?.rating || null
    } catch (error) {
      console.error("Error fetching rating:", error)
      return null
    }
  }

  static async setRating(
    userId: string,
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
  ): Promise<void> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) {
        throw new Error("Database tables not initialized")
      }

      const currentRating = await this.getRating(userId, type, id)

      if (currentRating === rating) {
        // Si même rating, on supprime (toggle off)
        const { error } = await supabase
          .from("rating_items")
          .delete()
          .eq("user_id", userId)
          .eq("type", type)
          .eq("tmdb_id", id.toString())

        if (error) throw error
      } else {
        // Upsert (insert ou update)
        const { error } = await supabase.from("rating_items").upsert(
          {
            user_id: userId,
            type,
            tmdb_id: id.toString(),
            title,
            rating,
            poster_path: options?.posterPath,
            logo_url: options?.logoUrl,
            show_id: options?.showId,
            season: options?.season,
            episode: options?.episode,
            rated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,type,tmdb_id",
          },
        )

        if (error) throw error
      }
    } catch (error) {
      console.error("Error setting rating:", error)
      throw error
    }
  }

  // === WATCHED ITEMS ===
  static async getWatchedItems(userId: string): Promise<WatchedItem[]> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return []

      const { data, error } = await supabase
        .from("watched_items")
        .select("*")
        .eq("user_id", userId)
        .order("watched_at", { ascending: false })

      if (error) {
        console.error("Error fetching watched items:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          type: item.type,
          tmdbId: item.tmdb_id,
          title: item.title,
          duration: item.duration,
          watchedAt: new Date(item.watched_at),
          genre: item.genre,
          season: item.season,
          episode: item.episode,
          rating: item.rating,
          posterPath: item.poster_path,
          showId: item.show_id,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching watched items:", error)
      return []
    }
  }

  static async isWatched(userId: string, type: "movie" | "tv", tmdbId: number): Promise<boolean> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return false

      const { data, error } = await supabase
        .from("watched_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking watched status:", error)
        return false
      }

      return !!data
    } catch (error) {
      console.error("Error checking watched status:", error)
      return false
    }
  }

  static async markAsWatched(
    userId: string,
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
  ): Promise<void> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) {
        throw new Error("Database tables not initialized")
      }

      const isCurrentlyWatched = await this.isWatched(userId, type as "movie" | "tv", tmdbId)

      if (isCurrentlyWatched) {
        // Supprimer si déjà marqué comme vu
        const { error } = await supabase
          .from("watched_items")
          .delete()
          .eq("user_id", userId)
          .eq("type", type)
          .eq("tmdb_id", tmdbId)

        if (error) throw error
      } else {
        // Ajouter comme vu
        const { error } = await supabase.from("watched_items").insert({
          user_id: userId,
          type,
          tmdb_id: tmdbId,
          title,
          duration,
          genre: options?.genre,
          season: options?.season,
          episode: options?.episode,
          rating: options?.rating,
          poster_path: options?.posterPath,
          show_id: options?.showId,
          watched_at: new Date().toISOString(),
        })

        if (error) throw error
      }
    } catch (error) {
      console.error("Error marking as watched:", error)
      throw error
    }
  }

  // === WISHLIST ===
  static async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return []

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })

      if (error) {
        console.error("Error fetching wishlist items:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          type: item.type,
          tmdbId: item.tmdb_id,
          title: item.title,
          addedAt: new Date(item.added_at),
          posterPath: item.poster_path,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching wishlist items:", error)
      return []
    }
  }

  static async isInWishlist(userId: string, type: "movie" | "tv", tmdbId: number): Promise<boolean> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return false

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking wishlist status:", error)
        return false
      }

      return !!data
    } catch (error) {
      console.error("Error checking wishlist status:", error)
      return false
    }
  }

  static async toggleWishlist(
    userId: string,
    type: "movie" | "tv",
    tmdbId: number,
    title: string,
    posterPath?: string,
  ): Promise<boolean> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) {
        throw new Error("Database tables not initialized")
      }

      const isCurrentlyInWishlist = await this.isInWishlist(userId, type, tmdbId)

      if (isCurrentlyInWishlist) {
        // Supprimer de la wishlist
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", userId)
          .eq("type", type)
          .eq("tmdb_id", tmdbId)

        if (error) throw error
        return false
      } else {
        // Ajouter à la wishlist
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: userId,
          type,
          tmdb_id: tmdbId,
          title,
          poster_path: posterPath,
          added_at: new Date().toISOString(),
        })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      throw error
    }
  }

  // === FAVORITES ===
  static async getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return []

      const { data, error } = await supabase
        .from("favorite_items")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })

      if (error) {
        console.error("Error fetching favorite items:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          type: item.type,
          tmdbId: item.tmdb_id,
          title: item.title,
          addedAt: new Date(item.added_at),
          posterPath: item.poster_path,
          profilePath: item.profile_path,
          logoUrl: item.logo_url,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching favorite items:", error)
      return []
    }
  }

  static async isFavorite(
    userId: string,
    type: "movie" | "tv" | "tv-channel" | "radio" | "actor",
    tmdbId: number,
  ): Promise<boolean> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) return false

      const { data, error } = await supabase
        .from("favorite_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking favorite status:", error)
        return false
      }

      return !!data
    } catch (error) {
      console.error("Error checking favorite status:", error)
      return false
    }
  }

  static async toggleFavorite(
    userId: string,
    type: "movie" | "tv" | "tv-channel" | "radio" | "actor",
    tmdbId: number,
    title: string,
    options?: {
      posterPath?: string
      profilePath?: string
      logoUrl?: string
    },
  ): Promise<boolean> {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) {
        throw new Error("Database tables not initialized")
      }

      const isCurrentlyFavorite = await this.isFavorite(userId, type, tmdbId)

      if (isCurrentlyFavorite) {
        // Supprimer des favoris
        const { error } = await supabase
          .from("favorite_items")
          .delete()
          .eq("user_id", userId)
          .eq("type", type)
          .eq("tmdb_id", tmdbId)

        if (error) throw error
        return false
      } else {
        // Ajouter aux favoris
        const { error } = await supabase.from("favorite_items").insert({
          user_id: userId,
          type,
          tmdb_id: tmdbId,
          title,
          poster_path: options?.posterPath,
          profile_path: options?.profilePath,
          logo_url: options?.logoUrl,
          added_at: new Date().toISOString(),
        })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      throw error
    }
  }
}
