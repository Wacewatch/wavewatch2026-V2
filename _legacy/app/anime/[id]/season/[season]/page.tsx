import { getSeasonDetails, getTVShowDetails } from "@/lib/tmdb"
import { SeasonDetails } from "@/components/season-details"
import { notFound } from "next/navigation"

interface AnimeSeasonPageProps {
  params: Promise<{
    id: string
    season: string
  }>
}

export default async function AnimeSeasonPage({ params }: AnimeSeasonPageProps) {
  const { id, season } = await params

  try {
    const showId = Number.parseInt(id)
    const seasonNumber = Number.parseInt(season)

    if (isNaN(showId) || isNaN(seasonNumber)) {
      notFound()
    }

    // Récupérer les détails de la série d'abord
    const showData = await getTVShowDetails(showId)
    if (!showData) {
      notFound()
    }

    // Puis récupérer les détails de la saison
    const seasonData = await getSeasonDetails(showId, seasonNumber)
    if (!seasonData) {
      notFound()
    }

    return <SeasonDetails season={seasonData} showId={showId} showData={showData} isAnime />
  } catch (error) {
    console.error("Error fetching anime season details:", error)
    notFound()
  }
}
