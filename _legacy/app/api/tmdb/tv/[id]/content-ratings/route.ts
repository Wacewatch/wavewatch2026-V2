import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${params.id}/content_ratings?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch content ratings")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching content ratings:", error)
    return NextResponse.json({ error: "Failed to fetch content ratings" }, { status: 500 })
  }
}
