import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActorCardProps {
  actor: {
    id: number
    name: string
    profile_path: string
    known_for_department: string
    known_for: any[]
  }
}

export function ActorCard({ actor }: ActorCardProps) {
  const profileUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
    : "/placeholder.svg?height=750&width=500"

  return (
    <Link href={`/actors/${actor.id}`}>
      <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] md:aspect-[2/3]">
            <Image
              src={profileUrl || "/placeholder.svg"}
              alt={actor.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                {actor.known_for_department}
              </Badge>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{actor.name}</h3>
            {actor.known_for && actor.known_for.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {actor.known_for[0].title || actor.known_for[0].name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
