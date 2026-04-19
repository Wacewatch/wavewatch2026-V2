import { NextResponse } from "next/server"
import { getTVShowsByGenre } from "@/lib/tmdb"
import { createClient } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")

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

    const shows = await getTVShowsByGenre(Number.parseInt(params.id), page)

    if (!showAdultContent && shows?.results) {
      shows.results = shows.results.filter((show: any) => !show.adult)
    }

    return NextResponse.json(shows)
  } catch (error) {
    console.error("Error fetching TV shows by genre:", error)
    return NextResponse.json({ error: "Failed to fetch TV shows by genre" }, { status: 500 })
  }
}
