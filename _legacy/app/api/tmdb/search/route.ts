import { type NextRequest, NextResponse } from "next/server"
import { searchMulti } from "@/lib/tmdb"
import { createClient } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get("q")
    const page = Number.parseInt(url.searchParams.get("page") || "1")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

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

    const results = await searchMulti(query, page)

    if (!showAdultContent && results?.results) {
      results.results = results.results.filter((item: any) => !item.adult)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}
