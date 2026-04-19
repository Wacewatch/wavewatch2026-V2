'use client'

import { Html } from '@react-three/drei'
import { useState } from 'react'
import { Film } from 'lucide-react'

interface CinemaBuildingProps {
  position: [number, number, number]
  onEnter: () => void
}

export function CinemaBuilding({ position, onEnter }: CinemaBuildingProps) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <group position={position}>
      {/* Base du bâtiment */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[6, 4, 4]} />
        <meshStandardMaterial 
          color={hovered ? "#dc2626" : "#991b1b"} 
          emissive={hovered ? "#dc2626" : "#000000"}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Toit */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[6.5, 0.5, 4.5]} />
        <meshStandardMaterial color="#450a0a" />
      </mesh>
      
      {/* Enseigne */}
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[5, 1, 0.2]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24"
          emissiveIntensity={1}
        />
      </mesh>
      
      {/* Porte */}
      <mesh 
        position={[0, 0.8, 2.01]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={onEnter}
      >
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      
      {/* Fenêtres */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 2.5, 2.01]}>
          <boxGeometry args={[1, 1.2, 0.1]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            emissive="#60a5fa"
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      
      {/* Panneau interactif */}
      {hovered && (
        <Html position={[0, 1.5, 3]} center>
          <div className="bg-black/80 backdrop-blur-lg text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap pointer-events-none">
            <Film className="w-4 h-4" />
            <span>Cliquez pour entrer au Cinéma</span>
          </div>
        </Html>
      )}
      
      {/* Lumières extérieures */}
      <pointLight position={[0, 1, 3]} intensity={2} distance={5} color="#fbbf24" />
      <pointLight position={[-3, 2, 0]} intensity={1} distance={8} color="#dc2626" />
      <pointLight position={[3, 2, 0]} intensity={1} distance={8} color="#dc2626" />
    </group>
  )
}
