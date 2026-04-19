"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, User, Calendar, Lock, Globe } from "lucide-react"
import Link from "next/link"

interface PlaylistCardProps {
  playlist: {
    id: string
    name: string
    description?: string
    is_public: boolean
    created_at: string
    user_id: string
    username?: string
    item_count?: number
  }
  showUser?: boolean
}

export function PlaylistCard({ playlist, showUser = true }: PlaylistCardProps) {
  return (
    <Link href={`/playlists/${playlist.id}`}>
      <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {playlist.name}
              </CardTitle>
              {playlist.description && (
                <CardDescription className="text-gray-400 mt-1 line-clamp-2">{playlist.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {playlist.is_public ? (
                <Globe className="h-4 w-4 text-green-400" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                <span>{playlist.item_count || 0} éléments</span>
              </div>
              {showUser && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{playlist.username || "Utilisateur"}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={playlist.is_public ? "default" : "secondary"} className="text-xs">
              {playlist.is_public ? "Publique" : "Privée"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
