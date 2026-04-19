"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { GraphicsQuality } from "../types"
import { ChristmasTree } from "./ChristmasTree"

interface CentralPlazaProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: GraphicsQuality
}

/**
 * CentralPlaza - The heart of the world with an animated fountain,
 * circular benches, decorative pavement, and ambient lighting
 */
export function CentralPlaza({ worldMode, graphicsQuality }: CentralPlazaProps) {
  const fountainWaterRef = useRef<THREE.Mesh>(null)
  const fountainJetsRef = useRef<THREE.Group>(null)
  const isLowQuality = graphicsQuality === "low"
  const isNight = worldMode === "night"
  const isChristmas = worldMode === "christmas"

  // Animate fountain water jets
  useFrame(({ clock }) => {
    if (fountainJetsRef.current && !isLowQuality) {
      const time = clock.getElapsedTime()
      fountainJetsRef.current.children.forEach((jet, i) => {
        // Each jet oscillates at different phases
        const phase = (i / 8) * Math.PI * 2
        const height = 0.8 + Math.sin(time * 2 + phase) * 0.3
        jet.scale.y = height
        jet.position.y = 1.5 + height * 0.5
      })
    }
    // Subtle water surface animation
    if (fountainWaterRef.current) {
      const time = clock.getElapsedTime()
      fountainWaterRef.current.rotation.y = time * 0.1
    }
  })

  // Plaza position - center of the world
  const plazaPosition: [number, number, number] = [0, 0, -5]

  // Colors based on mode
  const stoneColor = isChristmas ? "#e5e7eb" : "#9ca3af"
  const stoneDarkColor = isChristmas ? "#d1d5db" : "#6b7280"
  const waterColor = isChristmas ? "#93c5fd" : "#60a5fa"
  const metalColor = "#71717a"

  // Bench positions around the fountain (circular arrangement)
  const benchAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
  const benchRadius = 6

  return (
    <group position={plazaPosition}>
      {/* ========== PAVEMENT / GROUND TILES ========== */}
      {/* Main circular plaza floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial color={stoneColor} roughness={0.8} />
      </mesh>

      {/* Decorative inner circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[3.5, 4, 32]} />
        <meshStandardMaterial color={stoneDarkColor} roughness={0.7} />
      </mesh>

      {/* Outer decorative ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[9, 10, 32]} />
        <meshStandardMaterial color={stoneDarkColor} roughness={0.7} />
      </mesh>

      {/* Radial lines (8 directions) - contained within the plaza circle */}
      {!isLowQuality &&
        Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={`radial-${i}`}
              rotation={[-Math.PI / 2, 0, angle]}
              position={[0, 0.015, 0]}
              receiveShadow
            >
              <planeGeometry args={[0.12, 8]} />
              <meshStandardMaterial color={stoneDarkColor} roughness={0.7} />
            </mesh>
          )
        })}

      {/* ========== CENTRAL ELEMENT: CHRISTMAS TREE OR FOUNTAIN ========== */}
      {isChristmas ? (
        /* Christmas Tree in center */
        <ChristmasTree position={[0, 0, 0]} scale={1.8} />
      ) : (
        /* Fountain (non-Christmas modes) */
        <group position={[0, 0, 0]}>
          {/* Base pool - larger outer ring */}
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3, 3.3, 0.4, 24]} />
            <meshStandardMaterial color={metalColor} roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Water in the pool */}
          <mesh ref={fountainWaterRef} position={[0, 0.35, 0]}>
            <cylinderGeometry args={[2.7, 2.7, 0.1, 24]} />
            <meshStandardMaterial
              color={waterColor}
              transparent
              opacity={0.7}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>

          {/* Inner raised tier */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[1.5, 1.8, 0.5, 16]} />
            <meshStandardMaterial color={metalColor} roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Central column */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 1, 12]} />
            <meshStandardMaterial color="#52525b" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* Top ornamental sphere */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color={waterColor}
              emissive={waterColor}
              emissiveIntensity={isNight ? 0.5 : 0.2}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>

          {/* Animated water jets (8 jets around the sphere) */}
          {!isLowQuality && (
            <group ref={fountainJetsRef}>
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2
                const x = Math.cos(angle) * 0.3
                const z = Math.sin(angle) * 0.3
                return (
                  <mesh key={`jet-${i}`} position={[x, 2, z]}>
                    <cylinderGeometry args={[0.03, 0.05, 1, 6]} />
                    <meshStandardMaterial
                      color="#93c5fd"
                      transparent
                      opacity={0.6}
                      emissive="#60a5fa"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                )
              })}
            </group>
          )}

          {/* Fountain light - no shadow to save GPU */}
          <pointLight
            position={[0, 2.5, 0]}
            intensity={isNight ? 2 : 1}
            distance={12}
            color={waterColor}
          />
        </group>
      )}

      {/* ========== CIRCULAR BENCHES ========== */}
      {!isLowQuality &&
        benchAngles.map((angle, i) => {
          const x = Math.cos(angle) * benchRadius
          const z = Math.sin(angle) * benchRadius
          return (
            <group
              key={`plaza-bench-${i}`}
              position={[x, 0, z]}
              rotation={[0, -angle + Math.PI / 2, 0]}
            >
              {/* Curved bench seat */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[2.5, 0.1, 0.6]} />
                <meshStandardMaterial color="#78350f" roughness={0.85} />
              </mesh>
              {/* Back rest */}
              <mesh position={[0, 0.75, -0.25]} castShadow>
                <boxGeometry args={[2.5, 0.5, 0.08]} />
                <meshStandardMaterial color="#78350f" roughness={0.85} />
              </mesh>
              {/* Left leg */}
              <mesh position={[-1, 0.22, 0]} castShadow>
                <boxGeometry args={[0.15, 0.45, 0.5]} />
                <meshStandardMaterial color="#44403c" roughness={0.7} metalness={0.3} />
              </mesh>
              {/* Right leg */}
              <mesh position={[1, 0.22, 0]} castShadow>
                <boxGeometry args={[0.15, 0.45, 0.5]} />
                <meshStandardMaterial color="#44403c" roughness={0.7} metalness={0.3} />
              </mesh>
            </group>
          )
        })}

      {/* ========== DECORATIVE LAMP POSTS (4 corners) - No pointLights to save GPU ========== */}
      {!isLowQuality &&
        [45, 135, 225, 315].map((deg, i) => {
          const angle = (deg * Math.PI) / 180
          const x = Math.cos(angle) * 8.5
          const z = Math.sin(angle) * 8.5
          return (
            <group key={`plaza-lamp-${i}`} position={[x, 0, z]}>
              {/* Base */}
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 0.3, 8]} />
                <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Pole */}
              <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.12, 3.7, 8]} />
                <meshStandardMaterial color="#3f3f46" roughness={0.3} metalness={0.9} />
              </mesh>
              {/* Lamp holder */}
              <mesh position={[0, 3.7, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.15, 0.3, 8]} />
                <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Light globe - emissive material simulates light without GPU cost */}
              <mesh position={[0, 4, 0]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial
                  color="#fef3c7"
                  emissive="#fbbf24"
                  emissiveIntensity={isNight ? 2 : 0.8}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </group>
          )
        })}


      {/* ========== SMALL DECORATIVE PLANTERS ========== */}
      {!isLowQuality &&
        [0, 90, 180, 270].map((deg, i) => {
          const angle = (deg * Math.PI) / 180
          const x = Math.cos(angle) * 5
          const z = Math.sin(angle) * 5
          // Only place planters between benches
          if (i % 2 === 0) return null
          return (
            <group key={`planter-${i}`} position={[x, 0, z]}>
              {/* Pot */}
              <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.35, 0.6, 8]} />
                <meshStandardMaterial color="#78716c" roughness={0.8} />
              </mesh>
              {/* Plant/flowers */}
              <mesh position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.45, 8, 8]} />
                <meshStandardMaterial
                  color={isChristmas ? "#dc2626" : "#22c55e"}
                  roughness={0.9}
                />
              </mesh>
            </group>
          )
        })}
    </group>
  )
}
