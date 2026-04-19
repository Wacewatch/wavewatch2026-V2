"use client"

interface WorldGroundProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
}

/**
 * WorldGround - Ground plane that changes appearance based on world mode
 * Extended to 250x250 to cover the city skyline buildings
 * White snow in christmas mode, green grass otherwise
 */
export function WorldGround({ worldMode }: WorldGroundProps) {
  const isChristmas = worldMode === "christmas"

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[250, 250]} />
      <meshStandardMaterial
        color={isChristmas ? "#f0f8ff" : "#4ade80"}
        roughness={isChristmas ? 0.85 : 0.95}
        metalness={isChristmas ? 0.1 : 0}
      />
    </mesh>
  )
}
