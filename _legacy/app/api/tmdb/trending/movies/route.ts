import { type NextRequest, NextResponse } from "next/server"
import { getTrendingMovies } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    const data = await getTrendingMovies()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching trending movies:", error)
    return NextResponse.json({ error: "Failed to fetch trending movies" }, { status: 500 })
  }
}
