"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"

interface SnowParticlesProps {
  count?: number
  lowQuality?: boolean
}

// SnowParticles - Falling snow effect using Points
export function SnowParticles({ count = 1000, lowQuality = false }: SnowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = lowQuality ? Math.floor(count / 3) : count

  // Create snowflake positions
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80      // x: spread across world
      pos[i * 3 + 1] = Math.random() * 30          // y: height 0-30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80  // z: spread across world
    }
    return pos
  }, [particleCount])

  // Animation - snowflakes falling
  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      // Fall speed with slight variation
      posArray[i * 3 + 1] -= delta * (1.5 + Math.sin(i) * 0.5)

      // Horizontal drift
      posArray[i * 3] += Math.sin(Date.now() * 0.001 + i) * delta * 0.3
      posArray[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i * 0.5) * delta * 0.2

      // Reset to top when reaching ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3 + 1] = 25 + Math.random() * 5
        posArray[i * 3] = (Math.random() - 0.5) * 80
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 80
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
