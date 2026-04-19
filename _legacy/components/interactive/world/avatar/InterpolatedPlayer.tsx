"use client"

import type * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import { Crown, Shield, Star } from "lucide-react"
import { RealisticAvatar } from "./RealisticAvatar"
import type { AvatarStyle, WorldSettings, ChatBubble } from "../types"

interface InterpolatedPlayerProps {
  player: any
  avatarStyle: AvatarStyle
  playerAction: any
  worldSettings: WorldSettings
  playerChatBubbles: Record<string, ChatBubble>
}

// InterpolatedPlayer - Gère l'interpolation fluide des positions des autres joueurs
export function InterpolatedPlayer({
  player,
  avatarStyle,
  playerAction,
  worldSettings,
  playerChatBubbles,
}: InterpolatedPlayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const avatarGroupRef = useRef<THREE.Group>(null)

  // Position et rotation interpolées
  const currentPos = useRef({
    x: player.position_x || 0,
    y: player.position_y || 0,
    z: player.position_z || 0,
  })
  const currentRotation = useRef(player.rotation || 0)

  // Position cible (dernière reçue de la DB)
  const targetPos = useRef({
    x: player.position_x || 0,
    y: player.position_y || 0,
    z: player.position_z || 0,
  })
  const targetRotation = useRef(player.rotation || 0)

  // Détecter si le joueur bouge pour l'animation
  const [isMoving, setIsMoving] = useState(false)

  // État pour l'animation de saut
  const [isJumping, setIsJumping] = useState(false)
  const jumpOffset = useRef(0)
  const lastJumpTimestamp = useRef(0)

  // Lire l'état de danse directement depuis les données du joueur (BDD via realtime)
  const isDancing = player.is_dancing === true

  // Détecter quand le joueur saute (via broadcast)
  useEffect(() => {
    if (playerAction?.action === "jump" && playerAction.timestamp !== lastJumpTimestamp.current) {
      lastJumpTimestamp.current = playerAction.timestamp
      setIsJumping(true)
      setTimeout(() => setIsJumping(false), 500)
    }
  }, [playerAction])

  // Mettre à jour la position cible quand les données DB changent
  useEffect(() => {
    const newX = player.position_x || 0
    const newY = player.position_y || 0
    const newZ = player.position_z || 0

    // Calculer la distance entre la position actuelle et la nouvelle
    const distance = Math.sqrt(
      Math.pow(newX - currentPos.current.x, 2) +
        Math.pow(newY - currentPos.current.y, 2) +
        Math.pow(newZ - currentPos.current.z, 2),
    )

    // Si la distance est grande (téléportation: s'asseoir/se lever), appliquer directement sans interpolation
    const TELEPORT_THRESHOLD = 3 // Plus de 3 unités = téléportation
    if (distance > TELEPORT_THRESHOLD) {
      // Téléportation instantanée
      currentPos.current = { x: newX, y: newY, z: newZ }
      currentRotation.current = player.rotation || 0
      // Mettre à jour immédiatement le groupe si disponible
      if (groupRef.current) {
        groupRef.current.position.set(newX, newY, newZ)
      }
      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = player.rotation || 0
      }
    }

    // Mettre à jour la cible (sera interpolée si distance < seuil)
    targetPos.current = { x: newX, y: newY, z: newZ }
    targetRotation.current = player.rotation || 0
  }, [player.position_x, player.position_y, player.position_z, player.rotation])

  // Interpolation à chaque frame
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Facteur d'interpolation (0.08 = lent et fluide, 0.15 = plus rapide)
    const lerpFactor = 0.1

    // Interpoler la position
    currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerpFactor
    currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerpFactor
    currentPos.current.z += (targetPos.current.z - currentPos.current.z) * lerpFactor

    // Interpoler la rotation (gérer le wraparound autour de PI)
    let rotationDiff = targetRotation.current - currentRotation.current
    // Normaliser la différence de rotation pour prendre le chemin le plus court
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2
    currentRotation.current += rotationDiff * lerpFactor

    // Animation de saut
    if (isJumping) {
      // Animation sinusoïdale pour le saut (monte puis redescend)
      jumpOffset.current += delta * 8 // Vitesse de l'animation
      // Bloquer à PI pour éviter de reboucler l'animation
      if (jumpOffset.current > Math.PI) {
        jumpOffset.current = Math.PI
      }
    } else {
      jumpOffset.current = 0
    }
    const jumpHeight = isJumping ? Math.sin(jumpOffset.current) * 0.8 : 0

    // Appliquer la position interpolée au groupe + offset de saut
    groupRef.current.position.set(currentPos.current.x, currentPos.current.y + jumpHeight, currentPos.current.z)

    // Appliquer la rotation interpolée au groupe avatar
    if (avatarGroupRef.current) {
      avatarGroupRef.current.rotation.y = currentRotation.current
    }

    // Détecter si le joueur est en mouvement (pour l'animation)
    const distanceToTarget = Math.sqrt(
      Math.pow(targetPos.current.x - currentPos.current.x, 2) + Math.pow(targetPos.current.z - currentPos.current.z, 2),
    )
    const newIsMoving = distanceToTarget > 0.05
    if (newIsMoving !== isMoving) {
      setIsMoving(newIsMoving)
    }
  })

  const playerProfile = player.user_profiles

  return (
    <group ref={groupRef}>
      <group ref={avatarGroupRef}>
        <RealisticAvatar position={[0, 0, 0]} avatarStyle={avatarStyle} isMoving={isMoving} isDancing={isDancing} />
      </group>

      <Html position={[0, 2.6, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
        <div className="flex flex-col items-center gap-1 pointer-events-none">
          <div className="flex items-center gap-1 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
            <span className="text-white text-xs font-medium whitespace-nowrap">
              {player.username || playerProfile?.username || "Joueur"}
            </span>
            {player.level && (
              <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                Lvl {player.level}
              </span>
            )}
            {worldSettings.showStatusBadges && (
              <>
                {playerProfile?.is_admin && <Shield className="w-3 h-3 text-red-500" />}
                {playerProfile?.is_vip_plus && !playerProfile?.is_admin && (
                  <Crown className="w-3 h-3 text-purple-400" />
                )}
                {playerProfile?.is_vip && !playerProfile?.is_vip_plus && !playerProfile?.is_admin && (
                  <Star className="w-3 h-3 text-yellow-400" />
                )}
              </>
            )}
          </div>
          {playerChatBubbles[player.user_id] && Date.now() - playerChatBubbles[player.user_id].timestamp < 5000 && (
            <div className="bg-white text-black text-xs px-3 py-1 rounded-lg max-w-[200px] break-words shadow-lg">
              {playerChatBubbles[player.user_id].message}
            </div>
          )}
          {playerAction && playerAction.action === "emoji" && (
            <div className="text-4xl animate-bounce">{playerAction.emoji}</div>
          )}
        </div>
      </Html>
    </group>
  )
}
