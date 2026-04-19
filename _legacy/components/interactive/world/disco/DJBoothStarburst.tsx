"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { discoAnalyser, discoFrequencyData } from "../audio"

interface DJBoothStarburstProps {
  position: [number, number, number]
  width: number
  height: number
  lowQuality?: boolean
  muted?: boolean
}

// DJBoothStarburst - LED panel with animated micro-LEDs that pulse to music (optimized)
export function DJBoothStarburst({
  position,
  width,
  height,
  lowQuality = false,
  muted = false,
}: DJBoothStarburstProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ledsRef = useRef<THREE.Mesh[]>([])
  const currentIntensity = useRef({ low: 0.5, mid: 0.5, high: 0.5 })
  const frameSkip = useRef(0)

  const halfW = width / 2
  const halfH = height / 2
  const cols = lowQuality ? 10 : 30
  const rows = lowQuality ? 3 : 6

  useFrame((state) => {
    // Skip frames for performance (more in low quality)
    frameSkip.current++
    const skipRate = lowQuality ? 4 : 2
    if (frameSkip.current % skipRate !== 0) return

    const time = state.clock.elapsedTime

    // Get frequency bands - use fallback animation when muted
    let low = 0.5,
      mid = 0.5,
      high = 0.5
    if (discoAnalyser && discoFrequencyData && !muted) {
      discoAnalyser.getByteFrequencyData(discoFrequencyData)
      const binCount = discoFrequencyData.length

      // Low frequencies (bass)
      let lowSum = 0
      for (let i = 0; i < Math.floor(binCount * 0.15); i++) {
        lowSum += discoFrequencyData[i]
      }
      low = lowSum / (Math.floor(binCount * 0.15) * 255)

      // Mid frequencies
      let midSum = 0
      for (let i = Math.floor(binCount * 0.15); i < Math.floor(binCount * 0.5); i++) {
        midSum += discoFrequencyData[i]
      }
      mid = midSum / (Math.floor(binCount * 0.35) * 255)

      // High frequencies
      let highSum = 0
      for (let i = Math.floor(binCount * 0.5); i < Math.floor(binCount * 0.8); i++) {
        highSum += discoFrequencyData[i]
      }
      high = highSum / (Math.floor(binCount * 0.3) * 255)
    } else {
      // Fallback animation when muted or audio not available
      low = 0.5 + Math.sin(time * 2) * 0.4
      mid = 0.5 + Math.sin(time * 3 + 1) * 0.35
      high = 0.5 + Math.sin(time * 5 + 2) * 0.3
    }

    // Smooth the values
    currentIntensity.current.low += (low - currentIntensity.current.low) * 0.4
    currentIntensity.current.mid += (mid - currentIntensity.current.mid) * 0.35
    currentIntensity.current.high += (high - currentIntensity.current.high) * 0.3

    const smoothLow = currentIntensity.current.low
    const smoothMid = currentIntensity.current.mid
    const smoothHigh = currentIntensity.current.high

    // Animate each LED
    ledsRef.current.forEach((led, index) => {
      if (led) {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = (col - (cols - 1) / 2) * (width / cols)
        const y = (row - (rows - 1) / 2) * (height / rows)

        // Distance from center
        const distFromCenter = Math.sqrt(x * x + y * y)
        const maxDist = Math.sqrt(halfW * halfW + halfH * halfH)
        const normalizedDist = distFromCenter / maxDist

        // Radial wave from center
        const wave = Math.sin(time * 8 - distFromCenter * 3 + smoothLow * 5) * 0.5 + 0.5

        // Starburst angle effect
        const angle = Math.atan2(y, x)
        const rayEffect = Math.pow(Math.abs(Math.sin(angle * 12 + time * 2)), 2)

        // Combine effects
        const centerGlow = Math.max(0, 1 - normalizedDist * 1.5) * (0.5 + smoothLow * 0.8)
        const pulseEffect = wave * smoothMid * (1 - normalizedDist * 0.5)
        const starburstEffect = rayEffect * smoothHigh * (1 - normalizedDist * 0.3)

        const brightness = Math.min(1, centerGlow + pulseEffect * 0.6 + starburstEffect * 0.4)

        // Color based on position and audio
        const mat = led.material as THREE.MeshBasicMaterial
        const hue = 0.8 + normalizedDist * 0.1 + smoothMid * 0.05 // Purple to pink
        const saturation = 0.8 + smoothLow * 0.2
        const lightness = 0.2 + brightness * 0.5
        mat.color.setHSL(hue, saturation, lightness)
        mat.opacity = 0.3 + brightness * 0.7
      }
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Dark background panel */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#050208" />
      </mesh>

      {/* Animated micro LED grid */}
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const index = row * cols + col
          const x = (col - (cols - 1) / 2) * (width / cols)
          const y = (row - (rows - 1) / 2) * (height / rows)
          return (
            <mesh
              key={`led-${row}-${col}`}
              ref={(el) => {
                if (el) ledsRef.current[index] = el
              }}
              position={[x, y, 0.001]}
            >
              <planeGeometry args={[width / (cols + 5), height / (rows + 2)]} />
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} />
            </mesh>
          )
        })
      ).flat()}
    </group>
  )
}
