"use client"

import { Eye, Heart, Bookmark } from "lucide-react"
import { useUserStatus } from "@/hooks/use-user-status"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"

interface ContentStatusIconsProps {
  contentId: number
  contentType: "movie" | "tv" | "anime"
  contentTitle: string
  className?: string
}

export function ContentStatusIcons({ contentId, contentType, contentTitle, className = "" }: ContentStatusIconsProps) {
  const { user } = useAuth()
  const { status, loading, toggleWatched, toggleFavorite, toggleWatchlist } = useUserStatus(contentId, contentType)

  // Don't show icons if user is not logged in
  if (!user) return null

  if (loading) return null

  const hasAnyStatus = status.isWatched || status.isFavorite || status.isInWatchlist

  // Don't render if no status
  if (!hasAnyStatus) return null

  return (
    <div className={`absolute top-2 left-2 flex flex-col gap-1 ${className}`}>
      {status.isWatched && (
        <Badge
          variant="secondary"
          className="bg-green-600/90 text-white p-1 cursor-pointer hover:bg-green-700/90 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWatched(contentTitle)
          }}
        >
          <Eye className="w-3 h-3" />
        </Badge>
      )}

      {status.isFavorite && (
        <Badge
          variant="secondary"
          className="bg-red-600/90 text-white p-1 cursor-pointer hover:bg-red-700/90 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(contentTitle)
          }}
        >
          <Heart className="w-3 h-3 fill-current" />
        </Badge>
      )}

      {status.isInWatchlist && (
        <Badge
          variant="secondary"
          className="bg-blue-600/90 text-white p-1 cursor-pointer hover:bg-blue-700/90 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWatchlist()
          }}
        >
          <Bookmark className="w-3 h-3 fill-current" />
        </Badge>
      )}
    </div>
  )
}
