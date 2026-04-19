"use client"

import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import type { Position, FPSRotation } from "../types"

interface FirstPersonCameraProps {
  position: Position
  rotation: FPSRotation
  onRotationChange: (yaw: number, pitch: number) => void
}

// FirstPersonCamera - Caméra première personne avec contrôle souris
export function FirstPersonCamera({
  position,
  rotation,
  onRotationChange
}: FirstPersonCameraProps) {
  const { camera, gl } = useThree()
  const isLocked = useRef(false)
  const rotationRef = useRef(rotation)
  const onRotationChangeRef = useRef(onRotationChange)

  // Keep refs updated
  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  useEffect(() => {
    onRotationChangeRef.current = onRotationChange
  }, [onRotationChange])

  useEffect(() => {
    const canvas = gl.domElement

    const handleClick = () => {
      if (!isLocked.current) {
        canvas.requestPointerLock().catch(() => {
          // Ignore error when user exits lock before request completes
        })
      }
    }

    const handleLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return

      const sensitivity = 0.002
      const currentRotation = rotationRef.current
      const newYaw = currentRotation.yaw - e.movementX * sensitivity
      const newPitch = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, currentRotation.pitch - e.movementY * sensitivity)
      )

      onRotationChangeRef.current(newYaw, newPitch)
    }

    canvas.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', handleLockChange)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      canvas.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', handleLockChange)
      document.removeEventListener('mousemove', handleMouseMove)
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock()
      }
    }
  }, [gl])

  useFrame(() => {
    // Position de la caméra à la hauteur des yeux
    camera.position.set(position.x, position.y + 1.6, position.z)

    // Direction de la caméra basée sur yaw et pitch
    const lookX = position.x + Math.sin(rotation.yaw) * Math.cos(rotation.pitch)
    const lookY = position.y + 1.6 + Math.sin(rotation.pitch)
    const lookZ = position.z + Math.cos(rotation.yaw) * Math.cos(rotation.pitch)

    camera.lookAt(lookX, lookY, lookZ)
  })

  return null
}
