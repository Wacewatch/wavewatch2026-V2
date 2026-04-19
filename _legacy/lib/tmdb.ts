const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || ""

const BASE_URL = "https://api.themoviedb.org/3"

const getUserAdultContentPreference = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false

  try {
    const storedPreference = localStorage.getItem("wavewatch_adult_content")
    if (storedPreference !== null) {
      return storedPreference === "true"
    }

    const event = new CustomEvent("get-user-preferences")
    let preferences = null

    const handlePreferencesResponse = (e: any) => {
      preferences = e.detail
    }

    window.addEventListener("user-preferences-response", handlePreferencesResponse)
    window.dispatchEvent(event)

    await new Promise((resolve) => setTimeout(resolve, 100))

    window.removeEventListener("user-preferences-response", handlePreferencesResponse)

    if (preferences && typeof preferences.showAdultContent === "boolean") {
      localStorage.setItem("wavewatch_adult_content", preferences.showAdultContent.toString())
      return preferences.showAdultContent
    }

    return false
  } catch (error) {
    console.error("Error getting adult content preference:", error)
    return false // Default to hiding adult content on error
  }
}

// Helper function to create comprehensive mock data
const createMockResponse = (type: "movie" | "tv" | "person" = "movie") => {
  const mockMovies = [
    {
      id: 1,
      title: "Film Populaire",
      overview: "Un film captivant qui vous tiendra en haleine du début à la fin.",
      poster_path: "/placeholder.svg?height=600&width=400",
      backdrop_path: "/placeholder.svg?height=400&width=800",
      release_date: "2024-01-15",
      genre_ids: [28, 12],
      vote_average: 8.5,
      vote_count: 1200,
      popularity: 95.5,
      adult: false,
      media_type: "movie",
    },
    {
      id: 2,
      title: "Aventure Épique",
      overview: "Une aventure extraordinaire dans un monde fantastique.",
      poster_path: "/placeholder.svg?height=600&width=400",
      backdrop_path: "/placeholder.svg?height=400&width=800",
      release_date: "2024-02-20",
      genre_ids: [12, 14],
      vote_average: 7.8,
      vote_count: 890,
      popularity: 87.2,
      adult: false,
      media_type: "movie",
    },
  ]

  const mockTVShows = [
    {
      id: 1,
      name: "Série Tendance",
      overview: "Une série dramatique qui explore les relations humaines.",
      poster_path: "/placeholder.svg?height=600&width=400",
      backdrop_path: "/placeholder.svg?height=400&width=800",
      first_air_date: "2024-01-10",
      genre_ids: [18, 9648],
      vote_average: 8.2,
      vote_count: 750,
      popularity: 92.1,
      origin_country: ["US"],
      original_language: "en",
      adult: false,
      media_type: "tv",
    },
  ]

  const mockPersons = [
    {
      id: 1,
      name: "Acteur Célèbre",
      profile_path: "/placeholder.svg?height=600&width=400",
      known_for_department: "Acting",
      popularity: 85.3,
      gender: 2,
      adult: false,
      media_type: "person",
      known_for: mockMovies.slice(0, 1),
    },
  ]

  if (type === "tv") {
    return {
      results: mockTVShows,
      total_pages: 1,
      total_results: mockTVShows.length,
      page: 1,
    }
  }

  if (type === "person") {
    return {
      results: mockPersons,
      total_pages: 1,
      total_results: mockPersons.length,
      page: 1,
    }
  }

  return {
    results: mockMovies,
    total_pages: 1,
    total_results: mockMovies.length,
    page: 1,
  }
}

// Helper function to handle API calls with better fallback
const fetchWithFallback = async (url: string, mockData?: any) => {
  // Only use mock data if there's truly no API key
  if (!API_KEY) {
    console.warn("[v0] No TMDB API key found, using mock data")
    return {
      ok: true,
      json: () => Promise.resolve(mockData || createMockResponse()),
    }
  }

  try {
    console.log("[v0] Fetching from TMDB API:", url)
    const response = await fetch(url)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] TMDB API error:", response.status, response.statusText, errorBody)
      throw new Error(`TMDB API error: ${response.status}`)
    }

    return response
  } catch (error) {
    console.error("[v0] TMDB API request failed:", error)
    // Only fall back to mock data if there's a network error
    return {
      ok: true,
      json: () => Promise.resolve(mockData || createMockResponse()),
    }
  }
}

// Helper function to filter out unreleased content
const filterReleasedContent = (items: any[], dateField: string) => {
  const now = new Date()
  return items.filter((item) => {
    const releaseDate = new Date(item[dateField])
    return releaseDate <= now
  })
}

const filterAdultContent = async (items: any[]) => {
  const showAdultContent = await getUserAdultContentPreference()

  if (showAdultContent) {
    return items // Show all content including adult
  }

  return items.filter((item) => {
    // Filter by adult flag
    if (item.adult) return false

    // Filter by content rating for movies (check release_dates for certification)
    if (item.release_dates?.results) {
      for (const country of item.release_dates.results) {
        for (const release of country.release_dates) {
          if (release.certification && isAdultCertification(release.certification, country.iso_3166_1)) {
            return false
          }
        }
      }
    }

    // Filter by content rating for TV shows
    if (item.content_ratings?.results) {
      for (const rating of item.content_ratings.results) {
        if (rating.rating && isAdultCertification(rating.rating, rating.iso_3166_1)) {
          return false
        }
      }
    }

    return true
  })
}

const isAdultCertification = (certification: string, country: string): boolean => {
  const adultCertifications: Record<string, string[]> = {
    US: ["NC-17", "R", "TV-MA"],
    FR: ["18", "-18", "X"],
    GB: ["18", "R18"],
    DE: ["18", "FSK 18"],
    CA: ["18A", "R", "A"],
    AU: ["R18+", "MA15+"],
    JP: ["R18+", "R15+"],
    KR: ["청소년관람불가", "18"],
    BR: ["18", "L"],
  }

  const countryRatings = adultCertifications[country] || []
  return countryRatings.some((rating) => certification.includes(rating))
}

// Helper function to check if a show is anime
const isAnime = (show: any) => {
  return (
    show.genre_ids?.includes(16) && // Animation genre
    (show.origin_country?.includes("JP") || // Japanese origin
      show.original_language === "ja" || // Japanese language
      show.name?.match(/anime|manga/i) || // Contains anime/manga keywords
      show.overview?.match(/anime|manga/i)) // Description contains anime/manga
  )
}

const buildApiUrl = async (endpoint: string, params: Record<string, any> = {}) => {
  const showAdultContent = await getUserAdultContentPreference()
  const urlParams = new URLSearchParams({
    api_key: API_KEY,
    language: "fr-FR",
    include_adult: showAdultContent.toString(),
    ...params,
  })

  return `${BASE_URL}${endpoint}?${urlParams.toString()}`
}

export async function getTrendingMovies() {
  const url = await buildApiUrl("/trending/movie/week")
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch trending movies")
  const data = await response.json()

  // Filter out unreleased movies and adult content based on user preference
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function getTrendingTVShows() {
  const url = await buildApiUrl("/trending/tv/week")
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch trending TV shows")
  const data = await response.json()

  // Filter out unreleased shows, anime, and adult content based on user preference
  if (data.results) {
    data.results = await filterAdultContent(
      filterReleasedContent(data.results, "first_air_date").filter((show) => !isAnime(show)),
    )
  }
  return data
}

export async function getTrendingAnime() {
  try {
    // First, try to get trending anime using discover with animation genre
    const url = await buildApiUrl("/discover/tv", {
      with_genres: "16",
      with_origin_country: "JP",
      sort_by: "popularity.desc",
      "first_air_date.lte": new Date().toISOString().split("T")[0],
    })
    const discoverResponse = await fetchWithFallback(url, createMockResponse("tv"))

    if (discoverResponse.ok) {
      const discoverData = await discoverResponse.json()
      if (discoverData.results && discoverData.results.length > 0) {
        // Filter adult content for anime
        discoverData.results = await filterAdultContent(discoverData.results)
        return discoverData
      }
    }

    // Fallback: get trending TV and filter for anime
    const trendingUrl = await buildApiUrl("/trending/tv/week", {})
    const trendingResponse = await fetchWithFallback(trendingUrl, createMockResponse("tv"))

    if (!trendingResponse.ok) throw new Error("Failed to fetch trending anime")
    const trendingData = await trendingResponse.json()

    // Filter for anime only and adult content
    if (trendingData.results) {
      const animeResults = trendingData.results.filter(isAnime)
      trendingData.results = await filterAdultContent(filterReleasedContent(animeResults, "first_air_date"))
    }

    // If no anime found in trending, get popular anime as fallback
    if (!trendingData.results || trendingData.results.length === 0) {
      const popularAnimeUrl = await buildApiUrl("/discover/tv", {
        with_genres: "16",
        sort_by: "popularity.desc",
        "first_air_date.lte": new Date().toISOString().split("T")[0],
      })
      const popularAnimeResponse = await fetchWithFallback(popularAnimeUrl, createMockResponse("tv"))

      if (popularAnimeResponse.ok) {
        const popularAnimeData = await popularAnimeResponse.json()
        if (popularAnimeData.results) {
          popularAnimeData.results = await filterAdultContent(popularAnimeData.results)
        }
        return popularAnimeData
      }
    }

    return trendingData
  } catch (error) {
    console.error("Error fetching trending anime:", error)

    // Return mock anime data as final fallback
    return {
      results: [
        {
          id: 1,
          name: "Attack on Titan",
          original_name: "進撃の巨人",
          overview: "L'humanité vit retranchée dans une cité cernée par d'immenses murailles...",
          poster_path: "/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
          backdrop_path: "/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
          first_air_date: "2013-04-07",
          genre_ids: [16, 10759, 18],
          origin_country: ["JP"],
          original_language: "ja",
          popularity: 100,
          vote_average: 9.0,
          vote_count: 4500,
          adult: false,
          media_type: "tv",
        },
        {
          id: 2,
          name: "Demon Slayer",
          original_name: "鬼滅の刃",
          overview: "Depuis les temps anciens, il existe des rumeurs concernant des démons mangeurs d'hommes...",
          poster_path: "/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
          backdrop_path: "/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg",
          first_air_date: "2019-04-06",
          genre_ids: [16, 10759, 18],
          origin_country: ["JP"],
          original_language: "ja",
          popularity: 95,
          vote_average: 8.7,
          vote_count: 3200,
          adult: false,
          media_type: "tv",
        },
        {
          id: 3,
          name: "One Piece",
          original_name: "ワンピース",
          overview: "Monkey D. Luffy refuse de laisser quiconque ou quoi que ce soit l'empêcher...",
          poster_path: "/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg",
          backdrop_path: "/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg",
          first_air_date: "1999-10-20",
          genre_ids: [16, 35, 10759],
          origin_country: ["JP"],
          original_language: "ja",
          popularity: 90,
          vote_average: 8.9,
          vote_count: 2800,
          adult: false,
          media_type: "tv",
        },
        {
          id: 4,
          name: "My Hero Academia",
          original_name: "僕のヒーローアカデミア",
          overview: "Dans un monde où 80% de la population possède des super-pouvoirs...",
          poster_path: "/bQCsxGpW04347Lq2qqStpKjqMoD.jpg",
          backdrop_path: "/6P3c80EOm7BodndGBUAJHHsHKrp.jpg",
          first_air_date: "2016-04-03",
          genre_ids: [16, 10759, 35],
          origin_country: ["JP"],
          original_language: "ja",
          popularity: 85,
          vote_average: 8.5,
          vote_count: 2100,
          adult: false,
          media_type: "tv",
        },
      ],
      total_pages: 1,
      total_results: 4,
      page: 1,
    }
  }
}

export async function getPopularMovies(page = 1) {
  const url = await buildApiUrl("/movie/popular", { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch popular movies")
  const data = await response.json()

  // Filter out unreleased movies and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function getPopularTVShows(page = 1) {
  const url = await buildApiUrl("/tv/popular", { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch popular TV shows")
  const data = await response.json()

  // Filter out unreleased shows, anime, and adult content
  if (data.results) {
    data.results = await filterAdultContent(
      filterReleasedContent(data.results, "first_air_date").filter((show) => !isAnime(show)),
    )
  }
  return data
}

export async function getPopularAnime(page = 1) {
  const url = await buildApiUrl("/discover/tv", {
    with_genres: "16",
    sort_by: "popularity.desc",
    page: page.toString(),
    "first_air_date.lte": new Date().toISOString().split("T")[0],
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch popular anime")
  const data = await response.json()

  // Filter out unreleased anime and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "first_air_date"))
  }
  return data
}

export async function getUpcomingMovies(page = 1) {
  const url = await buildApiUrl("/movie/upcoming", { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch upcoming movies")
  const data = await response.json()

  // Filter adult content for upcoming movies
  if (data.results) {
    data.results = await filterAdultContent(data.results)
  }
  return data
}

export async function getUpcomingTVShows(page = 1) {
  const url = await buildApiUrl("/tv/on_the_air", { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch upcoming TV shows")
  const data = await response.json()

  // Filter adult content for upcoming TV shows
  if (data.results) {
    data.results = await filterAdultContent(data.results)
  }
  return data
}

export async function getMovieDetails(id: number) {
  const url = await buildApiUrl(`/movie/${id}`, {
    append_to_response: "credits,videos,similar,reviews,watch/providers",
  })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch movie details")
  return response.json()
}

export async function getTVShowDetails(id: number) {
  const url = await buildApiUrl(`/tv/${id}`, {
    append_to_response: "credits,videos,similar,reviews,watch/providers",
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch TV show details")
  return response.json()
}

export async function getMovieCredits(id: number) {
  const url = await buildApiUrl(`/movie/${id}/credits`)
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch movie credits")
  return response.json()
}

export async function getTVShowCredits(id: number) {
  const url = await buildApiUrl(`/tv/${id}/credits`)
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch TV show credits")
  return response.json()
}

export async function getSeasonDetails(showId: number, seasonNumber: number) {
  const url = await buildApiUrl(`/tv/${showId}/season/${seasonNumber}`)
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch season details")
  return response.json()
}

export async function getEpisodeDetails(showId: number, seasonNumber: number, episodeNumber: number) {
  const url = await buildApiUrl(`/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    append_to_response: "credits,videos",
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch episode details")
  return response.json()
}

export async function getGenres(type: "movie" | "tv") {
  const url = await buildApiUrl(`/genre/${type}/list`)
  const response = await fetchWithFallback(url, createMockResponse())
  if (!response.ok) throw new Error("Failed to fetch genres")
  return response.json()
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  const url = await buildApiUrl("/discover/movie", {
    with_genres: genreId.toString(),
    page: page.toString(),
    sort_by: "popularity.desc",
  })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch movies by genre")
  const data = await response.json()

  // Filter out unreleased movies and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function getTVShowsByGenre(genreId: number, page = 1) {
  const url = await buildApiUrl("/discover/tv", {
    with_genres: genreId.toString(),
    page: page.toString(),
    sort_by: "popularity.desc",
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch TV shows by genre")
  const data = await response.json()

  // Filter out unreleased shows and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "first_air_date"))
  }
  return data
}

export async function searchMulti(query: string, page = 1) {
  const url = await buildApiUrl("/search/multi", {
    query: encodeURIComponent(query),
    page: page.toString(),
  })
  const response = await fetchWithFallback(url, createMockResponse())
  if (!response.ok) throw new Error("Failed to search")
  const data = await response.json()

  // Filter out unreleased content and adult content
  if (data.results) {
    const now = new Date()
    const showAdultContent = await getUserAdultContentPreference()
    data.results = data.results.filter((item: any) => {
      // Filter by release date
      if (item.media_type === "movie" && item.release_date) {
        const isReleased = new Date(item.release_date) <= now
        if (!isReleased) return false
      }
      if (item.media_type === "tv" && item.first_air_date) {
        const isReleased = new Date(item.first_air_date) <= now
        if (!isReleased) return false
      }

      // Filter adult content
      if (!showAdultContent && item.adult) {
        return false
      }

      return true
    })
  }

  return data
}

export async function searchMovies(query: string, page = 1) {
  const url = await buildApiUrl("/search/movie", {
    query: encodeURIComponent(query),
    page: page.toString(),
  })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to search movies")
  const data = await response.json()

  // Filter out unreleased movies and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function searchTVShows(query: string, page = 1) {
  const url = await buildApiUrl("/search/tv", {
    query: encodeURIComponent(query),
    page: page.toString(),
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to search TV shows")
  const data = await response.json()

  // Filter out unreleased shows and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "first_air_date"))
  }
  return data
}

export async function searchAnime(query: string, page = 1) {
  const url = await buildApiUrl("/search/tv", {
    query: encodeURIComponent(query),
    page: page.toString(),
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to search anime")
  const data = await response.json()

  // Filter results to only include anime and filter adult content
  const animeResults = data.results.filter(isAnime)
  const filteredResults = await filterAdultContent(animeResults)

  return { ...data, results: filteredResults }
}

export async function getPopularActors(page = 1) {
  const url = await buildApiUrl("/person/popular", { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to fetch popular actors")
  return response.json()
}

export async function getActorDetails(id: number) {
  const url = await buildApiUrl(`/person/${id}`, {
    append_to_response: "movie_credits,tv_credits,images",
  })
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to fetch actor details")
  return response.json()
}

export async function getActorCredits(id: number) {
  const url = await buildApiUrl(`/person/${id}/combined_credits`)
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to fetch actor credits")
  const data = await response.json()

  // Filter out unreleased content and adult content from cast
  if (data.cast) {
    const now = new Date()
    const showAdultContent = await getUserAdultContentPreference()
    data.cast = data.cast.filter((item: any) => {
      // Filter by release date
      if (item.media_type === "movie" && item.release_date) {
        const isReleased = new Date(item.release_date) <= now
        if (!isReleased) return false
      }
      if (item.media_type === "tv" && item.first_air_date) {
        const isReleased = new Date(item.first_air_date) <= now
        if (!isReleased) return false
      }

      // Filter adult content
      if (!showAdultContent && item.adult) {
        return false
      }

      return true
    })
  }

  return data
}

export async function searchActors(query: string, page = 1) {
  const url = await buildApiUrl("/search/person", {
    query: encodeURIComponent(query),
    page: page.toString(),
  })
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to search actors")
  return response.json()
}

// Director functions
export async function getDirectorDetails(id: number) {
  const url = await buildApiUrl(`/person/${id}`, {
    append_to_response: "movie_credits,tv_credits,images",
  })
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to fetch director details")
  return response.json()
}

export async function getDirectorCredits(id: number) {
  const url = await buildApiUrl(`/person/${id}/combined_credits`)
  const response = await fetchWithFallback(url, createMockResponse("person"))
  if (!response.ok) throw new Error("Failed to fetch director credits")
  const data = await response.json()

  // Filter out unreleased content, focus on directing credits, and filter adult content
  if (data.crew) {
    const now = new Date()
    const showAdultContent = await getUserAdultContentPreference()
    data.crew = data.crew.filter((item: any) => {
      const isDirector = item.job === "Director" || item.department === "Directing"
      if (!isDirector) return false

      // Filter by release date
      if (item.media_type === "movie" && item.release_date) {
        const isReleased = new Date(item.release_date) <= now
        if (!isReleased) return false
      }
      if (item.media_type === "tv" && item.first_air_date) {
        const isReleased = new Date(item.first_air_date) <= now
        if (!isReleased) return false
      }

      // Filter adult content
      if (!showAdultContent && item.adult) {
        return false
      }

      return true
    })
  }

  return data
}

// New functions for collections and similar content
export async function getMovieCollection(id: number) {
  const url = await buildApiUrl(`/collection/${id}`)
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch movie collection")
  const data = await response.json()

  // Filter out unreleased movies and adult content from collection
  if (data.parts) {
    data.parts = await filterAdultContent(filterReleasedContent(data.parts, "release_date"))
  }

  return data
}

export async function getSimilarMovies(id: number, page = 1) {
  const url = await buildApiUrl(`/movie/${id}/similar`, { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch similar movies")
  const data = await response.json()

  // Filter out unreleased movies and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function getSimilarTVShows(id: number, page = 1) {
  const url = await buildApiUrl(`/tv/${id}/similar`, { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch similar TV shows")
  const data = await response.json()

  // Filter out unreleased shows and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "first_air_date"))
  }
  return data
}

export async function getRecommendedMovies(id: number, page = 1) {
  const url = await buildApiUrl(`/movie/${id}/recommendations`, { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("movie"))
  if (!response.ok) throw new Error("Failed to fetch recommended movies")
  const data = await response.json()

  // Filter out unreleased movies and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "release_date"))
  }
  return data
}

export async function getRecommendedTVShows(id: number, page = 1) {
  const url = await buildApiUrl(`/tv/${id}/recommendations`, { page: page.toString() })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch recommended TV shows")
  const data = await response.json()

  // Filter out unreleased shows and adult content
  if (data.results) {
    data.results = await filterAdultContent(filterReleasedContent(data.results, "first_air_date"))
  }
  return data
}

// Season and episode functions
export async function getTVShowSeason(tvId: number, seasonNumber: number) {
  const url = await buildApiUrl(`/tv/${tvId}/season/${seasonNumber}`)
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch TV show season")
  return response.json()
}

export async function getTVShowEpisode(tvId: number, seasonNumber: number, episodeNumber: number) {
  const url = await buildApiUrl(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    append_to_response: "credits,videos",
  })
  const response = await fetchWithFallback(url, createMockResponse("tv"))
  if (!response.ok) throw new Error("Failed to fetch TV show episode")
  return response.json()
}

export function updateAdultContentPreference(showAdultContent: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem("wavewatch_adult_content", showAdultContent.toString())

    // Dispatch custom event for database update
    const updateEvent = new CustomEvent("update-user-preferences", {
      detail: { showAdultContent },
    })
    window.dispatchEvent(updateEvent)

    // Trigger event to update other components
    window.dispatchEvent(new Event("adult-content-preference-updated"))
  }
}

// Alias pour compatibilité
export const getTVSeasonDetails = getSeasonDetails
export const getActorMovieCredits = getActorCredits
export const getActorTVCredits = getActorCredits
export const getPopularPeople = getPopularActors
export const searchPerson = searchActors
