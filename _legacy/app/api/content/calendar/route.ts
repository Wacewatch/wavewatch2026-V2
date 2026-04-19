import { type NextRequest, NextResponse } from "next/server"
import { contentUpdater } from "@/lib/content-updater"
import { getUpcomingMovies, getUpcomingTVShows } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useCache = searchParams.get("cache") !== "false"

    let upcomingMovies, upcomingTVShows

    if (useCache) {
      ;[upcomingMovies, upcomingTVShows] = await Promise.all([
        contentUpdater.getUpcomingMoviesCache(),
        contentUpdater.getUpcomingTVShowsCache(),
      ])
    } else {
      ;[upcomingMovies, upcomingTVShows] = await Promise.all([getUpcomingMovies(), getUpcomingTVShows()])
    }

    return NextResponse.json({
      upcomingMovies,
      upcomingTVShows,
    })
  } catch (error) {
    console.error("Error fetching calendar data:", error)
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 })
  }
}
