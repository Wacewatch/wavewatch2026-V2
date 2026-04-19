"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef, useMemo } from "react"

interface ChristmasTreeProps {
  position: [number, number, number]
  scale?: number
}

// ChristmasTree - Decorated Christmas tree with ornaments and star
export function ChristmasTree({ position, scale = 1 }: ChristmasTreeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const starRef = useRef<THREE.Mesh>(null)
  const lightsRef = useRef<THREE.Group>(null)

  // Animate star glow and lights
  useFrame((state) => {
    if (starRef.current) {
      const material = starRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5
    }
  })

  // Ornament colors
  const ornamentColors = ["#ff0000", "#ffd700", "#0066cc", "#ff6600", "#cc00ff", "#00cc66"]

  // Generate ornament positions around the tree
  const ornaments = useMemo(() => {
    const orns: { pos: [number, number, number]; color: string }[] = []
    const layers = [
      { y: 2.2, radius: 1.3, count: 8 },
      { y: 3.2, radius: 1.0, count: 6 },
      { y: 4.0, radius: 0.75, count: 5 },
      { y: 4.7, radius: 0.5, count: 4 },
    ]

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2
        orns.push({
          pos: [
            Math.cos(angle) * layer.radius,
            layer.y,
            Math.sin(angle) * layer.radius,
          ] as [number, number, number],
          color: ornamentColors[Math.floor(Math.random() * ornamentColors.length)],
        })
      }
    })
    return orns
  }, [])

  // Generate light positions (string lights)
  const lightPositions = useMemo(() => {
    const lights: { pos: [number, number, number]; color: string }[] = []
    const colors = ["#ff0000", "#00ff00", "#ffff00", "#0088ff", "#ff00ff", "#ffffff"]

    for (let y = 1.5; y < 5; y += 0.6) {
      const radius = 1.5 - (y - 1.5) * 0.25
      const count = Math.floor(8 - (y - 1.5))
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + y * 0.5 // Spiral effect
        lights.push({
          pos: [
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius,
          ] as [number, number, number],
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }
    return lights
  }, [])

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 1.5, 12]} />
        <meshStandardMaterial color="#4a2810" roughness={1} metalness={0} />
      </mesh>

      {/* Tree pot/base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.5, 0.4, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Tree layers (dark green like a real Christmas tree) */}
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.8, 2.5, 12]} />
        <meshStandardMaterial color="#0d3b0d" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.4, 2, 12]} />
        <meshStandardMaterial color="#0f4a0f" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <coneGeometry args={[1.0, 1.8, 12]} />
        <meshStandardMaterial color="#116611" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 5.0, 0]} castShadow>
        <coneGeometry args={[0.6, 1.4, 12]} />
        <meshStandardMaterial color="#1a7a1a" roughness={0.9} metalness={0} />
      </mesh>

      {/* Star on top */}
      <mesh ref={starRef} position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffaa00"
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 5.8, 0]} intensity={3} distance={8} color="#ffd700" />

      {/* Ornament balls */}
      {ornaments.map((orn, idx) => (
        <mesh key={`ornament-${idx}-${orn.pos[0].toFixed(2)}-${orn.pos[1].toFixed(2)}`} position={orn.pos} castShadow>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial
            color={orn.color}
            metalness={0.9}
            roughness={0.1}
            emissive={orn.color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* String lights - emissive only, NO pointLights to save GPU uniforms */}
      <group ref={lightsRef}>
        {lightPositions.map((light, idx) => (
          <mesh key={`xmas-light-${idx}-${light.pos[0].toFixed(2)}-${light.pos[1].toFixed(2)}`} position={light.pos}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={light.color}
              emissive={light.color}
              emissiveIntensity={3}
              metalness={0}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Snow on tree (subtle) */}
      <mesh position={[0, 5.2, 0]}>
        <coneGeometry args={[0.4, 0.3, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0.1} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
