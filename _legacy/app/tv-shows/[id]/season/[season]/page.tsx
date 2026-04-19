import { getSeasonDetails } from "@/lib/tmdb"
import { SeasonDetails } from "@/components/season-details"
import { notFound } from "next/navigation"

interface SeasonPageProps {
  params: Promise<{
    id: string
    season: string
  }>
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { id, season } = await params

  try {
    const seasonData = await getSeasonDetails(Number.parseInt(id), Number.parseInt(season))

    if (!seasonData) {
      notFound()
    }

    return <SeasonDetails season={seasonData} showId={Number.parseInt(id)} />
  } catch (error) {
    console.error("Error fetching season details:", error)
    notFound()
  }
}
