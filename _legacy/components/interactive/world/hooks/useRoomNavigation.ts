"use client"

import type React from "react"

import { useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Position {
  x: number
  y: number
  z: number
}

interface CinemaRoom {
  id: string
  room_number: number
  movie_title: string | null
  movie_poster?: string | null
  embed_url?: string
  schedule_start?: string | null
  is_open?: boolean
}

interface UseRoomNavigationProps {
  userId: string
  myPosition: Position
  mySeat: number | null
  stadiumSeat: { row: number; side: string } | null
  currentRoom: string | null
  currentCinemaRoom: CinemaRoom | null
  savedMapPosition: Position
  orbitControlsRef: React.MutableRefObject<any>
  // Current open states (from useDataLoaders, updated via realtime)
  isStadiumOpen: boolean
  isArcadeOpen: boolean
  isDiscoOpen: boolean
  // Room tracking callbacks (optional)
  onEnterRoom?: (roomName: string) => void
  onLeaveRoom?: (roomName: string) => void
  setMyPosition: (pos: Position) => void
  setMyRotation: (rotation: number) => void
  setMySeat: (seat: number | null) => void
  setStadiumSeat: (seat: { row: number; side: string } | null) => void
  setCurrentRoom: (room: string | null) => void
  setCurrentCinemaRoom: (room: CinemaRoom | null) => void
  setSavedMapPosition: (pos: Position) => void
  setCinemaSeats: (seats: any[]) => void
  setShowCinema: (show: boolean) => void
  setShowStadium: (show: boolean) => void
  setShowArcade: (show: boolean) => void
  setShowDisco: (show: boolean) => void
  setShowCinemaClosedModal: (show: boolean) => void
  setShowStadiumClosedModal: (show: boolean) => void
  setShowArcadeClosedModal: (show: boolean) => void
  setShowDiscoClosedModal: (show: boolean) => void
  setIsSeatsLocked: (locked: boolean) => void
  setCountdown: (countdown: string) => void
  setIsDiscoOpen: (open: boolean) => void
  setIsArcadeOpen: (open: boolean) => void
  setIsStadiumOpen: (open: boolean) => void
}

export function useRoomNavigation({
  userId,
  myPosition,
  mySeat,
  stadiumSeat,
  currentRoom,
  currentCinemaRoom,
  savedMapPosition,
  orbitControlsRef,
  isStadiumOpen,
  isArcadeOpen,
  isDiscoOpen,
  onEnterRoom,
  onLeaveRoom,
  setMyPosition,
  setMyRotation,
  setMySeat,
  setStadiumSeat,
  setCurrentRoom,
  setCurrentCinemaRoom,
  setSavedMapPosition,
  setCinemaSeats,
  setShowCinema,
  setShowStadium,
  setShowArcade,
  setShowDisco,
  setShowCinemaClosedModal,
  setShowStadiumClosedModal,
  setShowArcadeClosedModal,
  setShowDiscoClosedModal,
  setIsSeatsLocked,
  setCountdown,
  setIsDiscoOpen,
  setIsArcadeOpen,
  setIsStadiumOpen,
}: UseRoomNavigationProps) {
  // Refs to track current values for Realtime callbacks (to avoid stale closures)
  const currentRoomRef = useRef(currentRoom)
  const currentCinemaRoomRef = useRef(currentCinemaRoom)
  const savedMapPositionRef = useRef(savedMapPosition)

  // Keep refs in sync with state
  useEffect(() => {
    currentRoomRef.current = currentRoom
  }, [currentRoom])

  useEffect(() => {
    currentCinemaRoomRef.current = currentCinemaRoom
  }, [currentCinemaRoom])

  useEffect(() => {
    savedMapPositionRef.current = savedMapPosition
  }, [savedMapPosition])

  // Enter Arcade
  const handleEnterArcade = useCallback(async () => {
    // Use local state (updated via realtime) - instant check, no DB call
    if (!isArcadeOpen) {
      setShowArcade(false)
      setShowArcadeClosedModal(true)
      return
    }

    // Reset seats if coming from cinema/stadium (fixes teleport while seated bug)
    if (mySeat !== null && currentCinemaRoom) {
      await supabase
        .from("interactive_cinema_seats")
        .update({
          user_id: null,
          is_occupied: false,
          occupied_at: null,
        })
        .eq("room_id", currentCinemaRoom.id)
        .eq("user_id", userId)
      setMySeat(null)
    }
    if (stadiumSeat !== null) {
      setStadiumSeat(null)
    }

    setShowArcade(false)
    setCurrentCinemaRoom(null)

    // Save current map position before entering arcade
    setSavedMapPosition({ x: myPosition.x, y: myPosition.y, z: myPosition.z })

    setCurrentRoom("arcade")
    onEnterRoom?.("arcade")

    // Teleport player to arcade room (spawn position)
    const arcadePos = { x: -2.6145599903373125, y: -0.35, z: 10.641204270993434 }
    const arcadeRotation = Math.PI
    setMyPosition(arcadePos)
    setMyRotation(arcadeRotation)

    // Position camera behind player
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(arcadePos.x, arcadePos.y + 1, arcadePos.z)
      controls.object.position.set(arcadePos.x, arcadePos.y + 8, arcadePos.z + 15)
      controls.update()
    }

    // Update position in database
    supabase
      .from("interactive_profiles")
      .update({
        position_x: arcadePos.x,
        position_y: arcadePos.y,
        position_z: arcadePos.z,
        rotation: arcadeRotation,
        current_room: "arcade",
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [
    userId,
    myPosition,
    mySeat,
    stadiumSeat,
    currentCinemaRoom,
    orbitControlsRef,
    isArcadeOpen,
    setMyPosition,
    setMyRotation,
    setMySeat,
    setStadiumSeat,
    setCurrentRoom,
    setCurrentCinemaRoom,
    setSavedMapPosition,
    setShowArcade,
    setShowArcadeClosedModal,
  ])

  // Leave Arcade
  const handleLeaveArcade = useCallback(() => {
    onLeaveRoom?.("arcade")
    const defaultRotation = 0 // Face buildings (like initial spawn)
    setMyPosition(savedMapPosition)
    setMyRotation(defaultRotation)
    setCurrentRoom("main_world")

    // Reset camera behind player, facing buildings
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(savedMapPosition.x, savedMapPosition.y + 1, savedMapPosition.z)
      controls.object.position.set(savedMapPosition.x, savedMapPosition.y + 8, savedMapPosition.z - 12)
      controls.update()
    }

    supabase
      .from("interactive_profiles")
      .update({
        position_x: savedMapPosition.x,
        position_y: savedMapPosition.y,
        position_z: savedMapPosition.z,
        rotation: defaultRotation,
        current_room: null,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, savedMapPosition, orbitControlsRef, setMyPosition, setMyRotation, setCurrentRoom])

  // Enter Cinema Room
  const handleEnterCinemaRoom = useCallback(
    async (room: CinemaRoom) => {
      // Check if cinema room is open in real-time from database
      const { data: roomData } = await supabase
        .from("interactive_cinema_rooms")
        .select("is_open")
        .eq("id", room.id)
        .single()

      if (!roomData || roomData.is_open === false) {
        setShowCinema(false)
        setShowCinemaClosedModal(true)
        return
      }

      // Close cinema modal first
      setShowCinema(false)

      // Clear old seat data immediately to prevent stale state
      setCinemaSeats([])
      setMySeat(null)

      // Reset stadium seat if coming from stadium
      if (stadiumSeat !== null) {
        setStadiumSeat(null)
      }

      // Save current map position before entering cinema
      setSavedMapPosition({ x: myPosition.x, y: myPosition.y, z: myPosition.z })

      // SET ROOM FIRST - This switches the rendering context BEFORE changing position
      // This prevents the player from being briefly visible at the spawn position in the world
      setCurrentRoom(`cinema_${room.id}`)
      setCurrentCinemaRoom(room)
      onEnterRoom?.(`cinema_${room.room_number}`)

      // Spawn position in cinema (only visible inside cinema room now)
      const cinemaSpawnPos = { x: 0, y: -0.35, z: 8 }
      const cinemaRotation = Math.PI // Face the screen (screen is at negative Z)
      setMyPosition(cinemaSpawnPos)
      setMyRotation(cinemaRotation)

      // Position camera behind player, looking at the screen
      if (orbitControlsRef.current) {
        const controls = orbitControlsRef.current
        controls.target.set(cinemaSpawnPos.x, cinemaSpawnPos.y + 1, cinemaSpawnPos.z)
        // Camera behind player (positive Z) looking towards negative Z (screen)
        controls.object.position.set(cinemaSpawnPos.x, cinemaSpawnPos.y + 8, cinemaSpawnPos.z + 15)
        controls.update()
      }

      // Release only MY seat if I had one in this room
      await supabase
        .from("interactive_cinema_seats")
        .update({ user_id: null, is_occupied: false, occupied_at: null })
        .eq("room_id", room.id)
        .eq("user_id", userId)

      // Update profile position in database
      await supabase
        .from("interactive_profiles")
        .update({
          current_room: `cinema_${room.id}`,
          position_x: cinemaSpawnPos.x,
          position_y: cinemaSpawnPos.y,
          position_z: cinemaSpawnPos.z,
          rotation: cinemaRotation,
        })
        .eq("user_id", userId)
    },
    [
      userId,
      myPosition,
      stadiumSeat,
      setMyPosition,
      setMyRotation,
      setMySeat,
      setStadiumSeat,
      setCurrentRoom,
      setCurrentCinemaRoom,
      setSavedMapPosition,
      setCinemaSeats,
      setShowCinema,
      setShowCinemaClosedModal,
    ],
  )

  // Leave Cinema Room
  const handleLeaveRoom = useCallback(async () => {
    if (currentCinemaRoom) {
      onLeaveRoom?.(`cinema_${currentCinemaRoom.room_number}`)
    }
    if (mySeat !== null && currentCinemaRoom) {
      await supabase
        .from("interactive_cinema_seats")
        .update({
          user_id: null,
          is_occupied: false,
          occupied_at: null,
        })
        .eq("room_id", currentCinemaRoom.id)
        .eq("user_id", userId)
      setMySeat(null)
    }

    // Clear seat data when leaving to prevent stale state on re-entry
    setCinemaSeats([])

    setCurrentCinemaRoom(null)
    setCurrentRoom("main_world")
    setIsSeatsLocked(false)
    setCountdown("")

    const defaultRotation = 0 // Face buildings (like initial spawn)
    setMyPosition(savedMapPosition)
    setMyRotation(defaultRotation)

    // Reset camera position behind player, facing buildings
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(savedMapPosition.x, savedMapPosition.y + 1, savedMapPosition.z)
      controls.object.position.set(savedMapPosition.x, savedMapPosition.y + 8, savedMapPosition.z - 12)
      controls.update()
    }

    await supabase
      .from("interactive_profiles")
      .update({
        current_room: null,
        position_x: savedMapPosition.x,
        position_y: savedMapPosition.y,
        position_z: savedMapPosition.z,
        rotation: defaultRotation,
      })
      .eq("user_id", userId)
  }, [
    userId,
    mySeat,
    currentCinemaRoom,
    savedMapPosition,
    orbitControlsRef,
    setMyPosition,
    setMyRotation,
    setMySeat,
    setCurrentRoom,
    setCurrentCinemaRoom,
    setCinemaSeats,
    setIsSeatsLocked,
    setCountdown,
  ])

  // Enter Stadium
  const handleEnterStadium = useCallback(async () => {
    // Use local state (updated via realtime) - instant check, no DB call
    if (!isStadiumOpen) {
      setShowStadium(false)
      setShowStadiumClosedModal(true)
      return
    }

    // Reset cinema seat if coming from cinema
    if (mySeat !== null && currentCinemaRoom) {
      await supabase
        .from("interactive_cinema_seats")
        .update({
          user_id: null,
          is_occupied: false,
          occupied_at: null,
        })
        .eq("room_id", currentCinemaRoom.id)
        .eq("user_id", userId)
      setMySeat(null)
    }

    setShowStadium(false)
    setCurrentCinemaRoom(null)

    // Save current map position before entering stadium
    setSavedMapPosition({ x: myPosition.x, y: myPosition.y, z: myPosition.z })

    setCurrentRoom("stadium")
    onEnterRoom?.("stadium")

    // Teleport player to stadium viewing position
    const stadiumPos = { x: 0, y: 0.5, z: 0 }
    setMyPosition(stadiumPos)

    // Update position in database
    supabase
      .from("interactive_profiles")
      .update({
        position_x: stadiumPos.x,
        position_y: stadiumPos.y,
        position_z: stadiumPos.z,
        current_room: "stadium",
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [
    userId,
    myPosition,
    mySeat,
    currentCinemaRoom,
    isStadiumOpen,
    setMyPosition,
    setMySeat,
    setCurrentRoom,
    setCurrentCinemaRoom,
    setSavedMapPosition,
    setShowStadium,
    setShowStadiumClosedModal,
  ])

  // Leave Stadium
  const handleLeaveStadium = useCallback(() => {
    onLeaveRoom?.("stadium")
    const defaultRotation = 0 // Face buildings (like initial spawn)
    setStadiumSeat(null)
    setMyPosition(savedMapPosition)
    setMyRotation(defaultRotation)
    setCurrentRoom("main_world")

    // Reset camera behind player, facing buildings
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(savedMapPosition.x, savedMapPosition.y + 1, savedMapPosition.z)
      controls.object.position.set(savedMapPosition.x, savedMapPosition.y + 8, savedMapPosition.z - 12)
      controls.update()
    }

    supabase
      .from("interactive_profiles")
      .update({
        position_x: savedMapPosition.x,
        position_y: savedMapPosition.y,
        position_z: savedMapPosition.z,
        rotation: defaultRotation,
        current_room: null,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, savedMapPosition, orbitControlsRef, setMyPosition, setMyRotation, setStadiumSeat, setCurrentRoom])

  // Enter Disco
  const handleEnterDisco = useCallback(async () => {
    // Use local state (updated via realtime) - instant check, no DB call
    if (!isDiscoOpen) {
      setShowDisco(false)
      setShowDiscoClosedModal(true)
      return
    }

    // Reset seats if coming from cinema/stadium
    if (mySeat !== null && currentCinemaRoom) {
      await supabase
        .from("interactive_cinema_seats")
        .update({
          user_id: null,
          is_occupied: false,
          occupied_at: null,
        })
        .eq("room_id", currentCinemaRoom.id)
        .eq("user_id", userId)
      setMySeat(null)
    }
    if (stadiumSeat !== null) {
      setStadiumSeat(null)
    }

    setShowDisco(false)
    setCurrentCinemaRoom(null)

    // Save current map position before entering disco
    setSavedMapPosition({ x: myPosition.x, y: myPosition.y, z: myPosition.z })

    setCurrentRoom("disco")
    onEnterRoom?.("disco")

    // Teleport player to disco room (spawn position)
    const discoPos = { x: 0, y: -0.35, z: 12 }
    const discoRotation = Math.PI
    setMyPosition(discoPos)
    setMyRotation(discoRotation)

    // Position camera behind player
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(discoPos.x, discoPos.y + 1, discoPos.z)
      controls.object.position.set(discoPos.x, discoPos.y + 8, discoPos.z + 15)
      controls.update()
    }

    // Update position in database
    supabase
      .from("interactive_profiles")
      .update({
        position_x: discoPos.x,
        position_y: discoPos.y,
        position_z: discoPos.z,
        rotation: discoRotation,
        current_room: "disco",
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [
    userId,
    myPosition,
    mySeat,
    stadiumSeat,
    currentCinemaRoom,
    orbitControlsRef,
    isDiscoOpen,
    setMyPosition,
    setMyRotation,
    setMySeat,
    setStadiumSeat,
    setCurrentRoom,
    setCurrentCinemaRoom,
    setSavedMapPosition,
    setShowDisco,
    setShowDiscoClosedModal,
  ])

  // Leave Disco
  const handleLeaveDisco = useCallback(() => {
    onLeaveRoom?.("disco")
    const defaultRotation = 0 // Face buildings (like initial spawn)
    setMyPosition(savedMapPosition)
    setMyRotation(defaultRotation)
    setCurrentRoom("main_world")

    // Reset camera behind player, facing buildings
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(savedMapPosition.x, savedMapPosition.y + 1, savedMapPosition.z)
      controls.object.position.set(savedMapPosition.x, savedMapPosition.y + 8, savedMapPosition.z - 12)
      controls.update()
    }

    supabase
      .from("interactive_profiles")
      .update({
        position_x: savedMapPosition.x,
        position_y: savedMapPosition.y,
        position_z: savedMapPosition.z,
        rotation: defaultRotation,
        current_room: null,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, savedMapPosition, orbitControlsRef, setMyPosition, setMyRotation, setCurrentRoom])

  // Realtime listener to auto-eject users when rooms are closed by admin
  useEffect(() => {
    // Subscribe to disco status changes
    const discoChannel = supabase
      .channel("disco-status-ejection")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "interactive_disco" }, (payload: any) => {
        const isOpen = payload.new?.is_open !== false
        setIsDiscoOpen(isOpen)
        if (payload.new?.is_open === false && currentRoomRef.current === "disco") {
          // Eject user from disco
          const pos = savedMapPositionRef.current
          setMyPosition(pos)
          setCurrentRoom(null)
          setShowDiscoClosedModal(true)
          // Update database
          supabase
            .from("interactive_profiles")
            .update({
              position_x: pos.x,
              position_y: pos.y,
              position_z: pos.z,
              current_room: null,
            })
            .eq("user_id", userId)
            .then(() => {})
        }
      })
      .subscribe()

    // Subscribe to arcade status changes
    const arcadeChannel = supabase
      .channel("arcade-status-ejection")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interactive_arcade_settings" },
        (payload: any) => {
          const isOpen = payload.new?.is_open !== false
          setIsArcadeOpen(isOpen)
          if (payload.new?.is_open === false && currentRoomRef.current === "arcade") {
            // Eject user from arcade
            const pos = savedMapPositionRef.current
            setMyPosition(pos)
            setCurrentRoom(null)
            setShowArcadeClosedModal(true)
            // Update database
            supabase
              .from("interactive_profiles")
              .update({
                position_x: pos.x,
                position_y: pos.y,
                position_z: pos.z,
                current_room: null,
              })
              .eq("user_id", userId)
              .then(() => {})
          }
        },
      )
      .subscribe()

    // Subscribe to stadium status changes
    const stadiumChannel = supabase
      .channel("stadium-status-ejection")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "interactive_stadium" }, (payload: any) => {
        const isOpen = payload.new?.is_open !== false
        const roomId = payload.new?.id
        // Check if user is in this specific cinema room
        if (payload.new?.is_open === false && currentCinemaRoomRef.current?.id === roomId) {
          // Eject user from stadium
          const pos = savedMapPositionRef.current
          setStadiumSeat(null)
          setMyPosition(pos)
          setCurrentRoom(null)
          setShowStadiumClosedModal(true)
          // Update database
          supabase
            .from("interactive_profiles")
            .update({
              position_x: pos.x,
              position_y: pos.y,
              position_z: pos.z,
              current_room: null,
            })
            .eq("user_id", userId)
            .then(() => {})
        }
      })
      .subscribe()

    // Subscribe to cinema room status changes
    const cinemaChannel = supabase
      .channel("cinema-status-ejection")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interactive_cinema_rooms" },
        (payload: any) => {
          const isOpen = payload.new?.is_open !== false
          const roomId = payload.new?.id
          // Check if user is in this specific cinema room
          if (payload.new?.is_open === false && currentCinemaRoomRef.current?.id === roomId) {
            // Eject user from cinema
            const pos = savedMapPositionRef.current
            setMySeat(null)
            setCinemaSeats([])
            setCurrentCinemaRoom(null)
            setCurrentRoom(null)
            setMyPosition(pos)
            setShowCinemaClosedModal(true)
            // Update database
            supabase
              .from("interactive_profiles")
              .update({
                position_x: pos.x,
                position_y: pos.y,
                position_z: pos.z,
                current_room: null,
              })
              .eq("user_id", userId)
              .then(() => {})
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(discoChannel)
      supabase.removeChannel(arcadeChannel)
      supabase.removeChannel(stadiumChannel)
      supabase.removeChannel(cinemaChannel)
    }
  }, [
    userId,
    setMyPosition,
    setCurrentRoom,
    setMySeat,
    setStadiumSeat,
    setCurrentCinemaRoom,
    setCinemaSeats,
    setShowDiscoClosedModal,
    setShowArcadeClosedModal,
    setShowStadiumClosedModal,
    setShowCinemaClosedModal,
    setIsDiscoOpen,
    setIsArcadeOpen,
    setIsStadiumOpen,
  ])

  return {
    handleEnterArcade,
    handleLeaveArcade,
    handleEnterCinemaRoom,
    handleLeaveRoom,
    handleEnterStadium,
    handleLeaveStadium,
    handleEnterDisco,
    handleLeaveDisco,
  }
}
