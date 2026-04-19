"use client"

/**
 * DecorativeBuildings - Bâtiments décoratifs non-interactifs du monde 3D
 * Ces bâtiments servent uniquement à remplir le décor
 */

interface DecorativeBuildingsProps {
  // Peut être étendu plus tard pour supporter différents thèmes
}

// Bâtiment bleu simple avec toit
function BlueBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Corps principal */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 4, 4]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      {/* Toit/bordure */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[5.2, 1, 4.2]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
    </group>
  )
}

// Bâtiment orange avec structure sur le toit
function OrangeBuilding({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Corps principal */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 6, 4]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      {/* Toit plat avec bordure */}
      <mesh position={[0, 6.2, 0]} castShadow>
        <boxGeometry args={[4.2, 0.4, 4.2]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
      {/* Petite structure sur le toit */}
      <mesh position={[0, 6.8, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  )
}

export function DecorativeBuildings({}: DecorativeBuildingsProps) {
  return (
    <>
      {/* Bâtiment bleu - côté gauche */}
      <BlueBuilding position={[-15, 0, 5]} />

      {/* Bâtiment orange - côté gauche */}
      <OrangeBuilding position={[-15, 0, -8]} />
    </>
  )
}
