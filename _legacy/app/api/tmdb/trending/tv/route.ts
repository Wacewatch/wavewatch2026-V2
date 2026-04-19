import { type NextRequest, NextResponse } from "next/server"
import { getTrendingTVShows } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    const data = await getTrendingTVShows()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching trending TV shows:", error)
    return NextResponse.json({ error: "Failed to fetch trending TV shows" }, { status: 500 })
  }
}
