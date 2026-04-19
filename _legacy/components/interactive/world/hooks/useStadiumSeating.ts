"use client"

import { useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Position {
  x: number
  y: number
  z: number
}

interface UseStadiumSeatingProps {
  userId: string
  myPosition: Position
  stadiumSeat: { row: number; side: string } | null
  orbitControlsRef: React.MutableRefObject<any>
  setMyPosition: (pos: Position) => void
  setMyRotation: (rotation: number) => void
  setStadiumSeat: (seat: { row: number; side: string } | null) => void
}

export function useStadiumSeating({
  userId,
  myPosition,
  stadiumSeat,
  orbitControlsRef,
  setMyPosition,
  setMyRotation,
  setStadiumSeat,
}: UseStadiumSeatingProps) {
  // Sit in stadium stands
  const handleSitInStadium = useCallback(() => {
    if (stadiumSeat) return // Already seated

    // Determine closest side based on player position
    let side = "north"
    if (myPosition.z > 12) side = "south"
    else if (myPosition.x < -15) side = "west"
    else if (myPosition.x > 15) side = "east"
    else if (myPosition.z < -12) side = "north"

    // Choose random row (0-4)
    const row = Math.floor(Math.random() * 5)

    // Calculate seat position based on side
    const seatY = 2.5 + row * 1.5
    let seatPos = { x: 0, y: seatY, z: 0 }
    let seatRotation = 0

    switch (side) {
      case "north":
        seatPos = { x: myPosition.x, y: seatY, z: -25 - 2 - row * 1.2 }
        seatRotation = 0
        break
      case "south":
        seatPos = { x: myPosition.x, y: seatY, z: 25 + 2 + row * 1.2 }
        seatRotation = Math.PI
        break
      case "west":
        seatPos = { x: -35 - 2 - row * 1.2, y: seatY, z: myPosition.z }
        seatRotation = -Math.PI / 2
        break
      case "east":
        seatPos = { x: 35 + 2 + row * 1.2, y: seatY, z: myPosition.z }
        seatRotation = Math.PI / 2
        break
    }

    setStadiumSeat({ row, side })
    setMyPosition(seatPos)
    setMyRotation(seatRotation)

    // Position camera behind player, looking at stadium center
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      const maxDist = 25

      // Calculate camera offset based on side
      let cameraOffset = { x: 0, z: 0 }
      switch (side) {
        case "north":
          cameraOffset = { x: 0, z: -maxDist }
          break
        case "south":
          cameraOffset = { x: 0, z: maxDist }
          break
        case "west":
          cameraOffset = { x: -maxDist, z: 0 }
          break
        case "east":
          cameraOffset = { x: maxDist, z: 0 }
          break
      }

      // Update OrbitControls target (the player)
      controls.target.set(seatPos.x, seatPos.y + 1, seatPos.z)

      // Position camera behind player with slight upward angle
      controls.object.position.set(
        seatPos.x + cameraOffset.x * 0.6,
        seatPos.y + 8,
        seatPos.z + cameraOffset.z * 0.6
      )

      controls.update()
    }

    supabase
      .from("interactive_profiles")
      .update({
        position_x: seatPos.x,
        position_y: seatPos.y,
        position_z: seatPos.z,
        rotation: seatRotation,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, myPosition, stadiumSeat, orbitControlsRef, setMyPosition, setMyRotation, setStadiumSeat])

  // Stand up from stadium stands
  const handleStandUpFromStadium = useCallback(() => {
    if (!stadiumSeat) return

    // Return to field center with correct Y position for walking
    const standPos = { x: 0, y: -0.35, z: 0 }

    // IMPORTANT: Reset seat state FIRST to allow movement again
    setStadiumSeat(null)
    setMyPosition(standPos)
    setMyRotation(0) // Face default direction

    // Reset camera to follow player
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      controls.target.set(standPos.x, standPos.y + 1, standPos.z)
      controls.object.position.set(standPos.x, standPos.y + 8, standPos.z + 12)
      controls.update()
    }

    supabase
      .from("interactive_profiles")
      .update({
        position_x: standPos.x,
        position_y: standPos.y,
        position_z: standPos.z,
        rotation: 0,
      })
      .eq("user_id", userId)
      .then(() => {})
  }, [userId, stadiumSeat, orbitControlsRef, setMyPosition, setMyRotation, setStadiumSeat])

  return {
    handleSitInStadium,
    handleStandUpFromStadium,
  }
}
