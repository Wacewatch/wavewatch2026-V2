import { getTVShowDetails, getTVShowCredits } from "@/lib/tmdb"
import { TVShowDetails } from "@/components/tv-show-details"
import { notFound } from "next/navigation"

interface TVShowPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TVShowPage({ params }: TVShowPageProps) {
  const { id } = await params

  try {
    const [show, credits] = await Promise.all([
      getTVShowDetails(Number.parseInt(id)),
      getTVShowCredits(Number.parseInt(id)),
    ])

    if (!show) {
      notFound()
    }

    return <TVShowDetails show={show} credits={credits} />
  } catch (error) {
    console.error("Error fetching TV show details:", error)
    notFound()
  }
}
