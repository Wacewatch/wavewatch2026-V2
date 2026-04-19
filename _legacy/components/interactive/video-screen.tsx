'use client'

import { useVideoTexture } from '@react-three/drei'
import { useEffect, useRef } from 'react'

interface VideoScreenProps {
  src: string
  width?: number
  height?: number
  muted?: boolean
  loop?: boolean
}

export function VideoScreen({
  src,
  width = 2,
  height = 1.5,
  muted = true,
  loop = true
}: VideoScreenProps) {
  const texture = useVideoTexture(src, {
    muted,
    loop,
    start: true,
    crossOrigin: 'anonymous',
  })

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
