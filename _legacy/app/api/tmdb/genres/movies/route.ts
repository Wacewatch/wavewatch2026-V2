import { NextResponse } from "next/server"
import { getGenres } from "@/lib/tmdb"

export async function GET() {
  try {
    const genres = await getGenres("movie")
    return NextResponse.json(genres)
  } catch (error) {
    console.error("Error fetching movie genres:", error)
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
  }
}
