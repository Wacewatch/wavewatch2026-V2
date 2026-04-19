'use client'

import { useTexture } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'

interface ImageScreenProps {
  src: string
  width?: number
  height?: number
}

function ImageScreenContent({
  src,
  width = 2,
  height = 1.5,
}: ImageScreenProps) {
  const texture = useTexture(src)

  // Configure texture settings
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function ImageScreen(props: ImageScreenProps) {
  return (
    <Suspense
      fallback={
        <mesh>
          <planeGeometry args={[props.width || 2, props.height || 1.5]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      }
    >
      <ImageScreenContent {...props} />
    </Suspense>
  )
}
