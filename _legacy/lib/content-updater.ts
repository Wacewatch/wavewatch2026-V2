// Système de mise à jour automatique du contenu TMDB
import {
  getTrendingMovies,
  getTrendingTVShows,
  getUpcomingMovies,
  getUpcomingTVShows,
  getPopularMovies,
  getPopularTVShows,
  getPopularAnime,
} from "./tmdb"

interface CacheData {
  data: any
  lastUpdated: number
  expiresIn: number
}

class ContentUpdater {
  private cache = new Map<string, CacheData>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 heures en millisecondes

  private isExpired(cacheData: CacheData): boolean {
    return Date.now() - cacheData.lastUpdated > cacheData.expiresIn
  }

  private async updateCache(key: string, fetchFunction: () => Promise<any>) {
    try {
      console.log(`Mise à jour du cache pour: ${key}`)
      const data = await fetchFunction()
      this.cache.set(key, {
        data,
        lastUpdated: Date.now(),
        expiresIn: this.CACHE_DURATION,
      })
      return data
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de ${key}:`, error)
      throw error
    }
  }

  // Fonctions pour les films
  async getTrendingMoviesCache(): Promise<any> {
    const key = "trending-movies"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer plusieurs pages pour avoir plus de contenu
      const [page1, page2, page3] = await Promise.all([getPopularMovies(1), getPopularMovies(2), getPopularMovies(3)])

      const combinedData = {
        ...page1,
        results: [...page1.results, ...page2.results, ...page3.results],
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  async getPopularMoviesCache(): Promise<any> {
    const key = "popular-movies"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer les films les mieux notés
      const [trending, popular] = await Promise.all([getTrendingMovies(), getPopularMovies(1)])

      // Combiner et trier par note
      const allMovies = [...trending.results, ...popular.results]
      const uniqueMovies = allMovies.filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id))

      // Trier par vote_average décroissant
      uniqueMovies.sort((a, b) => b.vote_average - a.vote_average)

      const combinedData = {
        ...trending,
        results: uniqueMovies,
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  // Fonctions pour les séries TV
  async getTrendingTVShowsCache(): Promise<any> {
    const key = "trending-tvshows"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer plusieurs pages pour avoir plus de contenu
      const [page1, page2, page3] = await Promise.all([
        getPopularTVShows(1),
        getPopularTVShows(2),
        getPopularTVShows(3),
      ])

      const combinedData = {
        ...page1,
        results: [...page1.results, ...page2.results, ...page3.results],
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  async getPopularTVShowsCache(): Promise<any> {
    const key = "popular-tvshows"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer les séries les mieux notées
      const [trending, popular] = await Promise.all([getTrendingTVShows(), getPopularTVShows(1)])

      // Combiner et trier par note
      const allShows = [...trending.results, ...popular.results]
      const uniqueShows = allShows.filter((show, index, self) => index === self.findIndex((s) => s.id === show.id))

      // Trier par vote_average décroissant
      uniqueShows.sort((a, b) => b.vote_average - a.vote_average)

      const combinedData = {
        ...trending,
        results: uniqueShows,
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  // Fonctions pour les animés
  async getTrendingAnimeCache(): Promise<any> {
    const key = "trending-anime"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer plusieurs pages pour avoir plus de contenu
      const [page1, page2, page3] = await Promise.all([getPopularAnime(1), getPopularAnime(2), getPopularAnime(3)])

      const combinedData = {
        ...page1,
        results: [...page1.results, ...page2.results, ...page3.results],
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  // Fonctions pour le calendrier
  async getUpcomingMoviesCache(): Promise<any> {
    const key = "upcoming-movies"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer plusieurs pages de films à venir
      const [page1, page2, page3, page4] = await Promise.all([
        getUpcomingMovies(1),
        getUpcomingMovies(2),
        getUpcomingMovies(3),
        getUpcomingMovies(4),
      ])

      const combinedData = {
        ...page1,
        results: [...page1.results, ...page2.results, ...page3.results, ...page4.results],
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  async getUpcomingTVShowsCache(): Promise<any> {
    const key = "upcoming-tvshows"
    const cached = this.cache.get(key)

    if (!cached || this.isExpired(cached)) {
      // Récupérer plusieurs pages de séries à venir
      const [page1, page2, page3, page4] = await Promise.all([
        getUpcomingTVShows(1),
        getUpcomingTVShows(2),
        getUpcomingTVShows(3),
        getUpcomingTVShows(4),
      ])

      const combinedData = {
        ...page1,
        results: [...page1.results, ...page2.results, ...page3.results, ...page4.results],
      }

      return await this.updateCache(key, () => Promise.resolve(combinedData))
    }

    return cached.data
  }

  // Forcer la mise à jour d'un type spécifique
  async forceUpdateMovies(): Promise<any> {
    this.cache.delete("trending-movies")
    this.cache.delete("popular-movies")
    const [trending, popular] = await Promise.all([this.getTrendingMoviesCache(), this.getPopularMoviesCache()])
    return { trending, popular }
  }

  async forceUpdateTVShows(): Promise<any> {
    this.cache.delete("trending-tvshows")
    this.cache.delete("popular-tvshows")
    const [trending, popular] = await Promise.all([this.getTrendingTVShowsCache(), this.getPopularTVShowsCache()])
    return { trending, popular }
  }

  async forceUpdateAnime(): Promise<any> {
    this.cache.delete("trending-anime")
    return await this.getTrendingAnimeCache()
  }

  async forceUpdateCalendar(): Promise<any> {
    this.cache.delete("upcoming-movies")
    this.cache.delete("upcoming-tvshows")
    const [movies, tvshows] = await Promise.all([this.getUpcomingMoviesCache(), this.getUpcomingTVShowsCache()])
    return { movies, tvshows }
  }

  // Forcer la mise à jour de tout le contenu
  async forceUpdateAll(): Promise<any> {
    // Vider tout le cache
    this.cache.clear()

    const [movies, tvshows, anime, upcomingMovies, upcomingTVShows] = await Promise.all([
      this.forceUpdateMovies(),
      this.forceUpdateTVShows(),
      this.forceUpdateAnime(),
      this.getUpcomingMoviesCache(),
      this.getUpcomingTVShowsCache(),
    ])

    return {
      movies,
      tvshows,
      anime,
      upcomingMovies,
      upcomingTVShows,
    }
  }

  // Obtenir les informations de cache
  getCacheInfo() {
    const info: any = {}
    for (const [key, value] of this.cache.entries()) {
      info[key] = {
        lastUpdated: new Date(value.lastUpdated).toLocaleString("fr-FR"),
        isExpired: this.isExpired(value),
        expiresAt: new Date(value.lastUpdated + value.expiresIn).toLocaleString("fr-FR"),
        itemCount: value.data?.results?.length || 0,
      }
    }
    return info
  }

  // Nettoyer le cache expiré
  cleanExpiredCache() {
    for (const [key, value] of this.cache.entries()) {
      if (this.isExpired(value)) {
        this.cache.delete(key)
        console.log(`Cache expiré supprimé: ${key}`)
      }
    }
  }
}

// Instance singleton
export const contentUpdater = new ContentUpdater()

// Fonction pour démarrer les mises à jour automatiques
export function startAutoUpdates() {
  // Mise à jour immédiate au démarrage
  contentUpdater.forceUpdateAll().catch(console.error)

  // Mise à jour toutes les 24 heures
  setInterval(
    async () => {
      try {
        console.log("Mise à jour automatique du contenu TMDB...")
        await contentUpdater.forceUpdateAll()
        console.log("Mise à jour automatique terminée")
      } catch (error) {
        console.error("Erreur lors de la mise à jour automatique:", error)
      }
    },
    24 * 60 * 60 * 1000,
  ) // 24 heures

  // Nettoyage du cache toutes les heures
  setInterval(
    () => {
      contentUpdater.cleanExpiredCache()
    },
    60 * 60 * 1000,
  ) // 1 heure
}
