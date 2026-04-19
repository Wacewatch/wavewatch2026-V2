import Image from "next/image"
import Link from "next/link"

interface CastListProps {
  cast: any[]
}

export function CastList({ cast }: CastListProps) {
  if (!cast || cast.length === 0) {
    return null
  }

  return (
    <div className="mobile-slider">
      <div className="flex gap-3 md:gap-4 pb-4 overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible">
        {cast.slice(0, 12).map((actor: any) => (
          <Link key={actor.id} href={`/actors/${actor.id}`}>
            <div className="space-y-2 group cursor-pointer w-40 md:w-auto flex-shrink-0">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                <Image
                  src={
                    actor.profile_path
                      ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                      : "/placeholder.svg?height=450&width=300"
                  }
                  alt={actor.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 160px, (max-width: 1200px) 25vw, 16vw"
                />
              </div>
              <div className="px-1">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">{actor.name}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{actor.character}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
