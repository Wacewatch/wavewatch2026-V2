"use client"

// DiscoWalls - Murs de la discothèque toujours transparents
export function DiscoWalls() {
  return (
    <>
      {/* Back wall */}
      <mesh position={[0, 5, -17.5]}>
        <boxGeometry args={[40, 10, 0.5]} />
        <meshStandardMaterial color="#0d0d1a" transparent opacity={0.15} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-20, 5, 0]}>
        <boxGeometry args={[0.5, 10, 35]} />
        <meshStandardMaterial color="#0d0d1a" transparent opacity={0.15} />
      </mesh>
      {/* Right wall */}
      <mesh position={[20, 5, 0]}>
        <boxGeometry args={[0.5, 10, 35]} />
        <meshStandardMaterial color="#0d0d1a" transparent opacity={0.15} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[40, 0.5, 35]} />
        <meshStandardMaterial color="#0a0a12" transparent opacity={0.15} />
      </mesh>
    </>
  )
}
