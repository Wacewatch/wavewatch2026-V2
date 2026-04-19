import { NextResponse } from "next/server"
import { getTrendingAnime } from "@/lib/tmdb"

export async function GET() {
  try {
    const data = await getTrendingAnime()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching trending anime:", error)
    return NextResponse.json({ error: "Failed to fetch trending anime" }, { status: 500 })
  }
}
