"use client"

import { DiscoWalls, DiscoVisualizer, DJBoothStarburst } from "../disco"

interface DiscoInteriorProps {
  isDiscoMuted: boolean
  graphicsQuality: string
}

export function DiscoInterior({ isDiscoMuted, graphicsQuality }: DiscoInteriorProps) {
  return (
    <>
      {/* Disco Interior */}
      {/* Floor with reflective surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 35]} />
        <meshStandardMaterial color="#1a0a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Walls and Ceiling with dynamic transparency */}
      <DiscoWalls />

      {/* Disco ball in center */}
      <group position={[0, 8, 0]}>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial
            color="#e0e0e0"
            emissive="#ffffff"
            emissiveIntensity={0.3}
            metalness={1}
            roughness={0}
          />
        </mesh>
        <pointLight intensity={5} distance={20} color="#ffffff" />
      </group>

      {/* Neon strip lights on ceiling */}
      {[-12, -4, 4, 12].map((x) => (
        <group key={`disco-neon-${x}`} position={[x, 9.5, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.2, 30]} />
            <meshStandardMaterial
              color={x < 0 ? "#ff00ff" : "#00ffff"}
              emissive={x < 0 ? "#ff00ff" : "#00ffff"}
              emissiveIntensity={2}
            />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={2} distance={12} color={x < 0 ? "#ff00ff" : "#00ffff"} />
        </group>
      ))}

      {/* Modern LED Video Wall - YouTube video integrated in 3D scene */}
      <group position={[0, 5.5, -17]}>
        {/* Main LED screen frame - sleek black border */}
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[18, 7, 0.3]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Animated LED visualizer screen - reacts to real audio */}
        <DiscoVisualizer position={[0, 0, 0.05]} width={17} height={6.2} muted={isDiscoMuted} lowQuality={graphicsQuality === "low"} />

        {/* Ambient screen glow */}
        <pointLight position={[0, 0, 4]} intensity={2} distance={12} color="#ff00ff" />
        <pointLight position={[-6, 0, 4]} intensity={1.5} distance={8} color="#00ffff" />
        <pointLight position={[6, 0, 4]} intensity={1.5} distance={8} color="#ff0066" />
      </group>

      {/* Side LED panels - Left hexagonal pattern */}
      <group position={[-16, 5, -14]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={`hex-left-${i}`} position={[0, (i - 2) * 1.8, 0]} rotation={[0, 0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.8, 0.8, 0.15, 6]} rotation={[Math.PI / 2, 0, 0]} />
              <meshBasicMaterial color={["#ff00ff", "#00ffff", "#ff0066", "#00ff88", "#ffaa00"][i]} />
            </mesh>
            <pointLight intensity={0.8} distance={4} color={["#ff00ff", "#00ffff", "#ff0066", "#00ff88", "#ffaa00"][i]} />
          </group>
        ))}
      </group>

      {/* Side LED panels - Right hexagonal pattern */}
      <group position={[16, 5, -14]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={`hex-right-${i}`} position={[0, (i - 2) * 1.8, 0]} rotation={[0, -0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.8, 0.8, 0.15, 6]} rotation={[Math.PI / 2, 0, 0]} />
              <meshBasicMaterial color={["#00ffff", "#ff00ff", "#00ff88", "#ff0066", "#ffaa00"][i]} />
            </mesh>
            <pointLight intensity={0.8} distance={4} color={["#00ffff", "#ff00ff", "#00ff88", "#ff0066", "#ffaa00"][i]} />
          </group>
        ))}
      </group>

      {/* Vertical LED bars on back wall */}
      {[-14, -10, 10, 14].map((x, idx) => (
        <group key={`led-bar-${x}`} position={[x, 5, -17.2]}>
          <mesh>
            <boxGeometry args={[0.3, 8, 0.1]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#ff00ff" : "#00ffff"} />
          </mesh>
          <pointLight intensity={1.5} distance={6} color={idx % 2 === 0 ? "#ff00ff" : "#00ffff"} />
        </group>
      ))}

      {/* Floor LED strips around dance floor */}
      {[-10, 10].map((x) => (
        <mesh key={`floor-strip-${x}`} position={[x, 0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 16]} />
          <meshBasicMaterial color={x < 0 ? "#ff00ff" : "#00ffff"} />
        </mesh>
      ))}

      {/* DJ booth at center front */}
      <group position={[0, 0, -12]}>
        {/* DJ table - white/light color like reference */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[8, 1.2, 2]} />
          <meshStandardMaterial color="#e8e8f0" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* DJ equipment */}
        <mesh position={[-2, 1.8, 0]}>
          <boxGeometry args={[1.5, 0.3, 1.2]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[2, 1.8, 0]}>
          <boxGeometry args={[1.5, 0.3, 1.2]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Mixer in center */}
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[1.2, 0.4, 0.8]} />
          <meshStandardMaterial color="#333333" emissive="#ff00ff" emissiveIntensity={0.3} />
        </mesh>

        {/* LED panel with starburst effect on DJ booth front */}
        <DJBoothStarburst position={[0, 0.8, 1.15]} width={7.5} height={1.2} lowQuality={graphicsQuality === "low"} muted={isDiscoMuted} />

        {/* Lisere fluo en bas du DJ booth */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[8.1, 0.1, 2.1]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
        </mesh>
        {/* Lisere fluo sur le dessus du DJ booth */}
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[8.1, 0.08, 2.1]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Dance floor with colored tiles */}
      {[-8, -4, 0, 4, 8].map((x) => (
        [-2, 2, 6, 10].map((z) => (
          <mesh
            key={`dance-tile-${x}-${z}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.02, z]}
          >
            <planeGeometry args={[3.5, 3.5]} />
            <meshStandardMaterial
              color={(x + z) % 2 === 0 ? "#ff00ff" : "#00ffff"}
              emissive={(x + z) % 2 === 0 ? "#ff00ff" : "#00ffff"}
              emissiveIntensity={0.3}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        ))
      ))}

      {/* Side speakers */}
      {[-18, 18].map((x) => (
        <group key={`speaker-${x}`} position={[x, 0, -10]}>
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[2, 4, 2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 2, 1.1]}>
            <cylinderGeometry args={[0.6, 0.6, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0, 3, 1.1]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          {/* Lisere fluo autour de l'enceinte */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[2.1, 0.1, 2.1]} />
            <meshStandardMaterial color={x < 0 ? "#ff00ff" : "#00ffff"} emissive={x < 0 ? "#ff00ff" : "#00ffff"} emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[2.1, 0.1, 2.1]} />
            <meshStandardMaterial color={x < 0 ? "#ff00ff" : "#00ffff"} emissive={x < 0 ? "#ff00ff" : "#00ffff"} emissiveIntensity={2} />
          </mesh>
        </group>
      ))}

      {/* Bar area on the side */}
      <group position={[16, 0, 5]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[3, 1.2, 8]} />
          <meshStandardMaterial color="#3d1a5c" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Bar top */}
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[3.2, 0.15, 8.2]} />
          <meshStandardMaterial color="#1a0a2a" metalness={0.8} roughness={0.1} />
        </mesh>
        {/* Bar LED vertical */}
        <mesh position={[-1.6, 1, 0]}>
          <boxGeometry args={[0.1, 0.5, 7.5]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
        {/* Liseres fluo en bas du bar */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[3.2, 0.1, 8.2]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
        {/* Lisere fluo sur le dessus du bar */}
        <mesh position={[0, 2.0, 0]}>
          <boxGeometry args={[3.3, 0.08, 8.3]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Ambient colored lights */}
      <pointLight position={[-15, 8, 10]} intensity={3} distance={25} color="#ff00ff" />
      <pointLight position={[15, 8, 10]} intensity={3} distance={25} color="#00ffff" />
      <pointLight position={[0, 8, -10]} intensity={3} distance={25} color="#ff6600" />
    </>
  )
}
