"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { discoAnalyser, discoFrequencyData } from "../audio"

interface SideEqualizerProps {
  position: [number, number, number]
  color: string
  maxHeight?: number
}

// SideEqualizer - Single bar equalizer for side LED panels
export function SideEqualizer({ position, color, maxHeight = 8 }: SideEqualizerProps) {
  const barRef = useRef<THREE.Mesh>(null)
  const currentHeight = useRef(0.1)

  useFrame((state) => {
    if (!barRef.current) return

    const time = state.clock.elapsedTime

    // Get frequency data from shared disco audio if available
    let targetHeight = 0.1
    if (discoAnalyser && discoFrequencyData) {
      discoAnalyser.getByteFrequencyData(discoFrequencyData)
      // Use average of bass frequencies for the side bars
      let sum = 0
      const bassRange = Math.floor(discoFrequencyData.length * 0.3)
      for (let i = 0; i < bassRange; i++) {
        sum += discoFrequencyData[i]
      }
      targetHeight = (sum / bassRange / 255) * 0.9 + 0.1
    } else {
      // Fallback animation
      targetHeight = Math.sin(time * 4) * 0.3 + 0.5 + Math.sin(time * 7) * 0.2
    }

    // Smooth interpolation
    const diff = targetHeight - currentHeight.current
    const speed = diff > 0 ? 0.5 : 0.15
    currentHeight.current += diff * speed

    const normalizedHeight = Math.max(0.1, Math.min(1, currentHeight.current))
    const actualHeight = normalizedHeight * maxHeight

    barRef.current.scale.y = normalizedHeight
    barRef.current.position.y = (actualHeight - maxHeight) / 2
  })

  return (
    <group position={position}>
      {/* Background dark panel */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.4, maxHeight, 0.1]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Animated bar */}
      <mesh ref={barRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.3, maxHeight, 0.15]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow light */}
      <pointLight intensity={1.5} distance={6} color={color} />
    </group>
  )
}
