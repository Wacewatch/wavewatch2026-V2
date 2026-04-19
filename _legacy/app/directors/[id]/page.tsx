import { getDirectorDetails, getDirectorCredits } from "@/lib/tmdb"
import { DirectorDetails } from "@/components/director-details"
import { notFound } from "next/navigation"

interface DirectorPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DirectorPage({ params }: DirectorPageProps) {
  const { id } = await params

  try {
    const [director, credits] = await Promise.all([
      getDirectorDetails(Number.parseInt(id)),
      getDirectorCredits(Number.parseInt(id)),
    ])

    if (!director) {
      notFound()
    }

    return <DirectorDetails director={director} credits={credits} />
  } catch (error) {
    console.error("Error fetching director details:", error)
    notFound()
  }
}
