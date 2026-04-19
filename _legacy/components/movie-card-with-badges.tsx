"use client"
import { MovieCard } from "./movie-card"
import { useDatabaseTracking } from "@/hooks/use-database-tracking"
import { Badge } from "@/components/ui/badge"

interface MovieCardWithBadgesProps {
  movieId: string
  title: string
  posterPath: string
  voteAverage: number
  releaseDate: string
  genreIds: number[]
}

export const MovieCardWithBadges = ({
  movieId,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  genreIds,
}: MovieCardWithBadgesProps) => {
  const { trackMovieClick } = useDatabaseTracking()

  const handleMovieClick = () => {
    trackMovieClick(movieId)
  }

  return (
    <MovieCard
      movieId={movieId}
      title={title}
      posterPath={posterPath}
      voteAverage={voteAverage}
      releaseDate={releaseDate}
      genreIds={genreIds}
      onClick={handleMovieClick}
    >
      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
        {voteAverage > 7 && <Badge variant="secondary">Popular</Badge>}
        {/* You can add more badges based on different criteria here */}
      </div>
    </MovieCard>
  )
}
