"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"

interface Actor {
  id: number
  name: string
  profile_path: string | null
}

interface ActorFavoriteButtonProps {
  actor: Actor
}

export function ActorFavoriteButton({ actor }: ActorFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    setIsFavorite(WatchTracker.isFavorite("actor", actor.id))
  }, [actor.id])

  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris.",
        variant: "destructive",
      })
      return
    }

    const wasAdded = WatchTracker.toggleFavorite("actor", actor.id, actor.name, {
      profilePath: actor.profile_path,
    })
    setIsFavorite(wasAdded)

    toast({
      title: wasAdded ? "Ajouté aux favoris" : "Retiré des favoris",
      description: `${actor.name} a été ${wasAdded ? "ajouté à" : "retiré de"} vos favoris.`,
    })
  }

  return (
    <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} className="w-full">
      <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
      {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    </Button>
  )
}
