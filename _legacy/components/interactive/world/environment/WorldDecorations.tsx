"use client"

import { RealisticTree, SnowyTree, RealisticLamppost } from "../environment"
import type { GraphicsQuality } from "../types"

interface WorldDecorationsProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: GraphicsQuality
}

// Tree positions based on quality
const LOW_QUALITY_TREES = [
  [-24.1, -13.4],
  [15, -15],
]

const NORMAL_QUALITY_TREES = [
  [-24.1, -13.4],
  [-6.1, -25.2],
  [15, -15],
  [-18, 10],
  [18, 10],
  [-10, 15],
  [10, 15],
]

// Lamppost positions based on quality
const LOW_QUALITY_LAMPS = [[0, -10]]
const NORMAL_QUALITY_LAMPS = [
  [-10, -10],
  [0, -10],
  [10, -10],
  [-10, 10],
  [10, 10],
]

// Bench positions
const BENCH_POSITIONS = [-12, 12]

// Bush positions
const BUSH_POSITIONS = [
  [5, -10],
  [-5, -10],
  [10, 5],
  [-10, 5],
  [12, -5],
  [-12, -5],
]

/**
 * WorldDecorations - Trees, lampposts, benches, fountain, and bushes
 * Extracted from world-3d-v2.tsx for better organization
 */
export function WorldDecorations({ worldMode, graphicsQuality }: WorldDecorationsProps) {
  const isChristmas = worldMode === "christmas"
  const isLowQuality = graphicsQuality === "low"
  const treePositions = isLowQuality ? LOW_QUALITY_TREES : NORMAL_QUALITY_TREES
  const lampPositions = isLowQuality ? LOW_QUALITY_LAMPS : NORMAL_QUALITY_LAMPS

  return (
    <>
      {/* Trees - use SnowyTree in christmas mode */}
      {treePositions.map(([x, z], i) =>
        isChristmas ? (
          <SnowyTree key={`tree-${i}-${x}-${z}`} position={[x, 0, z]} />
        ) : (
          <RealisticTree key={`tree-${i}-${x}-${z}`} position={[x, 0, z]} />
        )
      )}

      {/* Christmas tree now displayed in CentralPlaza component */}

      {/* Lampposts */}
      {lampPositions.map(([x, z], i) => (
        <RealisticLamppost key={`lamp-${i}-${x}-${z}`} position={[-20, 0, z]} />
      ))}

      {/* Benches - only in medium/high quality */}
      {!isLowQuality &&
        BENCH_POSITIONS.map((z) => (
          <group key={`bench-${z}`} position={[-18, 0, z]}>
            {/* Seat */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[2, 0.1, 0.8]} />
              <meshStandardMaterial color="#8b4513" roughness={0.9} />
            </mesh>
            {/* Left leg */}
            <mesh position={[-0.8, 0.2, 0]} castShadow>
              <boxGeometry args={[0.1, 0.4, 0.8]} />
              <meshStandardMaterial color="#6b4423" roughness={0.9} />
            </mesh>
            {/* Right leg */}
            <mesh position={[0.8, 0.2, 0]} castShadow>
              <boxGeometry args={[0.1, 0.4, 0.8]} />
              <meshStandardMaterial color="#6b4423" roughness={0.9} />
            </mesh>
          </group>
        ))}

      {/* Old Fountain removed - replaced by CentralPlaza component */}

      {/* Bushes - only in medium/high quality */}
      {!isLowQuality &&
        BUSH_POSITIONS.map(([x, z], i) => (
          <group key={`bush-${i}-${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.8, 8, 8]} />
              <meshStandardMaterial color="#2d5016" roughness={0.95} />
            </mesh>
            <mesh position={[0.4, 0.6, 0.3]} castShadow>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color="#3a6b1e" roughness={0.95} />
            </mesh>
          </group>
        ))}
    </>
  )
}
