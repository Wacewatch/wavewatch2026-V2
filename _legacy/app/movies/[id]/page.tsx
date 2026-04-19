import { getMovieDetails, getMovieCredits } from "@/lib/tmdb"
import { MovieDetails } from "@/components/movie-details"
import { notFound } from "next/navigation"

interface MoviePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params

  try {
    const [movie, credits] = await Promise.all([
      getMovieDetails(Number.parseInt(id)),
      getMovieCredits(Number.parseInt(id)),
    ])

    if (!movie) {
      notFound()
    }

    return <MovieDetails movie={movie} credits={credits} />
  } catch (error) {
    console.error("Error fetching movie details:", error)
    notFound()
  }
}
