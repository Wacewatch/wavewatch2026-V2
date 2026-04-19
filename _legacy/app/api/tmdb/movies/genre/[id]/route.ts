import { type NextRequest, NextResponse } from "next/server"
import { getMoviesByGenre } from "@/lib/tmdb"
import { createClient } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get user preferences for adult content filtering
    let showAdultContent = true // Default to showing adult content for non-authenticated users

    if (user) {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("show_adult_content")
        .eq("user_id", user.id)
        .single()

      showAdultContent = preferences?.show_adult_content ?? true
    }

    const movies = await getMoviesByGenre(Number.parseInt(params.id), page)

    if (!showAdultContent && movies?.results) {
      movies.results = movies.results.filter((movie: any) => !movie.adult)
    }

    return NextResponse.json(movies)
  } catch (error) {
    console.error("Error fetching movies by genre:", error)
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 })
  }
}
