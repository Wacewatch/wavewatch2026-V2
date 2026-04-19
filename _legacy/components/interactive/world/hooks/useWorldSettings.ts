"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  setGlobalDiscoStreamUrls,
  setGlobalDiscoVolume,
  setGlobalDiscoIsOpen,
  setGlobalArcadeIsOpen,
} from "../audio"

const supabase = createClient()

interface CinemaRoom {
  id: string
  room_number: number
  movie_title: string | null
  movie_poster?: string | null
  embed_url?: string
  schedule_start?: string | null
  is_open?: boolean
}

interface WorldSettings {
  maxCapacity: number
  worldMode: "day" | "night" | "sunset" | "christmas"
  voiceChatEnabled: boolean
  playerInteractionsEnabled: boolean
  showStatusBadges: boolean
  enableChat: boolean
  enableEmojis: boolean
  enableJumping: boolean
}

export function useWorldSettings() {
  const [cinemaRooms, setCinemaRooms] = useState<CinemaRoom[]>([])
  const [isArcadeOpen, setIsArcadeOpen] = useState(true)
  const [isStadiumOpen, setIsStadiumOpen] = useState(true)
  const [isDiscoOpen, setIsDiscoOpen] = useState(true)
  const [worldSettings, setWorldSettings] = useState<WorldSettings>({
    maxCapacity: 100,
    worldMode: "day",
    voiceChatEnabled: false,
    playerInteractionsEnabled: true,
    showStatusBadges: true,
    enableChat: true,
    enableEmojis: true,
    enableJumping: true,
  })

  // Load cinema rooms
  const loadCinemaRooms = useCallback(async () => {
    const { data } = await supabase
      .from("interactive_cinema_rooms")
      .select("*")
      .eq("is_open", true)
      .order("room_number")

    if (data) setCinemaRooms(data)
  }, [])

  // Load disco settings from database
  const loadDiscoSettings = useCallback(async () => {
    const { data } = await supabase
      .from("interactive_disco")
      .select("*")
      .single()

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
  }, [])

  // Load arcade settings from database
  const loadArcadeSettings = useCallback(async () => {
    const { data } = await supabase
      .from("interactive_arcade_settings")
      .select("*")
      .single()

    if (data) {
      setGlobalArcadeIsOpen(data.is_open !== false)
      setIsArcadeOpen(data.is_open !== false)
    }
  }, [])

  // Subscribe to cinema rooms changes
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

  // Load disco settings on mount
  useEffect(() => {
    loadDiscoSettings()
  }, [loadDiscoSettings])

  // Load arcade settings on mount
  useEffect(() => {
    loadArcadeSettings()
  }, [loadArcadeSettings])

  return {
    cinemaRooms,
    setCinemaRooms,
    isArcadeOpen,
    setIsArcadeOpen,
    isStadiumOpen,
    setIsStadiumOpen,
    isDiscoOpen,
    setIsDiscoOpen,
    worldSettings,
    setWorldSettings,
    loadCinemaRooms,
    loadDiscoSettings,
    loadArcadeSettings,
  }
}
