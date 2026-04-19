import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string; seasonNumber: string } }) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${params.id}/season/${params.seasonNumber}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch season details")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching season details:", error)
    return NextResponse.json({ error: "Failed to fetch season details" }, { status: 500 })
  }
}
