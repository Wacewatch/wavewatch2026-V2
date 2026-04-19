"use client"

import { useMemo } from "react"
import { Html, Text } from "@react-three/drei"
import { DEFAULT_SPAWN_POSITION } from "../constants"

interface ArcadeBuildingProps {
  position: [number, number, number]
  playerPosition: { x: number; z: number }
  onEnter: () => void
}

export function ArcadeBuilding({ position, playerPosition, onEnter }: ArcadeBuildingProps) {
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

  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[10, 6, 10]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Building crown/ledge */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[10.5, 0.5, 10.5]} />
        <meshStandardMaterial color="#6b21a8" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* ============= ARCADE SIGN (FACING SPAWN) ============= */}
      <group position={[0, 7.5, 0]} rotation={[0, signRotation, 0]}>
        <group position={[0, 0, 5.5]}>
          {/* Sign backing board */}
          <mesh>
            <boxGeometry args={[5, 1.5, 0.2]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* ARCADE text */}
          <Text
            position={[0, 0, 0.15]}
            fontSize={0.8}
            color="#8b5cf6"
            anchorX="center"
            anchorY="middle"
          >
            ARCADE
          </Text>
        </group>
      </group>

      {/* ============= NEON TUBES (STATIC) ============= */}
      {/* Left side neon */}
      <mesh position={[-5.1, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 4, 8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <pointLight position={[-5.5, 4, 0]} intensity={1.5} distance={6} color="#00ffff" />

      {/* Right side neon */}
      <mesh position={[5.1, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 4, 8]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <pointLight position={[5.5, 4, 0]} intensity={1.5} distance={6} color="#ff00ff" />

      {/* Front neon strip */}
      <mesh position={[0, 6.2, -5.2]}>
        <boxGeometry args={[8, 0.15, 0.15]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <pointLight position={[0, 6.2, -5.5]} intensity={2} distance={8} color="#ffff00" />

      {/* ============= GAME THEMED WINDOWS ============= */}
      {/* Windows with flat colors - no glow */}
      {[-3, 0, 3].map((x, idx) => (
        <group key={`arcade-window-${x}`}>
          {/* Window frame */}
          <mesh position={[x, 3.5, -5.15]}>
            <boxGeometry args={[1.8, 2.2, 0.1]} />
            <meshStandardMaterial color="#1e1e2e" roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Window - flat colors */}
          <mesh position={[x, 3.5, -5.1]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial
              color={["#00ff00", "#ff0066", "#00ccff"][idx]}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* ============= ENTRANCE ENHANCEMENTS ============= */}
      {/* Door with neon frame */}
      <mesh position={[0, 1.5, -5.1]} castShadow>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#2d1b4e" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Neon door frame */}
      <mesh position={[0, 1.5, -5.18]}>
        <boxGeometry args={[2.4, 3.4, 0.05]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={1.2}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.5, 1.2, -5.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Entrance steps with LED strip */}
      <mesh position={[0, 0.1, -6]}>
        <boxGeometry args={[3, 0.2, 2]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* LED strip on steps */}
      <mesh position={[0, 0.22, -5.2]}>
        <boxGeometry args={[2.8, 0.05, 0.1]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Decorative joystick pillars removed for performance */}

      {/* Main roof light removed for performance */}

      {/* Entry button visible when nearby */}
      {isNearby && (
        <Html position={[0, 2, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <button
            onClick={onEnter}
            className="bg-purple-600/90 backdrop-blur-sm hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-bold transition-all hover:scale-110 border-2 border-white/30 flex items-center gap-2"
          >
            Entrer <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd>
          </button>
        </Html>
      )}
    </group>
  )
}
