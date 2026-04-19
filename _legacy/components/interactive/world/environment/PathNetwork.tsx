"use client"

import type { GraphicsQuality } from "../types"

interface PathNetworkProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: GraphicsQuality
}

interface PathSegment {
  start: [number, number] // [x, z]
  end: [number, number]
  width: number
}

/**
 * PathNetwork - Decorative paved paths connecting all buildings
 * Creates visual guidance and makes the world feel more polished
 */
export function PathNetwork({ worldMode, graphicsQuality }: PathNetworkProps) {
  const isLowQuality = graphicsQuality === "low"
  const isChristmas = worldMode === "christmas"

  // Path colors
  const pathColor = isChristmas ? "#d1d5db" : "#a8a29e"
  const pathBorderColor = isChristmas ? "#9ca3af" : "#78716c"

  // Define path segments connecting buildings to central plaza
  // Central plaza is at (0, -5)
  // All paths are now single straight lines for cleaner look
  const pathSegments: PathSegment[] = [
    // From spawn to central plaza - straight diagonal
    { start: [4.5, -27], end: [0, -5], width: 2.5 },

    // From central plaza to Arcade (0, 15) - straight north
    { start: [0, -5], end: [0, 12], width: 2 },

    // From central plaza to Cinema (15, 0) - goes east at same z level to avoid crossing arcade path
    { start: [0, -5], end: [12, -3], width: 2 },

    // From central plaza to Disco (-15, -20) - straight diagonal
    { start: [0, -5], end: [-12, -17], width: 2 },

    // From central plaza to Stadium (25, -15) - straight diagonal
    { start: [0, -5], end: [22, -12], width: 2 },

    // ========== CHEMIN DÉCORATIF VERS LES MONTAGNES (derrière le spawn) ==========
    // Prolonge la même ligne (spawn→plaza) mais de l'autre côté, vers les montagnes
    // Direction originale: [4.5, -27] → [0, -5], donc on continue: [4.5, -27] → [~15, -75]
    { start: [4.5, -27], end: [15, -75], width: 2.5 },
  ]

  // Calculate path mesh for a segment
  const createPathMesh = (segment: PathSegment, index: number) => {
    const [x1, z1] = segment.start
    const [x2, z2] = segment.end

    // Calculate center, length, and rotation
    const centerX = (x1 + x2) / 2
    const centerZ = (z1 + z2) / 2
    const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
    const angle = Math.atan2(x2 - x1, z2 - z1)

    return (
      <group key={`path-${index}`} position={[centerX, 0.005, centerZ]} rotation={[0, angle, 0]}>
        {/* Main path surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[segment.width, length]} />
          <meshStandardMaterial color={pathColor} roughness={0.9} />
        </mesh>

        {/* Border lines (only in medium/high quality) */}
        {!isLowQuality && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[segment.width / 2 - 0.05, 0.002, 0]}>
              <planeGeometry args={[0.1, length]} />
              <meshStandardMaterial color={pathBorderColor} roughness={0.85} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-segment.width / 2 + 0.05, 0.002, 0]}>
              <planeGeometry args={[0.1, length]} />
              <meshStandardMaterial color={pathBorderColor} roughness={0.85} />
            </mesh>
          </>
        )}
      </group>
    )
  }

  // Decorative tiles removed for cleaner look

  // Junction circles removed - the central plaza already has its own circular design

  return (
    <group>
      {/* Main path segments */}
      {pathSegments.map((segment, i) => createPathMesh(segment, i))}

      {/* Spawn area - stone paved circle matching other paths */}
      <group position={[4.5, 0.01, -27]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3, 24]} />
          <meshStandardMaterial
            color={pathBorderColor}
            roughness={0.8}
          />
        </mesh>
        {/* Inner circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <circleGeometry args={[2, 24]} />
          <meshStandardMaterial
            color={pathColor}
            roughness={0.8}
          />
        </mesh>
      </group>
    </group>
  )
}
