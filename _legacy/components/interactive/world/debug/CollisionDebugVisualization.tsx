"use client"

import { Html } from "@react-three/drei"
import type { CollisionZone } from "../types"

interface CollisionDebugVisualizationProps {
  collisionZones: CollisionZone[]
}

/**
 * CollisionDebugVisualization - Debug overlay showing collision zones and world boundaries
 * Only visible when showCollisionDebug is enabled
 */
export function CollisionDebugVisualization({ collisionZones }: CollisionDebugVisualizationProps) {
  return (
    <>
      {/* World Boundary Walls (invisible walls at maxX=28, maxZ=28) */}
      {/* North wall (Z = 28) */}
      <mesh position={[0, 2, 28]}>
        <boxGeometry args={[56, 4, 0.2]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      {/* South wall (Z = -28) */}
      <mesh position={[0, 2, -28]}>
        <boxGeometry args={[56, 4, 0.2]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      {/* East wall (X = 28) */}
      <mesh position={[28, 2, 0]}>
        <boxGeometry args={[0.2, 4, 56]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      {/* West wall (X = -28) */}
      <mesh position={[-28, 2, 0]}>
        <boxGeometry args={[0.2, 4, 56]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      {/* Floor boundary indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[56, 56]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.1} wireframe />
      </mesh>
      {/* Boundary labels */}
      <Html position={[0, 4.5, 28]} center zIndexRange={[0, 0]}>
        <div className="bg-red-600/90 text-white px-3 py-1 rounded text-xs font-bold pointer-events-none">
          MUR NORD (Z=28)
        </div>
      </Html>
      <Html position={[0, 4.5, -28]} center zIndexRange={[0, 0]}>
        <div className="bg-red-600/90 text-white px-3 py-1 rounded text-xs font-bold pointer-events-none">
          MUR SUD (Z=-28)
        </div>
      </Html>
      <Html position={[28, 4.5, 0]} center zIndexRange={[0, 0]}>
        <div className="bg-red-600/90 text-white px-3 py-1 rounded text-xs font-bold pointer-events-none">
          MUR EST (X=28)
        </div>
      </Html>
      <Html position={[-28, 4.5, 0]} center zIndexRange={[0, 0]}>
        <div className="bg-red-600/90 text-white px-3 py-1 rounded text-xs font-bold pointer-events-none">
          MUR OUEST (X=-28)
        </div>
      </Html>

      {/* Collision zones */}
      {collisionZones.map((zone, idx) => (
        <group key={`collision-debug-${zone.x}-${zone.z}-${zone.label}-${idx}`} position={[zone.x, 0.05, zone.z]}>
          {/* Flat box showing collision area */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[zone.width, zone.depth]} />
            <meshBasicMaterial color={zone.color} transparent opacity={0.5} />
          </mesh>
          {/* Wireframe border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[zone.width, zone.depth]} />
            <meshBasicMaterial color={zone.color} wireframe />
          </mesh>
          {/* Vertical box to show height */}
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[zone.width, 3, zone.depth]} />
            <meshBasicMaterial color={zone.color} transparent opacity={0.15} />
          </mesh>
          {/* Label */}
          <Html position={[0, 3.5, 0]} center zIndexRange={[0, 0]}>
            <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg pointer-events-none" style={{ borderColor: zone.color, borderWidth: 2, borderStyle: "solid" }}>
              <div className="font-bold text-sm" style={{ color: zone.color }}>{zone.id}</div>
              <div className="opacity-80">{zone.label}</div>
              <div className="text-[10px] opacity-60 mt-1">
                pos: ({zone.x}, {zone.z}) | size: {zone.width}x{zone.depth}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}
