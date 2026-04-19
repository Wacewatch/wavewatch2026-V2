import { supabase } from "./supabase"

export interface WatchedItem {
  id: string
  userId: string
  type: "movie" | "tv" | "episode"
  tmdbId: number
  title: string
  duration: number
  genre?: string
  season?: number
  episode?: number
  rating?: number
  posterPath?: string
  showId?: number
  watchedAt: Date
  createdAt: Date
}

export interface WishlistItem {
  id: string
  userId: string
  type: "movie" | "tv"
  tmdbId: number
  title: string
  posterPath?: string
  addedAt: Date
  createdAt: Date
}

export interface FavoriteItem {
  id: string
  userId: string
  type: "movie" | "tv" | "tv-channel" | "radio" | "actor"
  tmdbId: number
  title: string
  posterPath?: string
  profilePath?: string
  logoUrl?: string
  addedAt: Date
  createdAt: Date
}

export interface RatingItem {
  id: string
  userId: string
  type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game"
  tmdbId: number | string
  title: string
  rating: "like" | "dislike"
  posterPath?: string
  logoUrl?: string
  showId?: number
  season?: number
  episode?: number
  ratedAt: Date
  createdAt: Date
}

export class DatabaseTracker {
  // === WATCHED ITEMS ===
  static async getWatchedItems(userId: string): Promise<WatchedItem[]> {
    try {
      const { data, error } = await supabase
        .from("watched_items")
        .select("*")
        .eq("user_id", userId)
        .order("watched_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching watched items:", error)
      return []
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
  ): Promise<boolean> {
    try {
      // Vérifier si l'item existe déjà
      const { data: existing } = await supabase
        .from("watched_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .single()

      if (existing) {
        // Si existe, le supprimer (dévalider)
        const { error } = await supabase.from("watched_items").delete().eq("id", existing.id)

        if (error) throw error
        return false // Indique qu'il a été retiré
      } else {
        // Si n'existe pas, l'ajouter
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
        return true // Indique qu'il a été ajouté
      }
    } catch (error) {
      console.error("Error marking as watched:", error)
      throw error
    }
  }

  static async isWatched(userId: string, type: "movie" | "tv", tmdbId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("watched_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return !!data
    } catch (error) {
      console.error("Error checking watched status:", error)
      return false
    }
  }

  // === WISHLIST ===
  static async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching wishlist items:", error)
      return []
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
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .single()

      if (existing) {
        const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id)
        if (error) throw error
        return false
      } else {
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
      const { data, error } = await supabase
        .from("favorite_items")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching favorite items:", error)
      return []
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
      const { data: existing } = await supabase
        .from("favorite_items")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", tmdbId)
        .single()

      if (existing) {
        const { error } = await supabase.from("favorite_items").delete().eq("id", existing.id)
        if (error) throw error
        return false
      } else {
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

  // === RATINGS ===
  static async getRatingItems(userId: string): Promise<RatingItem[]> {
    try {
      const { data, error } = await supabase
        .from("rating_items")
        .select("*")
        .eq("user_id", userId)
        .order("rated_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching rating items:", error)
      return []
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
      const { data: existing } = await supabase
        .from("rating_items")
        .select("id, rating")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("tmdb_id", id.toString())
        .single()

      if (existing) {
        if (existing.rating === rating) {
          // Si même rating, supprimer
          const { error } = await supabase.from("rating_items").delete().eq("id", existing.id)
          if (error) throw error
        } else {
          // Si rating différent, mettre à jour
          const { error } = await supabase
            .from("rating_items")
            .update({
              rating,
              rated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
          if (error) throw error
        }
      } else {
        // Créer nouveau rating
        const { error } = await supabase.from("rating_items").insert({
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
        })
        if (error) throw error
      }
    } catch (error) {
      console.error("Error setting rating:", error)
      throw error
    }
  }

  // === STATISTICS ===
  static async getStats(userId: string) {
    try {
      const [watchedItems, wishlistItems, favoriteItems, ratingItems] = await Promise.all([
        this.getWatchedItems(userId),
        this.getWishlistItems(userId),
        this.getFavoriteItems(userId),
        this.getRatingItems(userId),
      ])

      const totalWatchTime = watchedItems.reduce((sum, item) => sum + (item.duration || 0), 0)
      const moviesWatched = watchedItems.filter((item) => item.type === "movie").length
      const showsWatched = watchedItems.filter((item) => item.type === "tv").length
      const episodesWatched = watchedItems.filter((item) => item.type === "episode").length

      const totalLikes = ratingItems.filter((item) => item.rating === "like").length
      const totalDislikes = ratingItems.filter((item) => item.rating === "dislike").length

      const likesMovies = ratingItems.filter((item) => item.type === "movie" && item.rating === "like").length
      const dislikesMovies = ratingItems.filter((item) => item.type === "movie" && item.rating === "dislike").length
      const likesTVShows = ratingItems.filter((item) => item.type === "tv" && item.rating === "like").length
      const dislikesTVShows = ratingItems.filter((item) => item.type === "tv" && item.rating === "dislike").length
      const likesEpisodes = ratingItems.filter((item) => item.type === "episode" && item.rating === "like").length
      const dislikesEpisodes = ratingItems.filter((item) => item.type === "episode" && item.rating === "dislike").length
      const likesTVChannels = ratingItems.filter((item) => item.type === "tv-channel" && item.rating === "like").length
      const dislikesTVChannels = ratingItems.filter(
        (item) => item.type === "tv-channel" && item.rating === "dislike",
      ).length
      const likesRadio = ratingItems.filter((item) => item.type === "radio" && item.rating === "like").length
      const dislikesRadio = ratingItems.filter((item) => item.type === "radio" && item.rating === "dislike").length
      const likesGames = ratingItems.filter((item) => item.type === "game" && item.rating === "like").length
      const dislikesGames = ratingItems.filter((item) => item.type === "game" && item.rating === "dislike").length

      // Calcul des genres favoris
      const genreCount: { [key: string]: number } = {}
      watchedItems.forEach((item) => {
        if (item.genre) {
          genreCount[item.genre] = (genreCount[item.genre] || 0) + 1
        }
      })
      const favoriteGenre =
        Object.keys(genreCount).length > 0
          ? Object.keys(genreCount).reduce((a, b) => (genreCount[a] > genreCount[b] ? a : b))
          : "Aucun"

      // Calcul de la note moyenne
      const ratedItems = watchedItems.filter((item) => item.rating && item.rating > 0)
      const averageRating =
        ratedItems.length > 0 ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length : 0

      return {
        totalWatchTime,
        moviesWatched,
        showsWatched,
        episodesWatched,
        tvChannelsFavorites: favoriteItems.filter((item) => item.type === "tv-channel").length,
        averageRating,
        favoriteGenre,
        watchingStreak: 0, // À implémenter
        totalLikes,
        totalDislikes,
        likesMovies,
        dislikesMovies,
        likesTVShows,
        dislikesTVShows,
        likesEpisodes,
        dislikesEpisodes,
        likesTVChannels,
        dislikesTVChannels,
        likesRadio,
        dislikesRadio,
        likesGames,
        dislikesGames,
        monthlyStats: [], // À implémenter
        genreStats: Object.entries(genreCount).map(([genre, count]) => ({ genre, count })),
      }
    } catch (error) {
      console.error("Error getting stats:", error)
      return {
        totalWatchTime: 0,
        moviesWatched: 0,
        showsWatched: 0,
        episodesWatched: 0,
        tvChannelsFavorites: 0,
        averageRating: 0,
        favoriteGenre: "Aucun",
        watchingStreak: 0,
        totalLikes: 0,
        totalDislikes: 0,
        likesMovies: 0,
        dislikesMovies: 0,
        likesTVShows: 0,
        dislikesTVShows: 0,
        likesEpisodes: 0,
        dislikesEpisodes: 0,
        likesTVChannels: 0,
        dislikesTVChannels: 0,
        likesRadio: 0,
        dislikesRadio: 0,
        likesGames: 0,
        dislikesGames: 0,
        monthlyStats: [],
        genreStats: [],
      }
    }
  }

  static getInterestingFacts(stats: any): string[] {
    const facts: string[] = []

    // Faits sur le temps de visionnage
    const totalHours = Math.floor(stats.totalWatchTime / 60)
    const totalDays = Math.floor(totalHours / 24)

    if (totalDays > 0) {
      facts.push(`Vous avez passé ${totalDays} jour${totalDays > 1 ? "s" : ""} de votre vie à regarder du contenu !`)
    }

    if (totalHours > 168) {
      facts.push(
        `Avec ${totalHours}h de visionnage, vous pourriez avoir regardé la série "Lost" ${Math.floor(totalHours / 121)} fois !`,
      )
    }

    // Faits sur les films vs séries
    const totalContent = stats.moviesWatched + stats.showsWatched
    if (totalContent > 0) {
      const moviePercentage = Math.round((stats.moviesWatched / totalContent) * 100)
      if (moviePercentage > 70) {
        facts.push(`Vous êtes un vrai cinéphile ! ${moviePercentage}% de votre visionnage sont des films.`)
      } else if (moviePercentage < 30) {
        facts.push(`Vous préférez les séries ! Seulement ${moviePercentage}% de votre visionnage sont des films.`)
      }
    }

    // Faits sur les épisodes
    if (stats.episodesWatched > 100) {
      facts.push(
        `${stats.episodesWatched} épisodes regardés ! Vous pourriez avoir vu toute la série "Friends" ${Math.floor(stats.episodesWatched / 236)} fois.`,
      )
    }

    if (stats.episodesWatched > 500) {
      facts.push(
        `Avec ${stats.episodesWatched} épisodes, vous avez regardé plus d'épisodes que "The Simpsons" n'en a produit en 20 ans !`,
      )
    }

    // Faits sur les likes/dislikes
    const totalRatings = stats.totalLikes + stats.totalDislikes
    if (totalRatings > 0) {
      const likePercentage = Math.round((stats.totalLikes / totalRatings) * 100)
      if (likePercentage > 80) {
        facts.push(`Vous êtes très positif ! ${likePercentage}% de vos évaluations sont des likes.`)
      } else if (likePercentage < 40) {
        facts.push(`Vous êtes difficile à satisfaire ! Seulement ${likePercentage}% de vos évaluations sont positives.`)
      }
    }

    // Faits sur les genres
    if (stats.favoriteGenre !== "Aucun") {
      facts.push(`Votre genre favori "${stats.favoriteGenre}" représente une grande partie de votre visionnage !`)
    }

    // Faits amusants sur les statistiques
    if (stats.likesMovies > stats.likesTVShows) {
      facts.push(`Vous likez plus les films (${stats.likesMovies}) que les séries (${stats.likesTVShows}) !`)
    } else if (stats.likesTVShows > stats.likesMovies) {
      facts.push(
        `Vous préférez les séries ! ${stats.likesTVShows} likes pour les séries vs ${stats.likesMovies} pour les films.`,
      )
    }

    // Faits sur la moyenne
    if (stats.averageRating > 8) {
      facts.push(`Avec une note moyenne de ${stats.averageRating.toFixed(1)}/10, vous avez un goût excellent !`)
    } else if (stats.averageRating < 5) {
      facts.push(`Note moyenne de ${stats.averageRating.toFixed(1)}/10... Vous êtes un critique sévère !`)
    }

    // Faits sur les chaînes TV
    if (stats.likesTVChannels > 10) {
      facts.push(`${stats.likesTVChannels} chaînes TV likées ! Vous êtes un vrai zappeur professionnel.`)
    }

    // Faits sur les évaluations par type
    if (stats.likesEpisodes > stats.likesMovies + stats.likesTVShows) {
      facts.push(
        `Vous évaluez plus les épisodes individuels que les films/séries entières ! ${stats.likesEpisodes} épisodes likés.`,
      )
    }

    // Faits sur la diversité
    const contentTypes = [
      stats.likesMovies > 0 ? "films" : null,
      stats.likesTVShows > 0 ? "séries" : null,
      stats.likesTVChannels > 0 ? "chaînes TV" : null,
      stats.likesRadio > 0 ? "radios" : null,
      stats.likesGames > 0 ? "jeux" : null,
    ].filter(Boolean)

    if (contentTypes.length >= 4) {
      facts.push(`Vous êtes très éclectique ! Vous appréciez ${contentTypes.join(", ")}.`)
    }

    // Faits sur les ratios
    if (stats.totalDislikes > 0) {
      const ratio = Math.round(stats.totalLikes / stats.totalDislikes)
      if (ratio > 10) {
        facts.push(`Ratio impressionnant : ${ratio} likes pour 1 dislike ! Vous êtes très positif.`)
      } else if (ratio < 2) {
        facts.push(`Vous n'hésitez pas à dire ce que vous pensez ! Presque autant de dislikes que de likes.`)
      }
    }

    // Faits sur les totaux
    if (totalContent > 50) {
      facts.push(`${totalContent} films et séries regardés ! Vous pourriez ouvrir votre propre critique cinéma.`)
    }

    if (totalRatings > 100) {
      facts.push(`Plus de ${totalRatings} évaluations données ! Votre avis compte vraiment.`)
    }

    // Faits sur les habitudes
    if (stats.episodesWatched > stats.moviesWatched * 10) {
      facts.push(`Vous regardez beaucoup plus d'épisodes que de films ! Fan de binge-watching ?`)
    }

    // Si pas assez de données
    if (facts.length === 0) {
      facts.push("Continuez à regarder du contenu pour débloquer des statistiques amusantes!")
      facts.push("Plus vous utilisez la plateforme, plus les statistiques deviennent intéressantes.")
    }

    return facts.slice(0, 8) // Limiter à 8 faits maximum
  }
}
