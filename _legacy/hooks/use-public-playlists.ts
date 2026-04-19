"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface PublicPlaylist {
  id: string
  user_id: string
  title: string
  description?: string
  theme_color: string
  created_at: string
  updated_at: string
  username: string
  items_count: number
  likes_count: number
  dislikes_count: number
  is_liked?: boolean
  is_disliked?: boolean
  is_favorited?: boolean
}

export function usePublicPlaylists() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "liked">("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(30)
  const supabase = createClient()
  const isMountedRef = useRef(true)

  const loadPublicPlaylists = useCallback(
    async (page = 1, sort: "recent" | "liked" = "recent") => {
      if (!isMountedRef.current) return

      try {
        console.log("[v0] Loading public playlists... page:", page, "sort:", sort)

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000))

        const { count } = await supabase
          .from("playlists")
          .select("*", { count: "exact", head: true })
          .eq("is_public", true)

        if (count !== null) {
          setTotalCount(count)
        }

        const offset = (page - 1) * itemsPerPage

        let query = supabase
          .from("playlists")
          .select("id, user_id, title, description, theme_color, created_at, updated_at")
          .eq("is_public", true)

        if (sort === "liked") {
          const likedSortingPromise = (async () => {
            // On utilise une sous-requête pour compter les likes et trier
            const { data: playlistsWithLikes } = await supabase
              .from("playlists")
              .select(`
              id,
              user_id,
              title,
              description,
              theme_color,
              created_at,
              updated_at,
              playlist_likes!inner(is_like)
            `)
              .eq("is_public", true)

            // Grouper et compter les likes par playlist
            const playlistLikeCounts = new Map<string, number>()
            playlistsWithLikes?.forEach((playlist: any) => {
              const likes = Array.isArray(playlist.playlist_likes)
                ? playlist.playlist_likes.filter((like: any) => like.is_like === true).length
                : 0
              playlistLikeCounts.set(playlist.id, likes)
            })

            // Obtenir toutes les playlists publiques
            const { data: allPlaylists } = await supabase
              .from("playlists")
              .select("id, user_id, title, description, theme_color, created_at, updated_at")
              .eq("is_public", true)

            // Trier par nombre de likes (en incluant les playlists sans likes)
            const sortedPlaylists = (allPlaylists || []).sort((a, b) => {
              const likesA = playlistLikeCounts.get(a.id) || 0
              const likesB = playlistLikeCounts.get(b.id) || 0
              return likesB - likesA
            })

            // Paginer après le tri
            const paginatedPlaylists = sortedPlaylists.slice(offset, offset + itemsPerPage)

            return paginatedPlaylists
          })()

          const playlistsData = (await Promise.race([likedSortingPromise, timeoutPromise])) as any

          if (!isMountedRef.current) return

          if (!playlistsData || playlistsData.length === 0) {
            console.log("[v0] No public playlists found")
            setPlaylists([])
            setLoading(false)
            return
          }

          console.log("[v0] Loaded", playlistsData.length, "public playlists")

          const playlistIds = playlistsData.map((p) => p.id)
          const userIds = [...new Set(playlistsData.map((p) => p.user_id))]

          console.log("[v0] Loading profiles for", userIds.length, "users")

          const { data: userProfilesData, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, username, email")
            .in("id", userIds)

          if (profilesError) {
            console.error("[v0] Error loading user profiles:", profilesError.message)
          }

          console.log("[v0] Loaded", userProfilesData?.length || 0, "user profiles")

          const userProfilesMap = new Map(
            (userProfilesData || []).map((profile) => {
              const displayName = profile.username || (profile.email ? profile.email.split("@")[0] : "Utilisateur")
              console.log("[v0] Mapping user", profile.id, "to", displayName)
              return [profile.id, { ...profile, displayName }]
            }),
          )

          console.log("[v0] Created username map with", userProfilesMap.size, "entries")

          const [itemsCountsResult, likesDataResult, userLikesResult, userFavoritesResult] = await Promise.all([
            supabase.from("playlist_items").select("playlist_id").in("playlist_id", playlistIds),
            supabase.from("playlist_likes").select("playlist_id, is_like").in("playlist_id", playlistIds),
            user?.id
              ? supabase
                  .from("playlist_likes")
                  .select("playlist_id, is_like")
                  .eq("user_id", user.id)
                  .in("playlist_id", playlistIds)
              : Promise.resolve({ data: [] }),
            user?.id
              ? supabase
                  .from("playlist_favorites")
                  .select("playlist_id")
                  .eq("user_id", user.id)
                  .in("playlist_id", playlistIds)
              : Promise.resolve({ data: [] }),
          ])

          const itemsCounts = itemsCountsResult.data || []
          const likesData = likesDataResult.data || []
          const userLikes = userLikesResult.data || []
          const userFavorites = userFavoritesResult.data || []

          const processedPlaylists = playlistsData.map((playlist) => {
            const itemsCount = itemsCounts.filter((item) => item.playlist_id === playlist.id).length
            const playlistLikes = likesData.filter((like) => like.playlist_id === playlist.id)
            const likesCount = playlistLikes.filter((like) => like.is_like).length
            const dislikesCount = playlistLikes.filter((like) => !like.is_like).length

            const userLike = userLikes.find((like) => like.playlist_id === playlist.id)
            const isFavorited = userFavorites.some((fav) => fav.playlist_id === playlist.id)

            const userProfile = userProfilesMap.get(playlist.user_id)
            const username = userProfile?.displayName || "Utilisateur inconnu"

            console.log("[v0] Playlist", playlist.title, "- user_id:", playlist.user_id, "- username:", username)

            return {
              ...playlist,
              username,
              items_count: itemsCount,
              likes_count: likesCount,
              dislikes_count: dislikesCount,
              is_liked: userLike?.is_like === true,
              is_disliked: userLike?.is_like === false,
              is_favorited: isFavorited,
            }
          })

          console.log("[v0] Public playlists loaded successfully:", processedPlaylists.length)
          console.log(
            "[v0] Sample usernames:",
            processedPlaylists.slice(0, 3).map((p) => ({ title: p.title, username: p.username })),
          )

          setPlaylists(processedPlaylists)
          setCurrentPage(page)
        } else {
          query = query.order("updated_at", { ascending: false })
          query = query.range(offset, offset + itemsPerPage - 1)

          const queryPromise = query
          const { data: playlistsData, error: playlistsError } = (await Promise.race([
            queryPromise,
            timeoutPromise,
          ])) as any

          if (!isMountedRef.current) return

          if (playlistsError) {
            console.error("[v0] Error loading public playlists:", playlistsError.message)
            throw playlistsError
          }

          if (!playlistsData || playlistsData.length === 0) {
            console.log("[v0] No public playlists found")
            setPlaylists([])
            setLoading(false)
            return
          }

          console.log("[v0] Loaded", playlistsData.length, "public playlists")

          const playlistIds = playlistsData.map((p) => p.id)
          const userIds = [...new Set(playlistsData.map((p) => p.user_id))]

          console.log("[v0] Loading profiles for", userIds.length, "users")

          const { data: userProfilesData, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, username, email")
            .in("id", userIds)

          if (profilesError) {
            console.error("[v0] Error loading user profiles:", profilesError.message)
          }

          console.log("[v0] Loaded", userProfilesData?.length || 0, "user profiles")

          const userProfilesMap = new Map(
            (userProfilesData || []).map((profile) => {
              const displayName = profile.username || (profile.email ? profile.email.split("@")[0] : "Utilisateur")
              console.log("[v0] Mapping user", profile.id, "to", displayName)
              return [profile.id, { ...profile, displayName }]
            }),
          )

          console.log("[v0] Created username map with", userProfilesMap.size, "entries")

          const [itemsCountsResult, likesDataResult, userLikesResult, userFavoritesResult] = await Promise.all([
            supabase.from("playlist_items").select("playlist_id").in("playlist_id", playlistIds),
            supabase.from("playlist_likes").select("playlist_id, is_like").in("playlist_id", playlistIds),
            user?.id
              ? supabase
                  .from("playlist_likes")
                  .select("playlist_id, is_like")
                  .eq("user_id", user.id)
                  .in("playlist_id", playlistIds)
              : Promise.resolve({ data: [] }),
            user?.id
              ? supabase
                  .from("playlist_favorites")
                  .select("playlist_id")
                  .eq("user_id", user.id)
                  .in("playlist_id", playlistIds)
              : Promise.resolve({ data: [] }),
          ])

          const itemsCounts = itemsCountsResult.data || []
          const likesData = likesDataResult.data || []
          const userLikes = userLikesResult.data || []
          const userFavorites = userFavoritesResult.data || []

          const processedPlaylists = playlistsData.map((playlist) => {
            const itemsCount = itemsCounts.filter((item) => item.playlist_id === playlist.id).length
            const playlistLikes = likesData.filter((like) => like.playlist_id === playlist.id)
            const likesCount = playlistLikes.filter((like) => like.is_like).length
            const dislikesCount = playlistLikes.filter((like) => !like.is_like).length

            const userLike = userLikes.find((like) => like.playlist_id === playlist.id)
            const isFavorited = userFavorites.some((fav) => fav.playlist_id === playlist.id)

            const userProfile = userProfilesMap.get(playlist.user_id)
            const username = userProfile?.displayName || "Utilisateur inconnu"

            console.log("[v0] Playlist", playlist.title, "- user_id:", playlist.user_id, "- username:", username)

            return {
              ...playlist,
              username,
              items_count: itemsCount,
              likes_count: likesCount,
              dislikes_count: dislikesCount,
              is_liked: userLike?.is_like === true,
              is_disliked: userLike?.is_like === false,
              is_favorited: isFavorited,
            }
          })

          console.log("[v0] Public playlists loaded successfully:", processedPlaylists.length)
          console.log(
            "[v0] Sample usernames:",
            processedPlaylists.slice(0, 3).map((p) => ({ title: p.title, username: p.username })),
          )

          setPlaylists(processedPlaylists)
          setCurrentPage(page)
        }
      } catch (error) {
        if (!isMountedRef.current) return

        console.error("[v0] Exception loading public playlists:", error)

        if (error instanceof SyntaxError && error.message.includes("JSON")) {
          console.error("[v0] ❌ JSON PARSING ERROR")
          console.error("[v0] Supabase is returning text 'Invalid request' instead of JSON")
          console.error("[v0] This happens when:")
          console.error("[v0]   1. Supabase project is PAUSED - https://supabase.com/dashboard")
          console.error("[v0]   2. Database tables don't exist - run migrations")
          console.error("[v0]   3. Wrong environment variables")
          console.error("[v0] Current env check:")
          console.error("[v0]   - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING")
          console.error(
            "[v0]   - NEXT_PUBLIC_SUPABASE_ANON_KEY:",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? `SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)`
              : "MISSING",
          )
        }

        setPlaylists([])
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [user?.id, supabase, itemsPerPage],
  )

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    loadPublicPlaylists(1, sortBy)
  }, [sortBy, loadPublicPlaylists])

  const toggleLike = async (playlistId: string, isLike: boolean) => {
    if (!user?.id) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour liker une playlist",
        variant: "destructive",
      })
      return
    }

    try {
      const currentPlaylist = playlists.find((p) => p.id === playlistId)
      if (!currentPlaylist) return

      const { data: existingLike } = await supabase
        .from("playlist_likes")
        .select("id, is_like")
        .eq("playlist_id", playlistId)
        .eq("user_id", user.id)
        .single()

      if (existingLike) {
        if (existingLike.is_like === isLike) {
          await supabase.from("playlist_likes").delete().eq("id", existingLike.id)

          setPlaylists((prev) =>
            prev.map((playlist) => {
              if (playlist.id === playlistId) {
                return {
                  ...playlist,
                  likes_count: isLike ? playlist.likes_count - 1 : playlist.likes_count,
                  dislikes_count: !isLike ? playlist.dislikes_count - 1 : playlist.dislikes_count,
                  is_liked: false,
                  is_disliked: false,
                }
              }
              return playlist
            }),
          )
        } else {
          await supabase.from("playlist_likes").update({ is_like: isLike }).eq("id", existingLike.id)

          setPlaylists((prev) =>
            prev.map((playlist) => {
              if (playlist.id === playlistId) {
                return {
                  ...playlist,
                  likes_count: isLike ? playlist.likes_count + 1 : playlist.likes_count - 1,
                  dislikes_count: !isLike ? playlist.dislikes_count + 1 : playlist.dislikes_count - 1,
                  is_liked: isLike,
                  is_disliked: !isLike,
                }
              }
              return playlist
            }),
          )
        }
      } else {
        await supabase.from("playlist_likes").insert({
          playlist_id: playlistId,
          user_id: user.id,
          is_like: isLike,
        })

        setPlaylists((prev) =>
          prev.map((playlist) => {
            if (playlist.id === playlistId) {
              return {
                ...playlist,
                likes_count: isLike ? playlist.likes_count + 1 : playlist.likes_count,
                dislikes_count: !isLike ? playlist.dislikes_count + 1 : playlist.dislikes_count,
                is_liked: isLike,
                is_disliked: !isLike,
              }
            }
            return playlist
          }),
        )
      }

      toast({
        title: isLike ? "Playlist likée" : "Playlist dislikée",
        description: isLike ? "Ajoutée à vos likes" : "Ajoutée à vos dislikes",
      })
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre réaction",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = async (playlistId: string) => {
    if (!user?.id) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris",
        variant: "destructive",
      })
      return
    }

    try {
      const currentPlaylist = playlists.find((p) => p.id === playlistId)
      if (!currentPlaylist) return

      const { WatchTracker } = await import("@/lib/watch-tracking")

      const playlistData = {
        id: playlistId,
        title: currentPlaylist.title,
        type: "playlist" as const,
        posterPath: "/placeholder.svg?key=ywpkd",
        addedAt: new Date(),
        tmdbId: 0,
      }

      if (currentPlaylist.is_favorited) {
        await supabase.from("playlist_favorites").delete().eq("playlist_id", playlistId).eq("user_id", user.id)

        WatchTracker.removeFromFavorites(playlistId, "playlist")

        setPlaylists((prev) =>
          prev.map((playlist) => (playlist.id === playlistId ? { ...playlist, is_favorited: false } : playlist)),
        )

        toast({
          title: "Retiré des favoris",
          description: "La playlist a été retirée de vos favoris",
        })
      } else {
        await supabase.from("playlist_favorites").insert({
          playlist_id: playlistId,
          user_id: user.id,
        })

        WatchTracker.addToFavorites(playlistData)

        setPlaylists((prev) =>
          prev.map((playlist) => (playlist.id === playlistId ? { ...playlist, is_favorited: true } : playlist)),
        )

        toast({
          title: "Ajouté aux favoris",
          description: "La playlist a été ajoutée à vos favoris",
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos favoris",
        variant: "destructive",
      })
    }
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.items_count > 0 &&
      (playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.username.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return {
    playlists: filteredPlaylists,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    toggleLike,
    toggleFavorite,
    refreshPlaylists: loadPublicPlaylists,
    currentPage,
    setCurrentPage,
    totalCount,
    itemsPerPage,
    totalPages: Math.ceil(totalCount / itemsPerPage),
    goToPage: (page: number) => loadPublicPlaylists(page, sortBy),
  }
}
