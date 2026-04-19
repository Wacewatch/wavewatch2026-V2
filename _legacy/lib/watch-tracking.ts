export interface WatchedItem {
  id: string
  type: "movie" | "tv" | "episode"
  tmdbId: number | string
  title: string
  duration: number // en minutes
  watchedAt: Date
  genre?: string
  season?: number
  episode?: number
  rating?: number
  posterPath?: string
  showId?: number // Pour les épisodes, ID de la série parente
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
  type: "movie" | "tv" | "tv-channel" | "radio" | "actor" | "playlist" | "game"
  tmdbId: number
  title: string
  addedAt: Date
  posterPath?: string
  profilePath?: string // pour les acteurs
  logoUrl?: string // pour les chaînes/radio/jeux
  streamUrl?: string // pour les chaînes TV et radios
  url?: string // pour les jeux rétro
}

export interface RatingItem {
  id: string
  type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game" | "playlist"
  tmdbId: number | string // string pour les jeux/chaînes custom et playlists
  title: string
  rating: "like" | "dislike"
  ratedAt: Date
  posterPath?: string
  logoUrl?: string
  showId?: number // Pour les épisodes
  season?: number
  episode?: number
}

export interface WatchStats {
  totalWatchTime: number // en minutes
  moviesWatched: number
  showsWatched: number
  episodesWatched: number
  tvChannelsFavorites: number
  averageRating: number
  favoriteGenre: string
  watchingStreak: number
  totalLikes: number
  totalDislikes: number
  likesMovies: number
  dislikesMovies: number
  likesTVShows: number
  dislikesTVShows: number
  likesEpisodes: number
  dislikesEpisodes: number
  likesTVChannels: number
  dislikesTVChannels: number
  likesRadio: number
  dislikesRadio: number
  likesGames: number
  dislikesGames: number
  likesPlaylists: number
  dislikesPlaylists: number
  monthlyStats: { month: string; minutes: number }[]
  genreStats: { genre: string; count: number; minutes: number }[]
}

// SMIC horaire en France (approximatif)
const SMIC_HOURLY = 11.27

export class WatchTracker {
  private static STORAGE_KEY_WATCHED = "wavewatch_watched_items"
  private static STORAGE_KEY_WISHLIST = "wavewatch_wishlist_items"
  private static STORAGE_KEY_FAVORITES = "wavewatch_favorite_items"
  private static STORAGE_KEY_RATINGS = "wavewatch_rating_items"

  private static async triggerSync(type: "favorites" | "history") {
    if (typeof window === "undefined") return

    // Import dynamique pour éviter les erreurs SSR
    const { DatabaseSync } = await import("@/lib/database-sync")

    if (type === "favorites") {
      const favorites = this.getFavoriteItems()
      await DatabaseSync.syncFavorites(favorites)
    } else if (type === "history") {
      const history = this.getWatchedItems()
      await DatabaseSync.syncHistory(history)
    }
  }

  // === RATINGS (LIKE/DISLIKE) ===
  static getRatingItems(): RatingItem[] {
    if (typeof window === "undefined") return []
    try {
      const items = localStorage.getItem(this.STORAGE_KEY_RATINGS)
      return items
        ? JSON.parse(items)
            .map((item: any) => ({
              ...item,
              ratedAt: new Date(item.ratedAt),
            }))
            .sort((a: RatingItem, b: RatingItem) => b.ratedAt.getTime() - a.ratedAt.getTime())
        : []
    } catch {
      return []
    }
  }

  static getRating(type: string, id: number | string): "like" | "dislike" | null {
    const items = this.getRatingItems()
    const item = items.find((item) => item.type === type && item.tmdbId === id)
    return item ? item.rating : null
  }

  static setRating(
    type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game" | "playlist",
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
  ): void {
    if (typeof window === "undefined") return

    const items = this.getRatingItems()
    const existingIndex = items.findIndex((item) => item.type === type && item.tmdbId === id)

    if (existingIndex >= 0) {
      if (items[existingIndex].rating === rating) {
        // Si même rating, on supprime (toggle off)
        items.splice(existingIndex, 1)
      } else {
        // Sinon on change le rating
        items[existingIndex].rating = rating
        items[existingIndex].ratedAt = new Date()
      }
    } else {
      // Nouveau rating
      const newItem: RatingItem = {
        id: `${type}_${id}_${Date.now()}`,
        type,
        tmdbId: id,
        title,
        rating,
        ratedAt: new Date(),
        ...options,
      }
      items.push(newItem)
    }

    localStorage.setItem(this.STORAGE_KEY_RATINGS, JSON.stringify(items))
    window.dispatchEvent(new Event("watchlist-updated"))
  }

  static toggleLike(
    type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game" | "playlist",
    id: number | string,
    title: string,
    options?: {
      posterPath?: string
      logoUrl?: string
      showId?: number
      season?: number
      episode?: number
    },
  ): "like" | null {
    const currentRating = this.getRating(type, id)
    if (currentRating === "like") {
      // Déjà liké, on supprime
      this.setRating(type, id, title, "like", options)
      return null
    } else {
      // Pas liké ou disliké, on like
      this.setRating(type, id, title, "like", options)
      return "like"
    }
  }

  static toggleDislike(
    type: "movie" | "tv" | "episode" | "tv-channel" | "radio" | "game" | "playlist",
    id: number | string,
    title: string,
    options?: {
      posterPath?: string
      logoUrl?: string
      showId?: number
      season?: number
      episode?: number
    },
  ): "dislike" | null {
    const currentRating = this.getRating(type, id)
    if (currentRating === "dislike") {
      // Déjà disliké, on supprime
      this.setRating(type, id, title, "dislike", options)
      return null
    } else {
      // Pas disliké ou liké, on dislike
      this.setRating(type, id, title, "dislike", options)
      return "dislike"
    }
  }

  // === WATCHED ITEMS ===
  static getWatchedItems(): WatchedItem[] {
    if (typeof window === "undefined") return []
    try {
      const items = localStorage.getItem(this.STORAGE_KEY_WATCHED)
      return items
        ? JSON.parse(items)
            .map((item: any) => ({
              ...item,
              watchedAt: new Date(item.watchedAt),
            }))
            .sort((a: WatchedItem, b: WatchedItem) => b.watchedAt.getTime() - a.watchedAt.getTime())
        : []
    } catch {
      return []
    }
  }

  static isWatched(type: "movie" | "tv" | "episode", tmdbId: number | string): boolean {
    const items = this.getWatchedItems()

    if (type === "episode") {
      // For episodes, check using the composite ID format
      const parts = typeof tmdbId === "string" ? tmdbId.split("-") : []
      if (parts.length === 3) {
        const [showId, season, episode] = parts.map(Number)
        return items.some(
          (item) =>
            item.type === "episode" && item.showId === showId && item.season === season && item.episode === episode,
        )
      }
    }

    return items.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  static isEpisodeWatched(showId: number, season: number, episode: number): boolean {
    const items = this.getWatchedItems()
    return items.some(
      (item) => item.type === "episode" && item.showId === showId && item.season === season && item.episode === episode,
    )
  }

  static markAsWatched(
    type: "movie" | "tv" | "episode",
    tmdbId: number | string,
    title: string,
    duration: number,
    options?: {
      genre?: string
      season?: number
      episode?: number
      rating?: number
      posterPath?: string
      showId?: number
      seasons?: any[]
      showName?: string
    },
  ): void {
    if (typeof window === "undefined") return

    const items = this.getWatchedItems()

    if (type === "tv") {
      console.log("[v0] Marking/unmarking entire series:", title)

      const isCurrentlyWatched = items.some((item) => item.type === "tv" && item.tmdbId === tmdbId)

      if (isCurrentlyWatched) {
        console.log("[v0] Unmarking series and all episodes")

        // Remove all episodes of this series
        const filteredItems = items.filter((item) => {
          if (
            item.type === "episode" &&
            item.showId === (typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId)
          ) {
            return false
          }
          if (item.type === "tv" && item.tmdbId === tmdbId) {
            return false
          }
          return true
        })

        localStorage.setItem(this.STORAGE_KEY_WATCHED, JSON.stringify(filteredItems))
        window.dispatchEvent(new Event("watchlist-updated"))
        return
      }

      if (options?.seasons && options.seasons.length > 0) {
        // Mark all episodes from all seasons
        options.seasons.forEach((season: any) => {
          if (season.episodes && season.episodes.length > 0) {
            season.episodes.forEach((episode: any) => {
              const episodeId = `${tmdbId}-${season.season_number}-${episode.episode_number}`
              const existingEpisodeIndex = items.findIndex(
                (item) =>
                  item.type === "episode" &&
                  item.showId === (typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId) &&
                  item.season === season.season_number &&
                  item.episode === episode.episode_number,
              )

              if (existingEpisodeIndex === -1) {
                const episodeItem: WatchedItem = {
                  id: `episode_${episodeId}_${Date.now()}_${Math.random()}`,
                  type: "episode",
                  tmdbId: typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId,
                  title: `${title} - S${season.season_number}E${episode.episode_number}`,
                  duration: episode.runtime || 45,
                  watchedAt: new Date(),
                  posterPath: options?.posterPath,
                  season: season.season_number,
                  episode: episode.episode_number,
                  genre: options?.genre,
                  rating: options?.rating,
                  showId: typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId,
                }
                items.push(episodeItem)
              }
            })
          }
        })
        console.log("[v0] Marked all episodes as watched")
      }

      // Also mark the series itself
      const existingSeriesIndex = items.findIndex((item) => item.type === "tv" && item.tmdbId === tmdbId)
      if (existingSeriesIndex === -1) {
        const seriesItem: WatchedItem = {
          id: `tv_${tmdbId}_${Date.now()}`,
          type: "tv",
          tmdbId: typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId,
          title,
          duration: duration,
          watchedAt: new Date(),
          posterPath: options?.posterPath,
          genre: options?.genre,
          rating: options?.rating,
        }
        items.push(seriesItem)
      }
    } else if (type === "episode") {
      // For individual episodes, use the provided ID format
      const episodeId =
        typeof tmdbId === "string" ? tmdbId : `${options?.showId}-${options?.season}-${options?.episode}`
      const existingIndex = items.findIndex(
        (item) =>
          item.type === "episode" &&
          item.showId === options?.showId &&
          item.season === options?.season &&
          item.episode === options?.episode,
      )

      if (existingIndex >= 0) {
        items.splice(existingIndex, 1)
        console.log("Episode removed from watched")
      } else {
        const newItem: WatchedItem = {
          id: `episode_${episodeId}_${Date.now()}`,
          type: "episode",
          tmdbId: typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId,
          title,
          duration: duration,
          watchedAt: new Date(),
          posterPath: options?.posterPath,
          season: options?.season,
          episode: options?.episode,
          genre: options?.genre,
          rating: options?.rating,
          showId: options?.showId,
        }
        items.push(newItem)
        console.log("Episode added to watched:", newItem.title)
      }
    } else {
      // For movies, keep existing logic
      const existingIndex = items.findIndex((item) => item.type === type && item.tmdbId === tmdbId)

      if (existingIndex >= 0) {
        items.splice(existingIndex, 1)
      } else {
        const newItem: WatchedItem = {
          id: `${type}_${tmdbId}_${Date.now()}`,
          type,
          tmdbId: typeof tmdbId === "string" ? Number.parseInt(tmdbId) : tmdbId,
          title,
          duration: duration,
          watchedAt: new Date(),
          posterPath: options?.posterPath,
          genre: options?.genre,
          rating: options?.rating,
        }
        items.push(newItem)
      }
    }

    localStorage.setItem(this.STORAGE_KEY_WATCHED, JSON.stringify(items))
    window.dispatchEvent(new Event("watchlist-updated"))

    this.triggerSync("history")
  }

  // === WISHLIST ===
  static getWishlistItems(): WishlistItem[] {
    if (typeof window === "undefined") return []
    try {
      const items = localStorage.getItem(this.STORAGE_KEY_WISHLIST)
      return items
        ? JSON.parse(items)
            .map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
            .sort((a: WishlistItem, b: WishlistItem) => b.addedAt.getTime() - a.addedAt.getTime())
        : []
    } catch {
      return []
    }
  }

  static isInWishlist(type: "movie" | "tv", tmdbId: number): boolean {
    const items = this.getWishlistItems()
    return items.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  static toggleWishlist(type: "movie" | "tv", tmdbId: number, title: string, posterPath?: string): boolean {
    if (typeof window === "undefined") return false

    const items = this.getWishlistItems()
    const existingIndex = items.findIndex((item) => item.type === type && item.tmdbId === tmdbId)

    if (existingIndex >= 0) {
      items.splice(existingIndex, 1)
      localStorage.setItem(this.STORAGE_KEY_WISHLIST, JSON.stringify(items))
      window.dispatchEvent(new Event("watchlist-updated"))
      return false
    } else {
      const newItem: WishlistItem = {
        id: `${type}_${tmdbId}_${Date.now()}`,
        type,
        tmdbId,
        title,
        addedAt: new Date(),
        posterPath,
      }
      items.push(newItem)
      localStorage.setItem(this.STORAGE_KEY_WISHLIST, JSON.stringify(items))
      window.dispatchEvent(new Event("watchlist-updated"))
      return true
    }
  }

  // === FAVORITES ===
  static getFavoriteItems(): FavoriteItem[] {
    if (typeof window === "undefined") return []
    try {
      const items = localStorage.getItem(this.STORAGE_KEY_FAVORITES)
      return items
        ? JSON.parse(items)
            .map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
            .sort((a: FavoriteItem, b: FavoriteItem) => b.addedAt.getTime() - a.addedAt.getTime())
        : []
    } catch {
      return []
    }
  }

  static isFavorite(
    type: "movie" | "tv" | "tv-channel" | "radio" | "actor" | "playlist" | "game",
    tmdbId: number,
  ): boolean {
    const items = this.getFavoriteItems()
    return items.some((item) => item.type === type && item.tmdbId === tmdbId)
  }

  static addToFavorites(item: FavoriteItem): void {
    if (typeof window === "undefined") return

    const items = this.getFavoriteItems()
    const existingIndex = items.findIndex((existing) => existing.type === item.type && existing.tmdbId === item.tmdbId)

    if (existingIndex === -1) {
      items.push(item)
      localStorage.setItem(this.STORAGE_KEY_FAVORITES, JSON.stringify(items))
      window.dispatchEvent(new Event("favorites-updated"))

      this.triggerSync("favorites")
    }
  }

  static removeFromFavorites(id: string, type: string): void {
    if (typeof window === "undefined") return

    const items = this.getFavoriteItems()
    const filteredItems = items.filter((item) => !(item.id === id && item.type === type))

    localStorage.setItem(this.STORAGE_KEY_FAVORITES, JSON.stringify(filteredItems))
    window.dispatchEvent(new Event("favorites-updated"))

    this.triggerSync("favorites")
  }

  static toggleFavorite(
    type: "movie" | "tv" | "tv-channel" | "radio" | "actor" | "playlist" | "game",
    tmdbId: number,
    title: string,
    options?: {
      posterPath?: string
      profilePath?: string
      logoUrl?: string
      streamUrl?: string
      url?: string
    },
  ): boolean {
    if (typeof window === "undefined") return false

    const items = this.getFavoriteItems()
    const existingIndex = items.findIndex((item) => item.type === type && item.tmdbId === tmdbId)

    if (existingIndex >= 0) {
      items.splice(existingIndex, 1)
      localStorage.setItem(this.STORAGE_KEY_FAVORITES, JSON.stringify(items))
      window.dispatchEvent(new Event("favorites-updated"))

      this.triggerSync("favorites")
      return false
    } else {
      const newItem: FavoriteItem = {
        id: `${type}_${tmdbId}_${Date.now()}`,
        type,
        tmdbId,
        title,
        addedAt: new Date(),
        ...options,
      }
      items.push(newItem)
      localStorage.setItem(this.STORAGE_KEY_FAVORITES, JSON.stringify(items))
      window.dispatchEvent(new Event("favorites-updated"))

      this.triggerSync("favorites")
      return true
    }
  }

  // === STATISTICS ===
  static getStats(): WatchStats {
    const items = this.getWatchedItems()
    const favorites = this.getFavoriteItems()
    const ratings = this.getRatingItems()

    console.log("Calcul des stats - Total items:", items.length)
    console.log("Episodes dans les items:", items.filter((i) => i.type === "episode").length)

    // Calculs des likes/dislikes par type
    const totalLikes = ratings.filter((r) => r.rating === "like").length
    const totalDislikes = ratings.filter((r) => r.rating === "dislike").length

    const likesMovies = ratings.filter((r) => r.type === "movie" && r.rating === "like").length
    const dislikesMovies = ratings.filter((r) => r.type === "movie" && r.rating === "dislike").length

    const likesTVShows = ratings.filter((r) => r.type === "tv" && r.rating === "like").length
    const dislikesTVShows = ratings.filter((r) => r.type === "tv" && r.rating === "dislike").length

    const likesEpisodes = ratings.filter((r) => r.type === "episode" && r.rating === "like").length
    const dislikesEpisodes = ratings.filter((r) => r.type === "episode" && r.rating === "dislike").length

    const likesTVChannels = ratings.filter((r) => r.type === "tv-channel" && r.rating === "like").length
    const dislikesTVChannels = ratings.filter((r) => r.type === "tv-channel" && r.rating === "dislike").length

    const likesRadio = ratings.filter((r) => r.type === "radio" && r.rating === "like").length
    const dislikesRadio = ratings.filter((r) => r.type === "radio" && r.rating === "dislike").length

    const likesGames = ratings.filter((r) => r.type === "game" && r.rating === "like").length
    const dislikesGames = ratings.filter((r) => r.type === "game" && r.rating === "dislike").length

    const likesPlaylists = ratings.filter((r) => r.type === "playlist" && r.rating === "like").length
    const dislikesPlaylists = ratings.filter((r) => r.type === "playlist" && r.rating === "dislike").length

    if (items.length === 0) {
      return {
        totalWatchTime: 0,
        moviesWatched: 0,
        showsWatched: 0,
        episodesWatched: 0,
        tvChannelsFavorites: favorites.filter((f) => f.type === "tv-channel").length,
        averageRating: 0,
        favoriteGenre: "Aucun",
        watchingStreak: 0,
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
        likesPlaylists,
        dislikesPlaylists,
        monthlyStats: [],
        genreStats: [],
      }
    }

    // Calcul du temps total en s'assurant que duration existe
    const totalWatchTime = items.reduce((sum, item) => {
      const duration = item.duration || 0
      return sum + duration
    }, 0)

    console.log("Temps total calculé:", totalWatchTime, "minutes")

    const moviesWatched = items.filter((item) => item.type === "movie").length
    const episodesWatched = items.filter((item) => item.type === "episode").length

    console.log("Films:", moviesWatched, "Épisodes:", episodesWatched)

    // Compter les séries uniques (soit marquées directement, soit via leurs épisodes)
    const uniqueShowIds = new Set()
    items.forEach((item) => {
      if (item.type === "tv") {
        uniqueShowIds.add(item.tmdbId)
      } else if (item.type === "episode" && item.showId) {
        uniqueShowIds.add(item.showId)
      }
    })
    const showsWatched = uniqueShowIds.size

    console.log("Séries uniques:", showsWatched)

    // Calcul de la note moyenne
    const ratedItems = items.filter((item) => item.rating && item.rating > 0)
    const averageRating =
      ratedItems.length > 0 ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length : 0

    // Genre favori
    const genreCounts = items.reduce(
      (acc, item) => {
        if (item.genre) {
          acc[item.genre] = (acc[item.genre] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const favoriteGenre =
      Object.keys(genreCounts).length > 0 ? Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0][0] : "Aucun"

    const stats = {
      totalWatchTime,
      moviesWatched,
      showsWatched,
      episodesWatched,
      tvChannelsFavorites: favorites.filter((f) => f.type === "tv-channel").length,
      averageRating,
      favoriteGenre,
      watchingStreak: this.calculateStreak(items),
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
      likesPlaylists,
      dislikesPlaylists,
      monthlyStats: [],
      genreStats: [],
    }

    console.log("Stats finales:", stats)
    return stats
  }

  private static calculateStreak(items: WatchedItem[]): number {
    if (items.length === 0) return 0

    const sortedDates = items
      .map((item) => item.watchedAt.toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 0
    let currentDate = new Date()

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr)
      const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays <= streak + 1) {
        streak++
        currentDate = date
      } else {
        break
      }
    }

    return streak
  }

  static calculateSMICEquivalent(minutes: number): { hours: number; euros: number; days: number } {
    const hours = minutes / 60
    const euros = hours * SMIC_HOURLY
    const days = hours / 8 // 8h de travail par jour

    return { hours, euros, days }
  }

  static getInterestingFacts(stats: WatchStats): string[] {
    const facts: string[] = []
    const smicEquiv = this.calculateSMICEquivalent(stats.totalWatchTime)
    const favorites = this.getFavoriteItems()

    // Statistiques de temps
    if (stats.totalWatchTime > 0) {
      const hours = Math.floor(stats.totalWatchTime / 60)
      const days = Math.floor(hours / 24)
      const weeks = Math.floor(days / 7)
      const months = Math.floor(days / 30)
      const years = Math.floor(days / 365)

      if (years > 0) {
        facts.push(`${years} année${years > 1 ? "s" : ""} de visionnage ! Vous pourriez avoir fait le tour du monde !`)
      } else if (months > 0) {
        facts.push(`${months} mois de visionnage ! Vous pourriez avoir appris plusieurs langues !`)
      } else if (weeks > 0) {
        facts.push(`${weeks} semaine${weeks > 1 ? "s" : ""} de visionnage ! Vous pourriez avoir lu 20 livres !`)
      } else if (days > 0) {
        facts.push(`${days} jour${days > 1 ? "s" : ""} de visionnage ! Vous pourriez avoir visité une nouvelle ville !`)
      } else if (hours > 0) {
        facts.push(`${hours} heure${hours > 1 ? "s" : ""} de visionnage ! Un bon début !`)
      }

      facts.push(`Vous avez regardé l'équivalent de ${smicEquiv.euros.toFixed(0)}€ au SMIC !`)
      facts.push(`Cela représente ${smicEquiv.days.toFixed(1)} jours de travail à temps plein.`)

      if (smicEquiv.euros > 1000) {
        facts.push(`Avec ${smicEquiv.euros.toFixed(0)}€, vous pourriez vous offrir un voyage aux Maldives ! 🏝️`)
      } else if (smicEquiv.euros > 500) {
        facts.push(`${smicEquiv.euros.toFixed(0)}€ au SMIC, de quoi s'offrir un bon smartphone ! 📱`)
      } else if (smicEquiv.euros > 100) {
        facts.push(`${smicEquiv.euros.toFixed(0)}€ au SMIC, parfait pour un weekend romantique ! 💕`)
      }
    }

    // Statistiques de contenu
    if (stats.totalLikes > stats.totalDislikes && stats.totalLikes > 10) {
      facts.push(`${stats.totalLikes} likes ! Vous êtes plutôt positif dans vos évaluations ! 😊`)
    }

    if (stats.totalDislikes > stats.totalLikes && stats.totalDislikes > 10) {
      facts.push(`${stats.totalDislikes} dislikes... Vous êtes difficile à satisfaire ! 😅`)
    }

    if (stats.totalLikes + stats.totalDislikes > 50) {
      facts.push(`${stats.totalLikes + stats.totalDislikes} évaluations ! Vous aimez donner votre avis !`)
    }

    if (stats.moviesWatched > 10) {
      facts.push(`Avec ${stats.moviesWatched} films vus, vous pourriez animer un ciné-club !`)
    }

    if (stats.moviesWatched > 100) {
      facts.push(`${stats.moviesWatched} films ! Vous avez vu plus de films que la plupart des critiques !`)
    }

    if (stats.episodesWatched > 100) {
      facts.push(`${stats.episodesWatched} épisodes ! Vous êtes un vrai binge-watcher ! 📺`)
    }

    if (stats.episodesWatched > 500) {
      facts.push(`${stats.episodesWatched} épisodes ! Vous pourriez écrire un livre sur les séries TV !`)
    }

    if (stats.episodesWatched > 1000) {
      facts.push(`${stats.episodesWatched} épisodes ! Vous êtes une encyclopédie vivante des séries ! 🧠`)
    }

    if (stats.showsWatched > 20) {
      facts.push(`${stats.showsWatched} séries différentes ! Vous êtes un explorateur de l'audiovisuel !`)
    }

    if (stats.showsWatched > 50) {
      facts.push(`${stats.showsWatched} séries ! Vous pourriez ouvrir votre propre plateforme de streaming !`)
    }

    if (stats.watchingStreak > 7) {
      facts.push(`${stats.watchingStreak} jours de suite ! Votre série vous manque déjà ?`)
    }

    if (stats.watchingStreak > 30) {
      facts.push(`${stats.watchingStreak} jours consécutifs ! Vous êtes accro aux écrans ! 📱`)
    }

    // Statistiques comparatives amusantes
    if (stats.totalWatchTime > 525600) {
      // Plus d'un an
      facts.push("Vous avez regardé plus d'une année complète ! Vous pourriez avoir appris le chinois ! 🇨🇳")
    }

    if (stats.totalWatchTime > 2628000) {
      // Plus de 5 ans
      facts.push("5 ans de visionnage ! Vous pourriez avoir fait des études supérieures ! 🎓")
    }

    if (stats.episodesWatched > 0 && stats.moviesWatched > 0) {
      const ratio = stats.episodesWatched / stats.moviesWatched
      if (ratio > 10) {
        facts.push("Vous préférez clairement les séries aux films ! Team séries ! 📺")
      } else if (ratio < 0.5) {
        facts.push("Vous êtes plutôt team cinéma ! Les films n'ont pas de secret pour vous ! 🎬")
      }
    }

    // Statistiques de favoris
    if (stats.tvChannelsFavorites > 5) {
      facts.push(`${stats.tvChannelsFavorites} chaînes TV en favoris ! Vous aimez zapper ! 📺`)
    }

    if (favorites.filter((f) => f.type === "actor").length > 10) {
      facts.push(`${favorites.filter((f) => f.type === "actor").length} acteurs favoris ! Vous avez bon goût ! ⭐`)
    }

    if (favorites.filter((f) => f.type === "radio").length > 3) {
      facts.push(
        `${favorites.filter((f) => f.type === "radio").length} radios favorites ! Vous aimez la diversité ! 📻`,
      )
    }

    // Statistiques de qualité
    if (stats.averageRating > 8) {
      facts.push(`Note moyenne de ${stats.averageRating.toFixed(1)}/10 ! Vous ne regardez que du bon contenu !`)
    }

    if (stats.averageRating < 6 && stats.averageRating > 0) {
      facts.push(`Note moyenne de ${stats.averageRating.toFixed(1)}/10... Vous n'êtes pas difficile ! 😄`)
    }

    // Statistiques temporelles
    const now = new Date()
    const thisYear = now.getFullYear()
    const thisYearItems = this.getWatchedItems().filter((item) => item.watchedAt.getFullYear() === thisYear)
    if (thisYearItems.length > 50) {
      facts.push(`${thisYearItems.length} contenus vus cette année ! Vous battez des records ! 🏆`)
    }

    // Statistiques par genre
    if (stats.favoriteGenre !== "Aucun") {
      const genreCount = this.getWatchedItems().filter((item) => item.genre === stats.favoriteGenre).length
      if (genreCount > 10) {
        facts.push(`${genreCount} contenus en ${stats.favoriteGenre} ! Vous êtes un expert du genre !`)
      }
    }

    // Statistiques de likes/dislikes
    if (stats.totalLikes > 0 && stats.totalDislikes === 0) {
      facts.push("Vous n'avez jamais disliké ! Vous êtes très positif ! 😊")
    }

    if (stats.totalDislikes > 0 && stats.totalLikes === 0) {
      facts.push("Que des dislikes... Rien ne vous plaît ? 😅")
    }

    const likeRatio =
      stats.totalLikes + stats.totalDislikes > 0
        ? (stats.totalLikes / (stats.totalLikes + stats.totalDislikes)) * 100
        : 0

    if (likeRatio > 80 && stats.totalLikes + stats.totalDislikes > 10) {
      facts.push(`${likeRatio.toFixed(0)}% de likes ! Vous êtes très positif dans vos évaluations ! 👍`)
    }

    if (likeRatio < 20 && stats.totalLikes + stats.totalDislikes > 10) {
      facts.push(`${likeRatio.toFixed(0)}% de likes... Vous êtes un critique sévère ! 🎭`)
    }

    // Statistiques fun supplémentaires
    if (stats.totalWatchTime > 43800) {
      // Plus d'un mois
      facts.push("Vous avez regardé plus d'un mois complet ! Vous pourriez avoir traversé l'Atlantique à la nage ! 🏊‍♂️")
    }

    if (stats.episodesWatched > 2000) {
      facts.push("Plus de 2000 épisodes ! Vous pourriez présenter un quiz TV ! 🎯")
    }

    // Playlist-specific interesting facts
    if (stats.likesPlaylists > 5) {
      facts.push(`${stats.likesPlaylists} playlists likées ! Vous appréciez les collections de la communauté !`)
    }

    if (stats.likesPlaylists > stats.dislikesPlaylists && stats.likesPlaylists > 0) {
      facts.push(`Vous likez plus de playlists que vous n'en dislikez ! Vous êtes ouvert aux découvertes !`)
    }

    if (favorites.filter((f) => f.type === "playlist").length > 3) {
      facts.push(
        `${favorites.filter((f) => f.type === "playlist").length} playlists en favoris ! Vous aimez collectionner !`,
      )
    }

    return facts.slice(0, 8) // Limiter à 8 faits pour ne pas surcharger
  }
}
