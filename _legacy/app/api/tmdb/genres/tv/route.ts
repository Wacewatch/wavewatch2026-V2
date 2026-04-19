import { NextResponse } from "next/server"
import { getGenres } from "@/lib/tmdb"

export async function GET() {
  try {
    const genres = await getGenres("tv")
    return NextResponse.json(genres)
  } catch (error) {
    console.error("Error fetching TV genres:", error)
    return NextResponse.json({ error: "Failed to fetch TV genres" }, { status: 500 })
  }
}
