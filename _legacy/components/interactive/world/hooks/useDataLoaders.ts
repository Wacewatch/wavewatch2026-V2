"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { setGlobalDiscoStreamUrls, setGlobalDiscoVolume, setGlobalDiscoIsOpen, setGlobalArcadeIsOpen } from "../audio"

const supabase = createClient()

interface ArcadeGame {
  id: string
  name: string
  url: string
  media: { type: string; src: string }
  openInNewTab: boolean
  useProxy: boolean
}

interface UseDataLoadersProps {
  userId: string
}

interface UseDataLoadersReturn {
  // Players
  otherPlayers: any[]
  setOtherPlayers: React.Dispatch<React.SetStateAction<any[]>>
  // Arcade
  arcadeMachines: ArcadeGame[]
  isArcadeOpen: boolean
  setIsArcadeOpen: React.Dispatch<React.SetStateAction<boolean>>
  // Stadium
  stadium: any
  isStadiumOpen: boolean
  setIsStadiumOpen: React.Dispatch<React.SetStateAction<boolean>>
  // Disco
  isDiscoOpen: boolean
  setIsDiscoOpen: React.Dispatch<React.SetStateAction<boolean>>
  // Cinema
  cinemaRooms: any[]
  loadCinemaRooms: () => Promise<void>
}

export function useDataLoaders({ userId }: UseDataLoadersProps): UseDataLoadersReturn {
  // Players state
  const [otherPlayers, setOtherPlayers] = useState<any[]>([])

  // Arcade state
  const [arcadeMachines, setArcadeMachines] = useState<ArcadeGame[]>([])
  const [isArcadeOpen, setIsArcadeOpen] = useState(true)

  // Stadium state
  const [stadium, setStadium] = useState<any>(null)
  const [isStadiumOpen, setIsStadiumOpen] = useState(true)

  // Disco state
  const [isDiscoOpen, setIsDiscoOpen] = useState(true)

  // Cinema state
  const [cinemaRooms, setCinemaRooms] = useState<any[]>([])

  // Load players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString()

        const { data: profiles, error: profilesError } = await supabase
          .from("interactive_profiles")
          .select("*")
          .eq("is_online", true)
          .neq("user_id", userId)
          .gte("last_seen", thirtySecondsAgo)
          .not("position_x", "is", null)
          .not("position_y", "is", null)
          .not("position_z", "is", null)

        if (profilesError) {
          console.error("[DataLoaders] Error loading profiles:", profilesError)
          return
        }

        if (profiles && profiles.length > 0) {
          const userIds = profiles.map((p) => p.user_id)

          const { data: userProfiles, error: userProfilesError } = await supabase
            .from("user_profiles")
            .select("id, username, is_admin, is_vip, is_vip_plus")
            .in("id", userIds)

          if (userProfilesError) {
            console.error("[DataLoaders] Error loading user profiles:", userProfilesError)
          }

          const { data: userXpData, error: xpError } = await supabase
            .from("interactive_user_xp")
            .select("user_id, level, xp")
            .in("user_id", userIds)

          if (xpError) {
            console.error("[DataLoaders] Error loading user XP data:", xpError)
          }

          const mergedData = profiles.map((profile) => ({
            ...profile,
            user_profiles: userProfiles?.find((up) => up?.id === profile.user_id) || {
              username: profile.username,
              is_admin: false,
              is_vip: false,
              is_vip_plus: false,
            },
            level: userXpData?.find((xp) => xp.user_id === profile.user_id)?.level || 1,
          }))

          setOtherPlayers(mergedData)
        } else {
          setOtherPlayers([])
        }
      } catch (err) {
        console.error("[DataLoaders] Failed to load players:", err)
      }
    }

    const updateOnlineStatus = () => {
      supabase
        .from("interactive_profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("user_id", userId)
        .then()
    }

    updateOnlineStatus()
    loadPlayers()

    const interval = setInterval(loadPlayers, 5000)
    const heartbeatInterval = setInterval(updateOnlineStatus, 10000)

    const channel = supabase
      .channel("players")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_profiles",
        },
        () => {
          loadPlayers()
        },
      )
      .subscribe()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateOnlineStatus()
        loadPlayers()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const handleBeforeUnload = () => {
      const payload = JSON.stringify({ user_id: userId })
      navigator.sendBeacon?.("/api/interactive/disconnect", payload)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      clearInterval(heartbeatInterval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handleBeforeUnload)
      supabase.removeChannel(channel)
      supabase
        .from("interactive_profiles")
        .update({ is_online: false, is_dancing: false, last_seen: new Date().toISOString() })
        .eq("user_id", userId)
        .then()
    }
  }, [userId])

  // Load arcade games
  useEffect(() => {
    const loadArcadeGames = async () => {
      try {
        const { data, error } = await supabase
          .from("arcade_games")
          .select("*")
          .eq("is_active", true)
          .order("display_order")

        if (error) throw error

        if (data && data.length > 0) {
          const formattedGames = data.map((game) => ({
            id: game.id,
            name: game.name,
            url: game.url,
            media: { type: game.media_type, src: game.image_url || "" },
            openInNewTab: game.open_in_new_tab,
            useProxy: game.use_proxy,
          }))
          setArcadeMachines(formattedGames)
        }
      } catch (error) {
        console.error("[DataLoaders] Error loading arcade games:", error)
      }
    }

    loadArcadeGames()
  }, [])

  // Load stadium
  useEffect(() => {
    const loadStadium = async () => {
      const { data } = await supabase.from("interactive_stadium").select("*").single()

      if (data) {
        setStadium(data)
        setIsStadiumOpen(data.is_open !== false)
      }
    }

    loadStadium()

    const channel = supabase
      .channel("stadium")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_stadium",
        },
        loadStadium,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Load disco settings
  useEffect(() => {
    const loadDiscoSettings = async () => {
      const { data } = await supabase.from("interactive_disco").select("*").single()

      if (data) {
        if (data.stream_urls && Array.isArray(data.stream_urls) && data.stream_urls.length > 0) {
          setGlobalDiscoStreamUrls(data.stream_urls)
        }
        if (data.volume !== undefined) {
          setGlobalDiscoVolume(data.volume)
        }
        setGlobalDiscoIsOpen(data.is_open !== false)
        setIsDiscoOpen(data.is_open !== false)
      }
    }

    loadDiscoSettings()
  }, [])

  // Load arcade settings
  useEffect(() => {
    const loadArcadeSettings = async () => {
      const { data } = await supabase.from("interactive_arcade_settings").select("*").single()

      if (data) {
        setGlobalArcadeIsOpen(data.is_open !== false)
        setIsArcadeOpen(data.is_open !== false)
      }
    }

    loadArcadeSettings()
  }, [])

  // Load cinema rooms
  const loadCinemaRooms = useCallback(async () => {
    const { data } = await supabase
      .from("interactive_cinema_rooms")
      .select("*")
      .eq("is_open", true)
      .order("room_number")

    console.log("[v0] [DataLoaders] Loaded cinema rooms:", data?.length || 0)
    if (data) {
      console.log(
        "[v0] [DataLoaders] Cinema rooms details:",
        data.map((r) => ({
          id: r.id,
          room_number: r.room_number,
          name: r.name,
          is_open: r.is_open,
        })),
      )
      setCinemaRooms(data)
    }
  }, [])

  useEffect(() => {
    loadCinemaRooms()

    const channel = supabase
      .channel("cinema_rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_cinema_rooms",
        },
        loadCinemaRooms,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadCinemaRooms])

  return {
    otherPlayers,
    setOtherPlayers,
    arcadeMachines,
    isArcadeOpen,
    setIsArcadeOpen,
    stadium,
    isStadiumOpen,
    setIsStadiumOpen,
    isDiscoOpen,
    setIsDiscoOpen,
    cinemaRooms,
    loadCinemaRooms,
  }
}
