import { getSeasonDetails, getTVShowDetails } from "@/lib/tmdb"
import { EpisodeDetails } from "@/components/episode-details"
import { notFound } from "next/navigation"

interface EpisodePageProps {
  params: Promise<{
    id: string
    season: string
    episode: string
  }>
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { id, season, episode } = await params

  try {
    const showId = Number.parseInt(id)
    const seasonNumber = Number.parseInt(season)
    const episodeNumber = Number.parseInt(episode)

    if (isNaN(showId) || isNaN(seasonNumber) || isNaN(episodeNumber)) {
      notFound()
    }

    // Récupérer les détails de la série et de la saison
    const [showData, seasonData] = await Promise.all([getTVShowDetails(showId), getSeasonDetails(showId, seasonNumber)])

    if (!showData || !seasonData?.episodes) {
      notFound()
    }

    // Trouver l'épisode spécifique
    const episodeData = seasonData.episodes.find((ep: any) => ep.episode_number === episodeNumber)

    if (!episodeData) {
      notFound()
    }

    return (
      <EpisodeDetails
        episode={episodeData}
        showId={showId}
        seasonNumber={seasonNumber}
        showData={showData}
        isAnime={false}
      />
    )
  } catch (error) {
    console.error("Error fetching episode details:", error)
    notFound()
  }
}
