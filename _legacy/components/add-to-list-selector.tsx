"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, List } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { usePlaylists } from "@/hooks/use-playlists"
import { toast } from "@/hooks/use-toast"

interface AddToListSelectorProps {
  content: {
    id: number
    title?: string
    name?: string
    poster_path?: string
    vote_average?: number
    release_date?: string
    first_air_date?: string
  }
  contentType: "movie" | "tv"
  className?: string
}

export function AddToListSelector({ content, contentType, className = "" }: AddToListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const { playlists, addToPlaylist, isLoading: playlistsLoading } = usePlaylists()

  if (!user) return null

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await addToPlaylist(playlistId, content.id, contentType, content.title || content.name || "", content.poster_path)

      toast({
        title: "Ajouté à la playlist",
        description: `${content.title || content.name} a été ajouté à votre playlist.`,
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter à la playlist.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-blue-600 text-white hover:bg-blue-800 bg-blue-900/50 ${className}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter à une playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Ajouter à une playlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Playlists */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <h4 className="text-sm font-medium text-gray-300">Mes Playlists</h4>
            <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
              <div className="space-y-2 pr-4">
                {playlists.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">Aucune playlist créée</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                      onClick={() => {
                        setIsOpen(false)
                        window.location.href = "/playlists"
                      }}
                    >
                      Créer ma première playlist
                    </Button>
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${playlist.theme_color}20` }}>
                          <List className="w-4 h-4" style={{ color: playlist.theme_color }} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{playlist.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-400">{playlist.items_count || 0} éléments</p>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                              {playlist.is_public ? "Public" : "Privé"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
