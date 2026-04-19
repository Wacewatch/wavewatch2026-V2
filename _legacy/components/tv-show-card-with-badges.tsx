"use client"
import { TVShowCard } from "./tv-show-card"
import { useDatabaseTracking } from "@/hooks/use-database-tracking"
import { Badge } from "@/components/ui/badge"

export interface TVShowCardWithBadgesProps {
  id: string
  title: string
  poster_path: string
  vote_average: number
  first_air_date: string
  origin_country: string[]
}

export const TVShowCardWithBadges = ({
  id,
  title,
  poster_path,
  vote_average,
  first_air_date,
  origin_country,
}: TVShowCardWithBadgesProps) => {
  const { track } = useDatabaseTracking()

  const handleTrackClick = () => {
    track("tv_show_card_click", {
      tv_show_id: id,
      tv_show_title: title,
    })
  }

  return (
    <div className="relative">
      <TVShowCard
        id={id}
        title={title}
        poster_path={poster_path}
        vote_average={vote_average}
        first_air_date={first_air_date}
        origin_country={origin_country}
        onClick={handleTrackClick}
      />
      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
        {origin_country.map((country) => (
          <Badge key={country}>{country}</Badge>
        ))}
      </div>
    </div>
  )
}
