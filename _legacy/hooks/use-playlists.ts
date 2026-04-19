"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface PlaylistItem {
  id: string
  tmdb_id: number
  media_type:
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
  poster_path?: string
  position: number
  added_at: string
  episode_id?: number
  series_id?: number
}

interface Playlist {
  id: string
  user_id: string
  title: string
  description?: string
  is_public: boolean
  theme_color: string
  created_at: string
  updated_at: string
  items?: PlaylistItem[]
  items_count?: number
  likes_count?: number
  dislikes_count?: number
  is_liked?: boolean
  is_favorited?: boolean
  username?: string
}

export function usePlaylists() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadUserPlaylists()
    } else {
      setPlaylists([])
      setLoading(false)
    }
  }, [user?.id])

  const loadUserPlaylists = async () => {
    if (!user?.id) return

    try {
      console.log("[v0] Loading playlists for user:", user.id)

      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_items(count)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading playlists:", error)
        return
      }

      console.log("[v0] Playlists loaded successfully:", data?.length || 0)

      const playlistsWithCounts =
        data?.map((playlist) => ({
          ...playlist,
          items_count: playlist.playlist_items?.[0]?.count || 0,
        })) || []

      setPlaylists(playlistsWithCounts)
    } catch (error) {
      console.error("[v0] Error loading playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (title: string, description?: string, isPublic = false, themeColor = "#3B82F6") => {
    if (!user?.id) {
      console.error("[v0] Cannot create playlist: user not authenticated")
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une playlist",
        variant: "destructive",
      })
      return null
    }

    try {
      console.log("[v0] Creating playlist:", { title, description, isPublic, themeColor, userId: user.id })

      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description?.trim(),
          is_public: isPublic,
          theme_color: themeColor,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating playlist:", error)
        toast({
          title: "Erreur",
          description: "Impossible de créer la playlist",
          variant: "destructive",
        })
        return null
      }

      console.log("[v0] Playlist created successfully:", data)

      const newPlaylist = {
        ...data,
        items_count: 0,
      }

      setPlaylists((prev) => [newPlaylist, ...prev])

      toast({
        title: "Playlist créée",
        description: `La playlist "${title}" a été créée avec succès`,
      })

      return newPlaylist
    } catch (error) {
      console.error("[v0] Error creating playlist:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création",
        variant: "destructive",
      })
      return null
    }
  }

  const updatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase
        .from("playlists")
        .update({
          title: updates.title,
          description: updates.description,
          is_public: updates.is_public,
          theme_color: updates.theme_color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", playlistId)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error updating playlist:", error)
        return false
      }

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, ...updates, updated_at: new Date().toISOString() } : playlist,
        ),
      )

      toast({
        title: "Playlist mise à jour",
        description: "Les modifications ont été sauvegardées",
      })

      return true
    } catch (error) {
      console.error("Error updating playlist:", error)
      return false
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting playlist:", error)
        return false
      }

      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId))

      toast({
        title: "Playlist supprimée",
        description: "La playlist a été supprimée définitivement",
      })

      return true
    } catch (error) {
      console.error("Error deleting playlist:", error)
      return false
    }
  }

  const addToPlaylist = async (
    playlistId: string,
    tmdbId: number,
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
      | "retrogaming",
    title: string,
    posterPath?: string,
    episodeId?: number,
    seriesId?: number,
  ) => {
    if (!user?.id) return false

    try {
      const contentId = tmdbId

      console.log("[v0] Adding to playlist:", {
        playlistId,
        contentId,
        mediaType,
        title,
      })

      const { data: existing } = await supabase
        .from("playlist_items")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq("tmdb_id", contentId)
        .eq("media_type", mediaType)
        .maybeSingle()

      if (existing) {
        toast({
          title: "Déjà ajouté",
          description: "Cet élément est déjà dans la playlist",
          variant: "destructive",
        })
        return false
      }

      const { data: maxPos } = await supabase
        .from("playlist_items")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

      const newPosition = (maxPos?.position || 0) + 1

      const { error } = await supabase.from("playlist_items").insert({
        playlist_id: playlistId,
        tmdb_id: contentId,
        media_type: mediaType,
        title: title,
        poster_path: posterPath,
        position: newPosition,
        episode_id: episodeId,
        series_id: seriesId,
      })

      if (error) {
        console.error("[v0] Error adding to playlist:", error)
        toast({
          title: "Erreur",
          description: `Impossible d'ajouter à la playlist: ${error.message}`,
          variant: "destructive",
        })
        return false
      }

      console.log("[v0] Successfully added item to playlist")

      await supabase.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId)

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, items_count: (playlist.items_count || 0) + 1, updated_at: new Date().toISOString() }
            : playlist,
        ),
      )

      toast({
        title: "Ajouté à la playlist",
        description: `"${title}" a été ajouté à la playlist`,
      })

      return true
    } catch (error) {
      console.error("[v0] Error adding to playlist:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout",
        variant: "destructive",
      })
      return false
    }
  }

  const removeFromPlaylist = async (playlistId: string, itemId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.from("playlist_items").delete().eq("id", itemId).eq("playlist_id", playlistId)

      if (error) {
        console.error("Error removing from playlist:", error)
        return false
      }

      await supabase.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId)

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId
            ? {
                ...playlist,
                items_count: Math.max((playlist.items_count || 1) - 1, 0),
                updated_at: new Date().toISOString(),
              }
            : playlist,
        ),
      )

      toast({
        title: "Retiré de la playlist",
        description: "L'élément a été retiré de la playlist",
      })

      return true
    } catch (error) {
      console.error("Error removing from playlist:", error)
      return false
    }
  }

  const getPlaylistItems = async (playlistId: string) => {
    if (!user?.id) return []

    try {
      console.log("[v0] Loading playlist items for playlist:", playlistId)

      const { data, error } = await supabase
        .from("playlist_items")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true })

      if (error) {
        console.error("[v0] Error loading playlist items:", error)
        return []
      }

      console.log("[v0] Playlist items loaded successfully:", data?.length || 0)

      return (
        data?.map((item) => ({
          ...item,
          content_type: item.media_type,
          content_id: item.tmdb_id,
        })) || []
      )
    } catch (error) {
      console.error("[v0] Error loading playlist items:", error)
      return []
    }
  }

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistItems,
    refreshPlaylists: loadUserPlaylists,
  }
}
