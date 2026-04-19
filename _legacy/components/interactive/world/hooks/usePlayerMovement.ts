"use client"

import { useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getCollisionZonesForQuality, DISCO_COLLISION_ZONES } from "../constants"

const supabase = createClient()

interface Position {
  x: number
  y: number
  z: number
}

interface UsePlayerMovementProps {
  userId: string
  currentRoom: string | null
  povMode: boolean
  fpsRotation: { yaw: number; pitch: number }
  stadiumSeat: { row: number; side: string } | null
  mySeat: number | null
  graphicsQuality: string
  isJumping: boolean
  setMyPosition: (fn: (prev: Position) => Position) => void
  setMyRotation: (rotation: number) => void
  setMovement: (movement: { x: number; z: number }) => void
  onJump: () => void
  cameraAngleRef: React.MutableRefObject<number>
  orbitControlsRef: React.MutableRefObject<any>
}

// Helper function to get room boundaries
function getRoomBoundaries(currentRoom: string | null) {
  let maxX = 28, maxZ = 28
  let minX = -28, minZ = -28

  if (currentRoom === "stadium") {
    maxX = 28
    maxZ = 18
  } else if (currentRoom === "arcade") {
    maxX = 23
    maxZ = 18
  } else if (currentRoom === "disco") {
    minX = -19
    maxX = 19
    minZ = -16
    maxZ = 16
  } else if (currentRoom?.startsWith("cinema_")) {
    minX = -8
    maxX = 8
    minZ = -5
    maxZ = 15
  }

  return { minX, maxX, minZ, maxZ }
}

export function usePlayerMovement({
  userId,
  currentRoom,
  povMode,
  fpsRotation,
  stadiumSeat,
  mySeat,
  graphicsQuality,
  isJumping,
  setMyPosition,
  setMyRotation,
  setMovement,
  onJump,
  cameraAngleRef,
  orbitControlsRef,
}: UsePlayerMovementProps) {
  const keysPressed = useRef<Set<string>>(new Set())
  const lastDbUpdate = useRef<number>(0)
  const handleJumpRef = useRef<() => void>(() => {})

  // Update jump ref
  handleJumpRef.current = onJump

  // Collision check function
  const checkCollision = useCallback((newX: number, newZ: number): boolean => {
    // Special rooms have no collisions - free movement
    if (currentRoom === "stadium" || currentRoom === "arcade") {
      return false
    }

    // Disco collisions
    if (currentRoom === "disco") {
      for (const zone of DISCO_COLLISION_ZONES) {
        const halfWidth = zone.width / 2
        const halfDepth = zone.depth / 2
        if (
          newX >= zone.x - halfWidth &&
          newX <= zone.x + halfWidth &&
          newZ >= zone.z - halfDepth &&
          newZ <= zone.z + halfDepth
        ) {
          return true
        }
      }
      return false
    }

    // Only check collisions in main world
    if (currentRoom !== null) {
      return false
    }

    const collisionZones = getCollisionZonesForQuality(graphicsQuality as any)
    for (const zone of collisionZones) {
      const halfWidth = zone.width / 2
      const halfDepth = zone.depth / 2
      if (
        newX >= zone.x - halfWidth &&
        newX <= zone.x + halfWidth &&
        newZ >= zone.z - halfDepth &&
        newZ <= zone.z + halfDepth
      ) {
        return true
      }
    }
    return false
  }, [currentRoom, graphicsQuality])

  // Calculate move angle based on camera/pov mode
  const getMoveAngle = useCallback(() => {
    if (povMode) {
      return fpsRotation.yaw
    } else {
      const camAngle = cameraAngleRef.current
      return camAngle + Math.PI
    }
  }, [povMode, fpsRotation.yaw, cameraAngleRef])

  // Update position with collision and DB sync
  const updatePosition = useCallback((dx: number, dz: number) => {
    setMyPosition((prev) => {
      const { minX, maxX, minZ, maxZ } = getRoomBoundaries(currentRoom)

      const newX = Math.max(minX, Math.min(maxX, prev.x + dx))
      const newZ = Math.max(minZ, Math.min(maxZ, prev.z + dz))

      // Skip collision check in cinema
      if (!currentRoom?.startsWith("cinema_") && checkCollision(newX, newZ)) {
        return prev
      }

      const newPos = { x: newX, y: -0.35, z: newZ }

      // Throttle DB updates to every 300ms
      const now = Date.now()
      if (now - lastDbUpdate.current > 300) {
        lastDbUpdate.current = now
        const targetRotation = Math.atan2(dx, dz)
        supabase
          .from("interactive_profiles")
          .update({
            position_x: newPos.x,
            position_y: newPos.y,
            position_z: newPos.z,
            rotation: targetRotation,
          })
          .eq("user_id", userId)
          .then()
      }

      return newPos
    })
  }, [userId, currentRoom, checkCollision, setMyPosition])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      if (e.code === "Space" && !isJumping) {
        e.preventDefault()
        handleJumpRef.current()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isJumping])

  // Track camera angle for movements
  useEffect(() => {
    const interval = setInterval(() => {
      if (orbitControlsRef.current) {
        const angle = orbitControlsRef.current.getAzimuthalAngle()
        cameraAngleRef.current = angle
      }
    }, 16)

    return () => clearInterval(interval)
  }, [cameraAngleRef, orbitControlsRef])

  // Keyboard movement loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (stadiumSeat !== null || mySeat !== null) return

      let forward = 0
      let right = 0
      const baseSpeed = 0.15
      const isShiftPressed = keysPressed.current.has("shift")
      const speed = isShiftPressed ? baseSpeed * 2 : baseSpeed

      // QWERTY (WASD) and AZERTY (ZQSD) + Arrows
      if (keysPressed.current.has("w") || keysPressed.current.has("z") || keysPressed.current.has("arrowup")) forward += speed
      if (keysPressed.current.has("s") || keysPressed.current.has("arrowdown")) forward -= speed
      if (keysPressed.current.has("a") || keysPressed.current.has("q") || keysPressed.current.has("arrowleft")) right += speed
      if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) right -= speed

      if (forward !== 0 || right !== 0) {
        const moveAngle = getMoveAngle()

        const dx = Math.sin(moveAngle) * forward + Math.cos(moveAngle) * right
        const dz = Math.cos(moveAngle) * forward - Math.sin(moveAngle) * right

        if (dx !== 0 || dz !== 0) {
          const targetRotation = Math.atan2(dx, dz)
          setMyRotation(targetRotation)
        }
        setMovement({ x: dx, z: dz })
        updatePosition(dx, dz)
      } else {
        setMovement({ x: 0, z: 0 })
      }
    }, 50)

    return () => clearInterval(interval)
  }, [mySeat, stadiumSeat, getMoveAngle, setMyRotation, setMovement, updatePosition])

  // Joystick move handler
  const handleJoystickMove = useCallback(
    (joystickX: number, joystickY: number) => {
      if (stadiumSeat !== null || mySeat !== null) return

      if (joystickX === 0 && joystickY === 0) {
        setMovement({ x: 0, z: 0 })
        return
      }

      const magnitude = Math.sqrt(joystickX * joystickX + joystickY * joystickY)
      const normalizedX = magnitude > 0 ? joystickX / magnitude : 0
      const normalizedY = magnitude > 0 ? joystickY / magnitude : 0

      const forward = -normalizedY
      const right = -normalizedX
      const baseSpeed = 0.15

      const moveAngle = getMoveAngle()

      const worldDx = (Math.sin(moveAngle) * forward + Math.cos(moveAngle) * right) * baseSpeed
      const worldDz = (Math.cos(moveAngle) * forward - Math.sin(moveAngle) * right) * baseSpeed

      if (worldDx !== 0 || worldDz !== 0) {
        const targetRotation = Math.atan2(worldDx, worldDz)
        setMyRotation(targetRotation)
      }

      const movementMagnitude = Math.sqrt(worldDx * worldDx + worldDz * worldDz)
      const normalizedMovementX = movementMagnitude > 0.01 ? worldDx / movementMagnitude : 0
      const normalizedMovementZ = movementMagnitude > 0.01 ? worldDz / movementMagnitude : 0
      setMovement({ x: normalizedMovementX, z: normalizedMovementZ })

      updatePosition(worldDx, worldDz)
    },
    [stadiumSeat, mySeat, getMoveAngle, setMyRotation, setMovement, updatePosition],
  )

  // Camera rotation handler
  const handleCameraRotate = useCallback((deltaYaw: number, deltaPitch: number, setFpsRotation: (fn: (prev: { yaw: number; pitch: number }) => { yaw: number; pitch: number }) => void) => {
    if (povMode) {
      setFpsRotation(prev => ({
        yaw: prev.yaw - deltaYaw,
        pitch: Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, prev.pitch + deltaPitch))
      }))
    } else if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      const currentAzimuth = controls.getAzimuthalAngle()
      const currentPolar = controls.getPolarAngle()

      controls.minAzimuthAngle = -Infinity
      controls.maxAzimuthAngle = Infinity

      const newAzimuth = currentAzimuth - deltaYaw * 0.8
      const newPolar = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, currentPolar + deltaPitch * 0.8))

      controls.minAzimuthAngle = newAzimuth
      controls.maxAzimuthAngle = newAzimuth
      controls.minPolarAngle = newPolar
      controls.maxPolarAngle = newPolar
      controls.update()

      controls.minAzimuthAngle = -Infinity
      controls.maxAzimuthAngle = Infinity
      controls.minPolarAngle = 0.3
      controls.maxPolarAngle = Math.PI / 2 - 0.1
    }
  }, [povMode, orbitControlsRef])

  return {
    handleJoystickMove,
    handleCameraRotate,
    checkCollision,
  }
}
