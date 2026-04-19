"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { RealisticAvatar } from "./RealisticAvatar"
import type { AvatarStyle, Position } from "../types"

interface LocalPlayerAvatarProps {
  position: Position
  rotation: number
  avatarStyle: AvatarStyle
  isMoving: boolean
  isJumping: boolean
  isDancing?: boolean
  children?: React.ReactNode
}

// LocalPlayerAvatar - Gère l'avatar du joueur local avec animation de saut
export function LocalPlayerAvatar({
  position,
  rotation,
  avatarStyle,
  isMoving,
  isJumping,
  isDancing = false,
  children,
}: LocalPlayerAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const jumpOffset = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Animation de saut
    if (isJumping) {
      jumpOffset.current += delta * 8
      if (jumpOffset.current > Math.PI) {
        jumpOffset.current = Math.PI // Bloquer à la fin
      }
    } else {
      jumpOffset.current = 0
    }
    const jumpHeight = isJumping ? Math.sin(jumpOffset.current) * 0.8 : 0

    groupRef.current.position.set(position.x, position.y + jumpHeight, position.z)
  })

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <group rotation={[0, rotation, 0]}>
        <RealisticAvatar position={[0, 0, 0]} avatarStyle={avatarStyle} isMoving={isMoving} isJumping={isJumping} isDancing={isDancing} />
      </group>
      {children}
    </group>
  )
}
