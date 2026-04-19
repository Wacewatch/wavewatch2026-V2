"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface AmbientLamppostProps {
  position: [number, number, number]
  color?: string
  isNight?: boolean
  animated?: boolean
  rotation?: number
}

/**
 * AmbientLamppost - Modern street lamp with colored ambient lighting
 * Can have animated color cycling for party/event modes
 */
export function AmbientLamppost({
  position,
  color = "#fbbf24",
  isNight = false,
  animated = false,
  rotation = 0,
}: AmbientLamppostProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const globeRef = useRef<THREE.Mesh>(null)

  // Animate color cycling for party mode
  useFrame(({ clock }) => {
    if (animated && lightRef.current && globeRef.current) {
      const time = clock.getElapsedTime()
      const hue = (time * 0.1) % 1
      const newColor = new THREE.Color().setHSL(hue, 0.8, 0.5)
      lightRef.current.color = newColor
      ;(globeRef.current.material as THREE.MeshStandardMaterial).color = newColor
      ;(globeRef.current.material as THREE.MeshStandardMaterial).emissive = newColor
    }
  })

  const intensity = isNight ? 4 : 2
  const emissiveIntensity = isNight ? 1.2 : 0.5

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base plate */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.1, 8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Base column (decorative) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 0.5, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Main pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Curved arm */}
      <mesh position={[0.4, 4.3, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1, 6]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Lamp housing */}
      <mesh position={[0.7, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.2, 0.4, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Light globe */}
      <mesh ref={globeRef} position={[0.7, 4.2, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Point light - no shadow to save GPU */}
      <pointLight
        ref={lightRef}
        position={[0.7, 4.2, 0]}
        intensity={intensity}
        distance={15}
        color={color}
      />

      {/* Ground light reflection removed for performance */}
    </group>
  )
}

/**
 * Collection of ambient lampposts with different colors for atmosphere
 */
interface AmbientLamppostCollectionProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: "low" | "medium" | "high"
}

export function AmbientLamppostCollection({
  worldMode,
  graphicsQuality,
}: AmbientLamppostCollectionProps) {
  const isLowQuality = graphicsQuality === "low"
  const isNight = worldMode === "night"
  const isChristmas = worldMode === "christmas"

  // REDUCED: Only 4 colored lampposts to avoid WebGL texture limit
  // Each lamp has a pointLight, so we limit to save GPU resources
  // Positioned to avoid blocking paths
  const lampposts: { position: [number, number, number]; color: string; rotation?: number }[] = [
    // Near Cinema - blue tint (offset from path) - rotated 180°
    { position: [10, 0, 5], color: "#3b82f6", rotation: Math.PI },

    // Near Arcade - purple tint (moved to side of arcade, not on path)
    { position: [-7.8, 0, 7.3], color: "#8b5cf6" },

    // Near Disco - pink/magenta tint (offset from path)
    { position: [-9.7, 0, -12.4], color: "#ec4899" },

    // Near Stadium - green tint (offset from path) - rotated 45° right
    { position: [13.7, 0, -11.4], color: "#22c55e", rotation: -Math.PI / 4 },
  ]

  // Christmas mode: alternate red and green
  const christmasColors = ["#dc2626", "#22c55e", "#dc2626", "#22c55e"]

  // In low quality, show only 2 lamps
  const displayLamps = isLowQuality ? lampposts.slice(0, 2) : lampposts

  return (
    <>
      {displayLamps.map((lamp, i) => (
        <AmbientLamppost
          key={`ambient-lamp-${i}`}
          position={lamp.position}
          color={isChristmas ? christmasColors[i % 4] : lamp.color}
          isNight={isNight}
          animated={false}
          rotation={lamp.rotation}
        />
      ))}
    </>
  )
}
