"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { useRef } from "react"
import type { AvatarStyle } from "../types"

interface RealisticAvatarProps {
  position: [number, number, number]
  avatarStyle: AvatarStyle
  isMoving: boolean
  isJumping?: boolean
  isDancing?: boolean
}

// RealisticAvatar is only used inside Canvas
export function RealisticAvatar({
  position,
  avatarStyle,
  isMoving,
  isJumping = false,
  isDancing = false,
}: RealisticAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  const style = {
    bodyColor: avatarStyle?.bodyColor || "#3b82f6",
    headColor: avatarStyle?.headColor || "#fbbf24",
    skinTone: avatarStyle?.skinTone || avatarStyle?.headColor || "#fbbf24",
    hairStyle: avatarStyle?.hairStyle || "short",
    hairColor: avatarStyle?.hairColor || "#1f2937",
    accessory: avatarStyle?.accessory || "none",
    faceSmiley: avatarStyle?.faceSmiley || "😊",
  }

  useFrame((state, delta) => {
    if (isDancing) {
      // Animation de danse groove - mouvements fluides et naturels
      timeRef.current += delta * 4 // Vitesse plus lente pour un groove naturel

      const t = timeRef.current

      // Balancement latéral du corps (comme si on dansait d'un pied sur l'autre)
      if (groupRef.current) {
        // Léger mouvement de haut en bas sur le beat (subtil)
        groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.03
        // Balancement latéral
        groupRef.current.position.x = position[0] + Math.sin(t) * 0.05
        // Légère rotation du corps (twist)
        groupRef.current.rotation.y = Math.sin(t) * 0.1
      }

      // Jambes - transfert de poids d'une jambe à l'autre (pas de grands mouvements)
      if (leftLegRef.current) {
        // Jambe gauche plie légèrement quand on penche à gauche
        leftLegRef.current.rotation.x = Math.sin(t) * 0.15
      }
      if (rightLegRef.current) {
        // Jambe droite plie en opposition
        rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.15
      }

      // Bras - mouvements fluides et décontractés
      if (leftArmRef.current) {
        // Bras gauche balance naturellement
        leftArmRef.current.rotation.x = Math.sin(t * 0.8) * 0.3
        leftArmRef.current.rotation.z = Math.sin(t) * 0.2 + 0.15 // Légèrement écarté
      }
      if (rightArmRef.current) {
        // Bras droit en décalage pour un mouvement naturel
        rightArmRef.current.rotation.x = Math.sin(t * 0.8 + 1) * 0.3
        rightArmRef.current.rotation.z = Math.sin(t + Math.PI) * 0.2 - 0.15
      }
    } else if (isMoving) {
      timeRef.current += delta * 4 // Vitesse d'animation réduite (était 8)

      // Animate legs walking - amplitude réduite
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(timeRef.current) * 0.4
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(timeRef.current + Math.PI) * 0.4

      // Animate arms swinging (opposé aux jambes) - amplitude réduite
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(timeRef.current + Math.PI) * 0.25
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(timeRef.current) * 0.25

      // Reset arm Z rotation (au cas où on vient de danser)
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0
      if (rightArmRef.current) rightArmRef.current.rotation.z = 0
    } else {
      // Reset position when not moving
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0
        leftArmRef.current.rotation.z = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0
        rightArmRef.current.rotation.z = 0
      }
      // Reset position (Y, X et rotation Y pour la danse)
      if (groupRef.current) {
        groupRef.current.position.x = position[0]
        groupRef.current.position.y = position[1]
        groupRef.current.rotation.y = 0
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Torso - height divided by 2 */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Hair */}
      {style.hairStyle === "short" && (
        <mesh castShadow position={[0, 2.05, 0]}>
          <boxGeometry args={[0.42, 0.15, 0.42]} />
          <meshStandardMaterial color={style.hairColor} />
        </mesh>
      )}
      {style.hairStyle === "long" && (
        <>
          {/* Dessus de la tête */}
          <mesh castShadow position={[0, 2.05, 0]}>
            <boxGeometry args={[0.42, 0.15, 0.42]} />
            <meshStandardMaterial color={style.hairColor} />
          </mesh>
          {/* Cheveux qui descendent derrière (z négatif = arrière du personnage) */}
          <mesh castShadow position={[0, 1.7, -0.2]}>
            <boxGeometry args={[0.42, 0.5, 0.1]} />
            <meshStandardMaterial color={style.hairColor} />
          </mesh>
        </>
      )}

      {/* Left Arm */}
      <mesh ref={leftArmRef} castShadow position={[-0.35, 1.2, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} castShadow position={[0.35, 1.2, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} castShadow position={[-0.15, 0.65, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} castShadow position={[0.15, 0.65, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* Face Smiley - positioned on the front of the head (z positif = devant), hidden during jump or if "none" */}
      {!isJumping && style.faceSmiley && style.faceSmiley !== "none" && (
        <Html
          position={[0, 1.8, 0.35]}
          center
          distanceFactor={4}
          occlude
          zIndexRange={[0, 0]}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div className="text-5xl">{style.faceSmiley}</div>
        </Html>
      )}

      {/* ========== ACCESSOIRES ========== */}

      {/* Chapeau classique */}
      {style.accessory === "hat" && (
        <mesh castShadow position={[0, 2.25, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.15, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}

      {/* Lunettes classiques */}
      {style.accessory === "glasses" && (
        <group position={[0, 1.85, 0.22]}>
          {/* Monture */}
          <mesh>
            <boxGeometry args={[0.35, 0.08, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Verre gauche */}
          <mesh position={[-0.1, 0, 0.01]}>
            <boxGeometry args={[0.12, 0.06, 0.01]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
          </mesh>
          {/* Verre droit */}
          <mesh position={[0.1, 0, 0.01]}>
            <boxGeometry args={[0.12, 0.06, 0.01]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
          </mesh>
        </group>
      )}

      {/* Lunettes de soleil */}
      {style.accessory === "sunglasses" && (
        <group position={[0, 1.85, 0.22]}>
          {/* Monture */}
          <mesh>
            <boxGeometry args={[0.38, 0.1, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Verre gauche (teinté) */}
          <mesh position={[-0.1, 0, 0.01]}>
            <boxGeometry args={[0.14, 0.08, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
          </mesh>
          {/* Verre droit (teinté) */}
          <mesh position={[0.1, 0, 0.01]}>
            <boxGeometry args={[0.14, 0.08, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Casquette */}
      {style.accessory === "cap" && (
        <group position={[0, 2.1, 0]}>
          {/* Calotte */}
          <mesh castShadow>
            <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          {/* Visière */}
          <mesh castShadow position={[0, -0.02, 0.2]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.15]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* Casque Audio / Headphones */}
      {style.accessory === "headphones" && (
        <group position={[0, 1.95, 0]}>
          {/* Arceau */}
          <mesh castShadow position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.22, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          {/* Écouteur gauche */}
          <mesh castShadow position={[-0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Écouteur droit */}
          <mesh castShadow position={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Coussinets */}
          <mesh position={[-0.25, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
          <mesh position={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        </group>
      )}

      {/* Couronne Admin (dorée avec gemmes) */}
      {style.accessory === "admin_crown" && (
        <group position={[0, 2.2, 0]}>
          {/* Base de la couronne */}
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.12, 6]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Pointes */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh
              key={`crown-spike-${i}`}
              castShadow
              position={[
                Math.cos((i * Math.PI * 2) / 6) * 0.18,
                0.12,
                Math.sin((i * Math.PI * 2) / 6) * 0.18,
              ]}
            >
              <coneGeometry args={[0.04, 0.12, 4]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          {/* Gemme centrale */}
          <mesh position={[0, 0.15, 0.2]}>
            <octahedronGeometry args={[0.04]} />
            <meshStandardMaterial color="#ff0000" metalness={0.5} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Couronne VIP+ (argentée) */}
      {style.accessory === "vip_plus_crown" && (
        <group position={[0, 2.2, 0]}>
          {/* Base de la couronne */}
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.1, 5]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Pointes */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={`vip-crown-spike-${i}`}
              castShadow
              position={[
                Math.cos((i * Math.PI * 2) / 5) * 0.16,
                0.1,
                Math.sin((i * Math.PI * 2) / 5) * 0.16,
              ]}
            >
              <coneGeometry args={[0.03, 0.1, 4]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
          {/* Gemme violette */}
          <mesh position={[0, 0.12, 0.18]}>
            <octahedronGeometry args={[0.03]} />
            <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Aura Dorée Admin */}
      {style.accessory === "admin_aura" && (
        <group position={[0, 1.5, 0]}>
          {/* Cercle lumineux autour du personnage */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <torusGeometry args={[0.6, 0.02, 8, 32]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} transparent opacity={0.7} />
          </mesh>
          {/* Halo au-dessus de la tête */}
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.02, 8, 32]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Badge Staff */}
      {style.accessory === "staff_badge" && (
        <group position={[0.2, 1.35, 0.16]}>
          {/* Badge */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.02]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Étoile centrale */}
          <mesh position={[0, 0, 0.015]}>
            <circleGeometry args={[0.04, 5]} />
            <meshStandardMaterial color="#ffd700" />
          </mesh>
        </group>
      )}

      {/* Badge VIP */}
      {style.accessory === "vip_badge" && (
        <group position={[0.2, 1.35, 0.16]}>
          {/* Badge */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* V au centre */}
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[0.06, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      )}

      {/* Hologramme */}
      {style.accessory === "hologram" && (
        <group position={[0, 2.2, 0]}>
          {/* Cube holographique flottant - avec edges pour des lignes plus visibles */}
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
              wireframe
              wireframeLinewidth={2}
            />
          </mesh>
          {/* Anneau autour - plus épais et lumineux */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.02, 8, 32]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.2} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Visière Néon */}
      {style.accessory === "neon_visor" && (
        <group position={[0, 1.85, 0.22]}>
          {/* Visière principale */}
          <mesh>
            <boxGeometry args={[0.42, 0.1, 0.02]} />
            <meshStandardMaterial
              color="#ff00ff"
              emissive="#ff00ff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Bords lumineux */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.44, 0.01, 0.03]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.44, 0.01, 0.03]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </mesh>
        </group>
      )}
    </group>
  )
}
