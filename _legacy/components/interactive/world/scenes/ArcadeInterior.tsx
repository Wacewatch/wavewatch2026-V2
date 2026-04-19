"use client"

import { Html } from "@react-three/drei"
import { Gamepad2 } from "lucide-react"
import { VideoScreen } from "../../video-screen"
import { ImageScreen } from "../../image-screen"

interface ArcadeMachine {
  id: string
  name: string
  url: string
  media?: { type: string; src: string }
  openInNewTab?: boolean
  useProxy?: boolean
}

interface ArcadeInteriorProps {
  arcadeMachines: ArcadeMachine[]
  currentArcadeMachine: ArcadeMachine | null
  showArcade: boolean
  pendingExternalMachine: ArcadeMachine | null
  showMenu: boolean
  onSelectMachine: (machine: ArcadeMachine) => void
  onShowArcade: () => void
}

export function ArcadeInterior({
  arcadeMachines,
  currentArcadeMachine,
  showArcade,
  pendingExternalMachine,
  showMenu,
  onSelectMachine,
  onShowArcade,
}: ArcadeInteriorProps) {
  return (
    <>
      {/* Arcade Room Interior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#2d1b4e" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 5, -20]}>
        <boxGeometry args={[50, 10, 0.5]} />
        <meshStandardMaterial color="#1a0f2e" />
      </mesh>
      <mesh position={[-25, 5, 0]}>
        <boxGeometry args={[0.5, 10, 40]} />
        <meshStandardMaterial color="#1a0f2e" />
      </mesh>
      <mesh position={[25, 5, 0]}>
        <boxGeometry args={[0.5, 10, 40]} />
        <meshStandardMaterial color="#1a0f2e" />
      </mesh>

      {/* Ceiling with neon lights */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[50, 0.5, 40]} />
        <meshStandardMaterial color="#0f0a1e" />
      </mesh>

      {/* Neon strip lights */}
      {[-15, -5, 5, 15].map((x) => (
        <group key={`neon-${x}`} position={[x, 9.5, 0]}>
          <mesh>
            <boxGeometry args={[1, 0.2, 35]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={3} distance={15} color="#ff00ff" />
        </group>
      ))}

      {/* Arcade Machines - all at back wall with generous spacing */}
      {arcadeMachines.map((machine, idx) => {
        // Large spacing to fit all machines on back wall
        const spacing = 6
        const backWallZ = -18
        const totalMachines = arcadeMachines.length
        const totalWidth = (totalMachines - 1) * spacing
        const x = -totalWidth / 2 + idx * spacing
        const z = backWallZ
        const rotationY = 0 // All face forward

        return (
          <group key={machine.id} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
            {/* Machine Cabinet */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[2.5, 3, 1.5]} />
              <meshStandardMaterial
                color={["#e11d48", "#8b5cf6", "#0ea5e9", "#f59e0b"][idx % 4]}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>

            {/* Screen - Video or Image from machine.media */}
            <group position={[0, 2, 0.76]}>
              {machine.media?.type === 'video' ? (
                <VideoScreen
                  src={machine.media.src}
                  width={2}
                  height={1.5}
                  muted={true}
                  loop={true}
                />
              ) : machine.media?.type === 'image' ? (
                <ImageScreen
                  src={machine.media.src}
                  width={2}
                  height={1.5}
                />
              ) : (
                <mesh>
                  <planeGeometry args={[2, 1.5]} />
                  <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
                </mesh>
              )}
            </group>

            {/* Control Panel */}
            <mesh position={[0, 0.8, 1]} rotation={[-Math.PI / 6, 0, 0]}>
              <boxGeometry args={[2.3, 0.3, 0.8]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Machine name label - hide when a game, modal or menu is open */}
            {!currentArcadeMachine && !showArcade && !pendingExternalMachine && !showMenu && (
              <Html position={[0, 3.8, 0]} center occlude distanceFactor={15} zIndexRange={[0, 50]}>
                <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-base font-semibold whitespace-nowrap shadow-lg border border-white/20">
                  {machine.name}
                </div>
              </Html>
            )}

            {/* Interaction button - hide when a game, modal or menu is open */}
            {!currentArcadeMachine && !showArcade && !pendingExternalMachine && !showMenu && (
              <Html position={[0, 0.5, 1.5]} center occlude distanceFactor={15} zIndexRange={[0, 50]}>
                <button
                  onClick={() => onSelectMachine(machine)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-base px-5 py-2 rounded-lg font-semibold transition-all hover:scale-110 shadow-lg border-2 border-white/30"
                >
                  Jouer
                </button>
              </Html>
            )}

            {/* Light above machine */}
            <pointLight position={[0, 4, 0]} intensity={1.5} distance={8} color="#ff00ff" />
          </group>
        )
      })}

      {/* Button to show all machines list */}
      {!currentArcadeMachine && !showArcade && !pendingExternalMachine && !showMenu && (
        <Html position={[0, 1, 15]} center occlude zIndexRange={[0, 50]}>
          <button
            onClick={onShowArcade}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold shadow-xl flex items-center gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            Voir toutes les machines
          </button>
        </Html>
      )}
    </>
  )
}
