"use client"

import { useMemo } from "react"
import { Html } from "@react-three/drei"
import { DEFAULT_SPAWN_POSITION } from "../constants"

interface InfoPanelProps {
  position: [number, number, number]
  isNearby: boolean
  showButton?: boolean // Permet de cacher le bouton quand la map est ouverte
  onInteract: () => void
}

/**
 * InfoPanel - Panneau d'information près du spawn pour ouvrir la carte
 */
export function InfoPanel({ position, isNearby, showButton = true, onInteract }: InfoPanelProps) {
  const [panelX, , panelZ] = position

  // Calculate rotation to face spawn point
  const signRotation = useMemo(() => {
    const dx = DEFAULT_SPAWN_POSITION.x - panelX
    const dz = DEFAULT_SPAWN_POSITION.z - panelZ
    return Math.atan2(dx, dz)
  }, [panelX, panelZ])

  return (
    <group position={position}>
      {/* Poteau du panneau */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 2, 8]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Panneau tourné vers le spawn */}
      <group rotation={[0, signRotation, 0]}>
        {/* Panneau principal */}
        <mesh position={[0, 2.3, 0.05]} castShadow>
          <boxGeometry args={[1.5, 0.8, 0.1]} />
          <meshStandardMaterial color="#2563eb" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Bordure du panneau */}
        <mesh position={[0, 2.3, -0.01]}>
          <boxGeometry args={[1.6, 0.9, 0.02]} />
          <meshStandardMaterial color="#1e40af" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Icône carte stylisée en 3D - agrandie pour remplir le panneau */}
        <group position={[0, 2.3, 0.12]}>
          {/* Fond de carte (parchemin) */}
          <mesh>
            <planeGeometry args={[1.3, 0.65]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.8} />
          </mesh>

          {/* Lignes de routes horizontales */}
          <mesh position={[0, 0.15, 0.01]}>
            <planeGeometry args={[1.0, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0, -0.1, 0.01]}>
            <planeGeometry args={[0.9, 0.04]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>

          {/* Lignes de routes verticales */}
          <mesh position={[-0.25, 0, 0.01]}>
            <planeGeometry args={[0.04, 0.5]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0.3, 0.03, 0.01]}>
            <planeGeometry args={[0.035, 0.45]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>

          {/* Point de localisation (rouge) */}
          <mesh position={[0.1, -0.05, 0.02]}>
            <circleGeometry args={[0.07, 12]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>

          {/* Petits carrés représentant des bâtiments */}
          <mesh position={[-0.4, 0.2, 0.01]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0.45, -0.18, 0.01]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color="#8b5cf6" />
          </mesh>
          <mesh position={[-0.1, -0.22, 0.01]}>
            <planeGeometry args={[0.08, 0.08]} />
            <meshStandardMaterial color="#ec4899" />
          </mesh>
          <mesh position={[0.5, 0.18, 0.01]}>
            <planeGeometry args={[0.09, 0.09]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      </group>

      {/* Bouton d'interaction visible quand proche et que la map n'est pas ouverte */}
      {isNearby && showButton && (
        <Html position={[0, 3.2, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <button
            onClick={onInteract}
            className="bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-bold transition-all hover:scale-110 border-2 border-white/30 flex items-center gap-2"
          >
            Carte <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd>
          </button>
        </Html>
      )}
    </group>
  )
}
