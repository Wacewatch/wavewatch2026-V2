import { createClient } from "@/lib/supabase/client"

// Singleton pour éviter les synchronisations multiples
let syncInProgress = false
let lastSyncTime = 0
const SYNC_DEBOUNCE = 2000 // 2 secondes

export class DatabaseSync {
  private static supabase = createClient()

  // Sync favorites to database
  static async syncFavorites(favorites: any[]) {
    if (syncInProgress || Date.now() - lastSyncTime < SYNC_DEBOUNCE) {
      console.log("[v0] Sync debounced, skipping...")
      return
    }

    try {
      syncInProgress = true
      lastSyncTime = Date.now()

      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.log("[v0] No user logged in, skipping sync")
        return
      }

      console.log("[v0] Syncing", favorites.length, "favorites to database")

      // Get current favorites from database
      const { data: dbFavorites } = await this.supabase
        .from("user_favorites")
        .select("content_id, content_type")
        .eq("user_id", user.id)

      const dbFavoriteKeys = new Set((dbFavorites || []).map((f: any) => `${f.content_type}_${f.content_id}`))

      // Add new favorites to database
      for (const fav of favorites) {
        const key = `${fav.type}_${fav.tmdbId}`
        if (!dbFavoriteKeys.has(key)) {
          console.log("[v0] Adding favorite to DB:", fav.title)
          await this.supabase.from("user_favorites").insert({
            user_id: user.id,
            content_id: fav.tmdbId,
            content_type: fav.type,
            content_title: fav.title,
            metadata: {
              posterPath: fav.posterPath || fav.profilePath || fav.logoUrl,
              streamUrl: fav.streamUrl,
              url: fav.url,
            },
          })
        }
      }

      console.log("[v0] Favorites synced successfully")
    } catch (error: any) {
      console.error("[v0] Error syncing favorites:", error)
    } finally {
      syncInProgress = false
    }
  }

  // Sync watch history to database
  static async syncHistory(watchedItems: any[]) {
    if (syncInProgress || Date.now() - lastSyncTime < SYNC_DEBOUNCE) {
      console.log("[v0] Sync debounced, skipping...")
      return
    }

    try {
      syncInProgress = true
      lastSyncTime = Date.now()

      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.log("[v0] No user logged in, skipping sync")
        return
      }

      console.log("[v0] Syncing", watchedItems.length, "watched items to database in batch")

      const itemsToSync = watchedItems.map((item) => ({
        user_id: user.id,
        content_id: item.tmdbId,
        content_type: item.type,
        content_title: item.title,
        last_watched_at: new Date(item.watchedAt).toISOString(),
        metadata: {
          duration: item.duration,
          posterPath: item.posterPath,
          genre: item.genre,
          rating: item.rating,
          season: item.season,
          episode: item.episode,
          showId: item.showId,
        },
      }))

      if (itemsToSync.length > 0) {
        const { error } = await this.supabase.from("user_watch_history").upsert(itemsToSync, {
          onConflict: "user_id,content_id,content_type",
        })

        if (error) {
          console.error("[v0] Error syncing watch history:", error)
        } else {
          console.log("[v0] Watch history synced successfully in single batch")
        }
      }
    } catch (error: any) {
      console.error("[v0] Error syncing watch history:", error)
    } finally {
      syncInProgress = false
    }
  }

  // Load favorites from database to localStorage
  static async loadFavoritesFromDB() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return []

      console.log("[v0] Loading favorites from database")
      const { data, error } = await this.supabase.from("user_favorites").select("*").eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error loading favorites:", error)
        return []
      }

      return (
        data?.map((fav: any) => ({
          id: `${fav.content_type}_${fav.content_id}_${new Date(fav.created_at).getTime()}`,
          type: fav.content_type,
          tmdbId: fav.content_id,
          title: fav.content_title,
          addedAt: new Date(fav.created_at),
          posterPath: fav.metadata?.posterPath,
          profilePath: fav.metadata?.profilePath,
          logoUrl: fav.metadata?.logoUrl,
          streamUrl: fav.metadata?.streamUrl,
          url: fav.metadata?.url,
        })) || []
      )
    } catch (error: any) {
      console.error("[v0] Error loading favorites from DB:", error)
      return []
    }
  }

  // Load watch history from database to localStorage
  static async loadHistoryFromDB() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return []

      console.log("[v0] Loading watch history from database")
      const { data, error } = await this.supabase.from("user_watch_history").select("*").eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error loading history:", error)
        return []
      }

      return (
        data?.map((item: any) => ({
          id: `${item.content_type}_${item.content_id}_${new Date(item.last_watched_at).getTime()}`,
          type: item.content_type,
          tmdbId: item.content_id,
          title: item.content_title,
          watchedAt: new Date(item.last_watched_at),
          duration: item.metadata?.duration || 0,
          posterPath: item.metadata?.posterPath,
          genre: item.metadata?.genre,
          rating: item.metadata?.rating,
          season: item.metadata?.season,
          episode: item.metadata?.episode,
          showId: item.metadata?.showId,
        })) || []
      )
    } catch (error: any) {
      console.error("[v0] Error loading history from DB:", error)
      return []
    }
  }
}
