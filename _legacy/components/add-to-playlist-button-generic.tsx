"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { usePlaylists } from "@/hooks/use-playlists"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface AddToPlaylistButtonGenericProps {
  itemId: number
  mediaType:
    | "movie"
    | "tv"
    | "tv-channel"
    | "radio"
    | "game"
    | "ebook"
    | "episode"
    | "music"
    | "software"
    | "retrogaming"
  title: string
  posterPath?: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  episodeId?: number
  seriesId?: number
}

export function AddToPlaylistButtonGeneric({
  itemId,
  mediaType,
  title,
  posterPath,
  className,
  variant = "outline",
  size = "sm",
  episodeId,
  seriesId,
}: AddToPlaylistButtonGenericProps) {
  const { user } = useAuth()
  const { playlists, addToPlaylist } = usePlaylists()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const handleAddToPlaylist = async (playlistId: string) => {
    setAdding(playlistId)

    const success = await addToPlaylist(playlistId, itemId, mediaType, title, posterPath, episodeId, seriesId)

    if (success) {
      setOpen(false)
    }

    setAdding(null)
  }

  if (!user) {
    return (
      <Button variant={variant} size={size} className={`border-gray-600 text-gray-400 ${className}`} disabled>
        <Plus className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`border-gray-600 text-white hover:bg-gray-700 ${className}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Ajouter à une playlist</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choisissez une playlist pour ajouter "{title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {playlists.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Vous n'avez pas encore de playlist.</p>
              <Button asChild variant="outline" size="sm" className="mt-2 border-gray-600 text-gray-300 bg-transparent">
                <a href="/playlists">Créer une playlist</a>
              </Button>
            </div>
          ) : (
            playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3 hover:bg-gray-700"
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={adding === playlist.id}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: playlist.theme_color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{playlist.title}</p>
                    <p className="text-sm text-gray-400">{playlist.items_count || 0} éléments</p>
                  </div>
                  {adding === playlist.id ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
