"use client"

import { HLSVideoScreen } from "../../hls-video-screen"

interface Stadium {
  embed_url?: string
}

interface StadiumSeat {
  side: string
  row: number
}

interface StadiumInteriorProps {
  stadium: Stadium | null
  stadiumSeat: StadiumSeat | null
  isStadiumMuted: boolean
}

export function StadiumInterior({ stadium, stadiumSeat, isStadiumMuted }: StadiumInteriorProps) {
  return (
    <>
      {/* Stadium Interior - Proper football stadium */}
      {/* Field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#1c7430" />
      </mesh>

      {/* Field lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[58, 38]} />
        <meshStandardMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[8, 8.2, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Goals */}
      {[-15, 15].map((z) => (
        <group key={`goal-${z}`} position={[0, 0, z]}>
          <mesh position={[-3.5, 1.5, 0]}>
            <boxGeometry args={[0.2, 3, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[3.5, 1.5, 0]}>
            <boxGeometry args={[0.2, 3, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[7, 0.2, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Stadium stands (gradins) */}
      {[
        { x: 0, z: -25, rot: 0, w: 70 },
        { x: 0, z: 25, rot: Math.PI, w: 70 },
        { x: -35, z: 0, rot: Math.PI / 2, w: 60 },
        { x: 35, z: 0, rot: -Math.PI / 2, w: 60 },
      ].map((stand) => (
        <group key={`stadium-stand-${stand.x}-${stand.z}`} position={[stand.x, 0, stand.z]} rotation={[0, stand.rot, 0]}>
          {/* Seating rows (gradins visibles) */}
          {[0, 1, 2, 3, 4].map((row) => (
            <mesh key={`${stand.x}-${stand.z}-row-${row}`} position={[0, 1 + row * 1.5, -2 - row * 1.2]}>
              <boxGeometry args={[stand.w - 2, 1, 3]} />
              <meshStandardMaterial color={row % 2 === 0 ? "#1e3a8a" : "#3b82f6"} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ecrans aux 4 cotes - visibles seulement quand assis du cote oppose */}
      {/* Ecran Nord (visible depuis tribune Sud) */}
      {stadiumSeat?.side === "south" && (
        <group position={[0, 8, -22]} rotation={[0, 0, 0]}>
          <mesh>
            <boxGeometry args={[20, 12, 0.5]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {stadium?.embed_url && (
            <HLSVideoScreen
              src={stadium.embed_url}
              width={19}
              height={11}
              position={[0, 0, 0.3]}
              autoplay={true}
              muted={isStadiumMuted}
            />
          )}
        </group>
      )}
      {/* Ecran Sud (visible depuis tribune Nord) */}
      {stadiumSeat?.side === "north" && (
        <group position={[0, 8, 22]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[20, 12, 0.5]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {stadium?.embed_url && (
            <HLSVideoScreen
              src={stadium.embed_url}
              width={19}
              height={11}
              position={[0, 0, 0.3]}
              autoplay={true}
              muted={isStadiumMuted}
            />
          )}
        </group>
      )}
      {/* Ecran Ouest (visible depuis tribune Est) */}
      {stadiumSeat?.side === "east" && (
        <group position={[-32, 8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[20, 12, 0.5]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {stadium?.embed_url && (
            <HLSVideoScreen
              src={stadium.embed_url}
              width={19}
              height={11}
              position={[0, 0, 0.3]}
              autoplay={true}
              muted={isStadiumMuted}
            />
          )}
        </group>
      )}
      {/* Ecran Est (visible depuis tribune Ouest) */}
      {stadiumSeat?.side === "west" && (
        <group position={[32, 8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[20, 12, 0.5]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {stadium?.embed_url && (
            <HLSVideoScreen
              src={stadium.embed_url}
              width={19}
              height={11}
              position={[0, 0, 0.3]}
              autoplay={true}
              muted={isStadiumMuted}
            />
          )}
        </group>
      )}

      {/* Stadium lights */}
      {[
        [-25, 20, -15],
        [25, 20, -15],
        [-25, 20, 15],
        [25, 20, 15],
      ].map((pos) => (
        <group key={`stadium-light-${pos[0]}-${pos[2]}`} position={pos as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 4]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <spotLight
            position={[0, 0, 0]}
            angle={0.6}
            penumbra={0.5}
            intensity={2}
            castShadow
          />
        </group>
      ))}
    </>
  )
}
