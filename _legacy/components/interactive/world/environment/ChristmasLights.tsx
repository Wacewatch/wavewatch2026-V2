"use client"

import { useMemo } from "react"

interface ChristmasLightsProps {
  start: [number, number, number]
  end: [number, number, number]
  count?: number
  color?: string
}

// ChristmasLights - String lights for buildings
export function ChristmasLights({
  start,
  end,
  count = 10,
  color = "#ff0000"
}: ChristmasLightsProps) {
  const colors = ["#ff0000", "#00ff00", "#ffff00", "#0088ff", "#ff00ff", "#ffffff"]

  const lights = useMemo(() => {
    const result: { pos: [number, number, number]; color: string }[] = []
    for (let i = 0; i <= count; i++) {
      const t = i / count
      result.push({
        pos: [
          start[0] + (end[0] - start[0]) * t,
          start[1] + (end[1] - start[1]) * t - Math.sin(t * Math.PI) * 0.3, // Slight droop
          start[2] + (end[2] - start[2]) * t,
        ] as [number, number, number],
        color: colors[i % colors.length],
      })
    }
    return result
  }, [start, end, count])

  return (
    <group>
      {/* Emissive spheres only - NO pointLights to avoid exceeding GPU uniform limit */}
      {lights.map((light, idx) => (
        <mesh key={`string-light-${idx}-${light.pos[0].toFixed(2)}-${light.pos[2].toFixed(2)}`} position={light.pos}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color={light.color}
            emissive={light.color}
            emissiveIntensity={4}
            metalness={0}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
