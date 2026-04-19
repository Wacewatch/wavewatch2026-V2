import { type NextRequest, NextResponse } from "next/server"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 })
  }

  const { id } = await params

  try {
    const response = await fetch(`${TMDB_BASE_URL}/collection/${id}?api_key=${TMDB_API_KEY}&language=fr-FR`)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching movie collection:", error)
    return NextResponse.json({ error: "Failed to fetch movie collection" }, { status: 500 })
  }
}
