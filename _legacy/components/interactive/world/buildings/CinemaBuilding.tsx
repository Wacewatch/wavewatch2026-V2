"use client"

import { useMemo } from "react"
import { Html, Text } from "@react-three/drei"
import { DEFAULT_SPAWN_POSITION } from "../constants"

interface CinemaBuildingProps {
  position: [number, number, number]
  playerPosition: { x: number; z: number }
  onEnter: () => void
}

export function CinemaBuilding({ position, playerPosition, onEnter }: CinemaBuildingProps) {
  const [buildingX, , buildingZ] = position

  // Calculate rotation to face spawn point
  const signRotation = useMemo(() => {
    const dx = DEFAULT_SPAWN_POSITION.x - buildingX
    const dz = DEFAULT_SPAWN_POSITION.z - buildingZ
    return Math.atan2(dx, dz)
  }, [buildingX, buildingZ])
  const distanceToBuilding = Math.sqrt(
    Math.pow(playerPosition.x - buildingX, 2) + Math.pow(playerPosition.z - buildingZ, 2)
  )
  const isNearby = distanceToBuilding < 8

  // Animated effects removed for performance

  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[8, 5, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Building crown */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <boxGeometry args={[8.5, 0.5, 8.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* ============= CINEMA SIGN (FACING SPAWN) ============= */}
      <group position={[0, 6.5, 0]} rotation={[0, signRotation, 0]}>
        <group position={[0, 0, 4.5]}>
          {/* Main marquee board */}
          <mesh>
            <boxGeometry args={[5, 1.5, 0.3]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* CINEMA text */}
          <Text
            position={[0, 0, 0.2]}
            fontSize={0.7}
            color="#ffd700"
            anchorX="center"
            anchorY="middle"
          >
            CINEMA
          </Text>

          {/* Static lights around marquee */}
          {Array.from({ length: 14 }).map((_, i) => {
            const isTop = i < 5
            const isBottom = i >= 5 && i < 10
            const isLeft = i >= 10 && i < 12
            const isRight = i >= 12

            let x = 0, y = 0
            if (isTop) {
              x = (i - 2) * 0.5
              y = 0.6
            } else if (isBottom) {
              x = ((i - 5) - 2) * 0.5
              y = -0.6
            } else if (isLeft) {
              x = -2.2
              y = ((i - 10) - 0.5) * 0.5
            } else if (isRight) {
              x = 2.2
              y = ((i - 12) - 0.5) * 0.5
            }

            return (
              <mesh key={`marquee-light-${i}`} position={[x, y, 0.18]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial
                  color="#ffff00"
                  emissive="#ffff00"
                  emissiveIntensity={1}
                />
              </mesh>
            )
          })}
        </group>
      </group>

      {/* ============= RED CARPET ENTRANCE ============= */}
      {/* Long red carpet */}
      <mesh position={[-6, 0.02, -2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[5, 0.04, 2.5]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} metalness={0} />
      </mesh>
      {/* Carpet leading to door */}
      <mesh position={[-4.5, 0.02, -2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.04, 2.5]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} metalness={0} />
      </mesh>

      {/* Velvet rope posts */}
      {[[-7, -0.8], [-7, -3.2], [-5, -0.8], [-5, -3.2]].map(([x, z], idx) => (
        <group key={`rope-post-${idx}`} position={[x, 0, z]}>
          {/* Gold post */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Top sphere */}
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Velvet ropes (simplified as cylinders) */}
      <mesh position={[-6, 0.7, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#800020" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[-6, 0.7, -3.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#800020" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* ============= MOVIE POSTERS ============= */}
      {/* Poster frames on front wall - flat colors without glow */}
      <group position={[2.5, 3, 4.15]}>
        {/* Poster frame */}
        <mesh>
          <boxGeometry args={[1.6, 2.4, 0.1]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Poster content - flat color */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.4, 2.2]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.8} />
        </mesh>
      </group>

      <group position={[-2.5, 3, 4.15]}>
        {/* Poster frame */}
        <mesh>
          <boxGeometry args={[1.6, 2.4, 0.1]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Poster content - flat color */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.4, 2.2]} />
          <meshStandardMaterial color="#4ecdc4" roughness={0.8} />
        </mesh>
      </group>

      {/* Projector spotlights removed for performance */}

      {/* ============= ENTRANCE ============= */}
      {/* Door */}
      <mesh position={[-4.1, 1.5, -2]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#4a1010" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Door frame - golden */}
      <mesh position={[-4.15, 1.5, -2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.3, 3.3, 0.05]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Door handle */}
      <mesh position={[-4.2, 1.2, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Entrance steps */}
      <mesh position={[-5, 0.1, -2]}>
        <boxGeometry args={[1.5, 0.2, 2.5]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} metalness={0} />
      </mesh>

      {/* ============= DECORATIVE WINDOWS ============= */}
      {[-2, 0, 2].map((x) => (
        <mesh key={`window-${x}`} position={[x, 3, 4.1]}>
          <planeGeometry args={[1.5, 1.8]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.3} />
        </mesh>
      ))}

      {/* Main neon sign removed for performance */}

      {/* Entry button visible when nearby */}
      {isNearby && (
        <Html position={[0, 2, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <button
            onClick={onEnter}
            className="bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-bold transition-all hover:scale-110 border-2 border-white/30 flex items-center gap-2"
          >
            Entrer <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd>
          </button>
        </Html>
      )}
    </group>
  )
}
