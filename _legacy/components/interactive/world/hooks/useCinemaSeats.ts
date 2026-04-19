"use client"

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
  movie_title: string
  movie_poster?: string
  embed_url?: string
  schedule_start?: string
  capacity?: number
}

interface CinemaSeat {
  id: string
  row_number: number
  seat_number: number
  position_x: number
  position_y: number
  position_z: number
  user_id: string | null
  is_occupied?: boolean
}

interface UseCinemaSeatsProps {
  userId: string
  currentCinemaRoom: CinemaRoom | null
  mySeat: number | null
  cinemaSeats: CinemaSeat[]
  setMyPosition: (pos: Position) => void
  setMySeat: (seat: number | null) => void
  setCinemaSeats: (seats: CinemaSeat[]) => void
}

function generateSeatPosition(rowNumber: number, seatNumber: number, totalSeatsPerRow = 10): Position {
  const rowSpacing = 2.5
  const seatSpacing = 1.5
  const startX = -((totalSeatsPerRow - 1) * seatSpacing) / 2
  const screenZ = -19
  const firstRowZ = screenZ + 8

  return {
    x: startX + (seatNumber - 1) * seatSpacing,
    y: 0.4,
    z: firstRowZ + (rowNumber - 1) * rowSpacing,
  }
}

// Helper to calculate seat positions
function calculateSeatPositions(seats: any[], capacity?: number): CinemaSeat[] {
  if (!seats || seats.length === 0) return []

  // Calculer le nombre de sièges par rangée basé sur la capacité ou les sièges existants
  const perRow = capacity ? Math.min(10, Math.ceil(Math.sqrt(capacity))) : 10

  return seats.map((seat) => {
    const pos = generateSeatPosition(seat.row_number, seat.seat_number, perRow)
    return {
      ...seat,
      position_x: pos.x,
      position_y: pos.y,
      position_z: pos.z,
      is_occupied: !!seat.user_id,
    }
  })
}

export function useCinemaSeats({
  userId,
  currentCinemaRoom,
  mySeat,
  cinemaSeats,
  setMyPosition,
  setMySeat,
  setCinemaSeats,
}: UseCinemaSeatsProps) {
  // Refs to avoid stale closures in callbacks
  const mySeatRef = useRef(mySeat)
  const currentCinemaRoomRef = useRef(currentCinemaRoom)

  // Keep refs in sync
  useEffect(() => {
    mySeatRef.current = mySeat
  }, [mySeat])

  useEffect(() => {
    currentCinemaRoomRef.current = currentCinemaRoom
  }, [currentCinemaRoom])

  const createSeatsIfMissing = useCallback(async (roomId: string, capacity: number) => {
    const perRow = Math.min(10, Math.ceil(Math.sqrt(capacity)))
    const totalRows = Math.ceil(capacity / perRow)
    const seatsToCreate: { room_id: string; row_number: number; seat_number: number }[] = []

    let seatCount = 0
    for (let row = 1; row <= totalRows && seatCount < capacity; row++) {
      const seatsInThisRow = Math.min(perRow, capacity - seatCount)
      for (let seat = 1; seat <= seatsInThisRow; seat++) {
        seatsToCreate.push({
          room_id: roomId,
          row_number: row,
          seat_number: seat,
        })
        seatCount++
      }
    }

    if (seatsToCreate.length > 0) {
      const { error } = await supabase
        .from("interactive_cinema_seats")
        .upsert(seatsToCreate, { onConflict: "room_id,row_number,seat_number" })

      if (error) {
        console.error("[v0] Error creating seats:", error)
      } else {
        console.log(`[v0] Created ${seatsToCreate.length} seats for room ${roomId}`)
      }
    }
  }, [])

  // Load seats for current cinema room
  const loadSeats = useCallback(async () => {
    if (!currentCinemaRoom) return

    const { data, error } = await supabase
      .from("interactive_cinema_seats")
      .select("*")
      .eq("room_id", currentCinemaRoom.id)
      .order("row_number", { ascending: true })
      .order("seat_number", { ascending: true })

    if (error) {
      console.error("Error loading seats:", error)
      return
    }

    if ((!data || data.length === 0) && currentCinemaRoom.capacity && currentCinemaRoom.capacity > 0) {
      console.log(`[v0] No seats found, creating ${currentCinemaRoom.capacity} seats...`)
      await createSeatsIfMissing(currentCinemaRoom.id, currentCinemaRoom.capacity)

      // Recharger après création
      const { data: newData } = await supabase
        .from("interactive_cinema_seats")
        .select("*")
        .eq("room_id", currentCinemaRoom.id)
        .order("row_number", { ascending: true })
        .order("seat_number", { ascending: true })

      if (newData && newData.length > 0) {
        setCinemaSeats(calculateSeatPositions(newData, currentCinemaRoom.capacity))
        return
      }
    }

    if (!data || data.length === 0) {
      setCinemaSeats([])
      return
    }

    setCinemaSeats(calculateSeatPositions(data, currentCinemaRoom.capacity))
  }, [currentCinemaRoom, setCinemaSeats, createSeatsIfMissing])

  // Subscribe to seat changes
  useEffect(() => {
    if (!currentCinemaRoom) return

    loadSeats()

    const channel = supabase
      .channel(`cinema_seats_${currentCinemaRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_cinema_seats",
          filter: `room_id=eq.${currentCinemaRoom.id}`,
        },
        loadSeats,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentCinemaRoom, loadSeats])

  // Release seat on page exit
  useEffect(() => {
    const releaseSeatOnExit = async () => {
      if (mySeat !== null && currentCinemaRoom && userId) {
        const payload = JSON.stringify({
          room_id: currentCinemaRoom.id,
          user_id: userId,
        })
        navigator.sendBeacon?.("/api/cinema/release-seat", payload)
      }
    }

    window.addEventListener("beforeunload", releaseSeatOnExit)
    window.addEventListener("pagehide", releaseSeatOnExit)

    return () => {
      window.removeEventListener("beforeunload", releaseSeatOnExit)
      window.removeEventListener("pagehide", releaseSeatOnExit)
    }
  }, [mySeat, currentCinemaRoom, userId])

  // Cleanup abandoned seats (occupied for more than 30 min)
  useEffect(() => {
    if (!currentCinemaRoom) return

    const cleanupAbandonedSeats = async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      await supabase
        .from("interactive_cinema_seats")
        .update({ is_occupied: false, user_id: null, occupied_at: null })
        .eq("room_id", currentCinemaRoom.id)
        .eq("is_occupied", true)
        .lt("occupied_at", thirtyMinutesAgo)
    }

    cleanupAbandonedSeats()
  }, [currentCinemaRoom])

  // Sit in any available seat - fetches fresh data from DB to avoid race conditions
  const handleSitInAnySeat = useCallback(async () => {
    const room = currentCinemaRoomRef.current
    if (!room || !userId) {
      console.log("[v0] Cannot sit: no room or user")
      return
    }

    console.log("[v0] Attempting to sit in room:", room.id)

    // Fetch fresh seat data directly from DB to avoid stale state
    const { data: freshSeats, error: fetchError } = await supabase
      .from("interactive_cinema_seats")
      .select("*")
      .eq("room_id", room.id)
      .is("user_id", null) // Only get unoccupied seats
      .order("row_number", { ascending: true })
      .order("seat_number", { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error("[v0] Error fetching seats:", fetchError)
      return
    }

    if (!freshSeats || freshSeats.length === 0) {
      console.log("[v0] No available seats in this room")
      return
    }

    const availableSeat = freshSeats[0]
    console.log("[v0] Found available seat:", availableSeat.row_number, availableSeat.seat_number)

    // Try to claim the seat atomically - only update if still unoccupied
    const { data: updatedSeat, error } = await supabase
      .from("interactive_cinema_seats")
      .update({
        user_id: userId,
        is_occupied: true,
        occupied_at: new Date().toISOString(),
      })
      .eq("room_id", room.id)
      .eq("row_number", availableSeat.row_number)
      .eq("seat_number", availableSeat.seat_number)
      .is("user_id", null)
      .select()
      .single()

    if (error || !updatedSeat) {
      console.log("[v0] Seat was taken, retrying...")
      loadSeats()
      return
    }

    const capacity = room.capacity || 30
    const perRow = Math.min(10, Math.ceil(Math.sqrt(capacity)))
    const seatPosition = generateSeatPosition(availableSeat.row_number, availableSeat.seat_number, perRow)

    console.log("[v0] Sitting at position:", seatPosition)

    setMySeat(availableSeat.row_number * 100 + availableSeat.seat_number)
    setMyPosition(seatPosition)

    await supabase
      .from("interactive_profiles")
      .update({
        position_x: seatPosition.x,
        position_y: seatPosition.y,
        position_z: seatPosition.z,
      })
      .eq("user_id", userId)

    // Refresh seat list for everyone
    loadSeats()
  }, [userId, setMyPosition, setMySeat, loadSeats])

  // Stand up from current seat
  const handleStandUp = useCallback(() => {
    const currentMySeat = mySeatRef.current
    const currentRoom = currentCinemaRoomRef.current

    if (currentMySeat === null || !currentRoom) {
      console.log("[v0] Cannot stand: no seat or room")
      return
    }

    console.log("[v0] Standing up from seat:", currentMySeat)

    // Use correct Y position for walking (-0.35)
    const standPos = { x: 0, y: -0.35, z: 8 }

    // IMPORTANT: Reset seat state FIRST to allow movement again
    setMySeat(null)
    setMyPosition(standPos)

    // Update database asynchronously (don't block the state change)
    supabase
      .from("interactive_cinema_seats")
      .update({
        user_id: null,
        is_occupied: false,
        occupied_at: null,
      })
      .eq("room_id", currentRoom.id)
      .eq("user_id", userId)
      .then(() => {
        console.log("[v0] Released seat in database")
      })

    supabase
      .from("interactive_profiles")
      .update({
        position_x: standPos.x,
        position_y: standPos.y,
        position_z: standPos.z,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, setMyPosition, setMySeat])

  return {
    loadSeats,
    handleSitInAnySeat,
    handleSitInSeat: handleStandUp,
  }
}
