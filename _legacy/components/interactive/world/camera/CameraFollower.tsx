"use client"

import { useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import type { Position } from "../types"

interface CameraFollowerProps {
  characterPosition: Position
  orbitControlsRef: React.MutableRefObject<any>
}

// CameraFollower - fait suivre la caméra avec le personnage
export function CameraFollower({
  characterPosition,
  orbitControlsRef
}: CameraFollowerProps) {
  const { camera } = useThree()
  const lastPosition = useRef({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    if (!orbitControlsRef.current) return

    const controls = orbitControlsRef.current

    // Calculer le déplacement du personnage
    const deltaX = characterPosition.x - lastPosition.current.x
    const deltaY = characterPosition.y - lastPosition.current.y
    const deltaZ = characterPosition.z - lastPosition.current.z

    // Déplacer la caméra du même vecteur pour suivre le personnage
    if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
      camera.position.x += deltaX
      camera.position.y += deltaY
      camera.position.z += deltaZ

      // Mettre à jour la cible d'OrbitControls
      controls.target.set(
        characterPosition.x,
        characterPosition.y + 1,
        characterPosition.z
      )

      controls.update()
    }

    // Sauvegarder la position actuelle
    lastPosition.current = { ...characterPosition }
  })

  return null
}
