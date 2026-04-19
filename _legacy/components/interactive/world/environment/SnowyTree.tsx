"use client"

interface SnowyTreeProps {
  position: [number, number, number]
}

// SnowyTree - Tree with snow on top
export function SnowyTree({ position }: SnowyTreeProps) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 3, 12]} />
        <meshStandardMaterial color="#5a3a1a" roughness={1} metalness={0} />
      </mesh>

      {/* Snowy foliage layers - darker green with white snow caps */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.5, 2, 8]} />
        <meshStandardMaterial color="#1a3d0c" roughness={0.9} metalness={0} />
      </mesh>
      {/* Snow cap layer 1 */}
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[1.2, 0.5, 8]} />
        <meshStandardMaterial color="#f0f8ff" roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[1.2, 1.8, 8]} />
        <meshStandardMaterial color="#254d12" roughness={0.9} metalness={0} />
      </mesh>
      {/* Snow cap layer 2 */}
      <mesh position={[0, 4.85, 0]} castShadow>
        <coneGeometry args={[0.95, 0.4, 8]} />
        <meshStandardMaterial color="#f0f8ff" roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh position={[0, 5.3, 0]} castShadow>
        <coneGeometry args={[0.9, 1.5, 8]} />
        <meshStandardMaterial color="#2d5a16" roughness={0.9} metalness={0} />
      </mesh>
      {/* Snow cap layer 3 (top) */}
      <mesh position={[0, 5.65, 0]} castShadow>
        <coneGeometry args={[0.7, 0.35, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  )
}
