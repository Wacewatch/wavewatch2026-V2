import { NextResponse } from "next/server"
import { getPopularActors } from "@/lib/tmdb"

export async function GET() {
  try {
    const data = await getPopularActors()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching popular actors:", error)
    return NextResponse.json({ error: "Failed to fetch popular actors" }, { status: 500 })
  }
}
