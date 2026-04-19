import { type NextRequest, NextResponse } from "next/server"
import { contentUpdater } from "@/lib/content-updater"

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const useCache = searchParams.get("cache") !== "false"
    const sortBy = searchParams.get("sort_by") || "popularity.desc"
    const withGenres = searchParams.get("with_genres")
    const withWatchProviders = searchParams.get("with_watch_providers")
    const watchRegion = searchParams.get("watch_region") || "FR"

    let data

    if (withGenres || withWatchProviders || sortBy !== "popularity.desc") {
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY!,
        language: "fr-FR",
        page: page.toString(),
        sort_by: sortBy,
      })

      if (withGenres) {
        params.append("with_genres", withGenres)
      }

      if (withWatchProviders) {
        params.append("with_watch_providers", withWatchProviders)
        params.append("watch_region", watchRegion)
        params.append("with_watch_monetization_types", "flatrate|free|ads|rent|buy")
      }

      const response = await fetch(`${TMDB_BASE_URL}/discover/tv?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch TV shows from TMDB")
      data = await response.json()
    } else if (useCache && page === 1) {
      // Use cache only for first page without filters
      data = await contentUpdater.getTrendingTVShowsCache()
    } else {
      // Fetch from API for other pages without filters
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY!,
        language: "fr-FR",
        page: page.toString(),
        sort_by: "popularity.desc",
      })

      const response = await fetch(`${TMDB_BASE_URL}/discover/tv?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch TV shows from TMDB")
      data = await response.json()
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching TV shows:", error)
    return NextResponse.json({ error: "Failed to fetch TV shows" }, { status: 500 })
  }
}
