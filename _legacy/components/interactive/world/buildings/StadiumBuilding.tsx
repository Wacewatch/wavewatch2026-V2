"use client"

import { useMemo } from "react"
import { Html, Text } from "@react-three/drei"
import { DEFAULT_SPAWN_POSITION } from "../constants"

interface StadiumBuildingProps {
  position: [number, number, number]
  playerPosition: { x: number; z: number }
  onEnter: () => void
}

export function StadiumBuilding({ position, playerPosition, onEnter }: StadiumBuildingProps) {
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
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[12, 7, 10]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Building crown */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[12.5, 0.5, 10.5]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* ============= GIANT OUTDOOR SCREENS ============= */}
      {/* Main screen on front - static neutral screen */}
      <group position={[0, 5.5, 5.3]}>
        {/* Screen frame */}
        <mesh>
          <boxGeometry args={[6, 3, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Screen display - neutral dark color */}
        <mesh position={[0, 0, 0.2]}>
          <planeGeometry args={[5.6, 2.7]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#1e293b"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Side screen - neutral */}
      <group position={[6.3, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[4, 2.5, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <planeGeometry args={[3.7, 2.2]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#1e293b"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* ============= STADIUM SIGN (FACING SPAWN) ============= */}
      <group position={[0, 8.5, 0]} rotation={[0, signRotation, 0]}>
        <group position={[0, 0, 6]}>
          {/* Sign board */}
          <mesh>
            <boxGeometry args={[5, 1.5, 0.2]} />
            <meshStandardMaterial color="#0a4a0a" roughness={0.7} metalness={0.2} />
          </mesh>
          <Text
            position={[0, 0, 0.15]}
            fontSize={0.8}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            STADIUM
          </Text>
        </group>
      </group>

      {/* ============= STADIUM LIGHTS ============= */}
      {/* Corner floodlights */}
      {[[-6, 5], [6, 5], [-6, -5], [6, -5]].map(([x, z], idx) => (
        <group key={`floodlight-${idx}`} position={[x, 8, z]}>
          <mesh>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.6]} />
            <meshStandardMaterial
              color="#ffffcc"
              emissive="#ffffcc"
              emissiveIntensity={1}
            />
          </mesh>
          <pointLight
            position={[0, -0.5, 0]}
            intensity={1.5}
            distance={15}
            color="#ffffcc"
          />
        </group>
      ))}

      {/* ============= ENTRANCE ============= */}
      {/* Door */}
      <mesh position={[-6.1, 1.5, 3]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Door frame */}
      <mesh position={[-6.15, 1.5, 3]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.3, 3.3, 0.05]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Door handle */}
      <mesh position={[-6.2, 1.2, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Entrance steps */}
      <mesh position={[-7, 0.1, 3]}>
        <boxGeometry args={[1.5, 0.2, 2.5]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} metalness={0} />
      </mesh>

      {/* Main roof sign light removed for performance */}

      {/* Entry button visible when nearby */}
      {isNearby && (
        <Html position={[0, 2, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <button
            onClick={onEnter}
            className="bg-green-600/90 backdrop-blur-sm hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-bold transition-all hover:scale-110 border-2 border-white/30 flex items-center gap-2"
          >
            Entrer <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd>
          </button>
        </Html>
      )}
    </group>
  )
}
