"use client"

import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect } from "react"
import {
  discoAudioContext,
  discoAnalyser,
  discoAudioElement,
  discoFrequencyData,
  discoSourceConnected,
  discoAudioInitializedGlobal,
  setDiscoAudioContext,
  setDiscoAnalyser,
  setDiscoAudioElement,
  setDiscoFrequencyData,
  setDiscoSourceConnected,
  setDiscoAudioInitializedGlobal,
  globalDiscoStreamUrls,
  globalDiscoVolume,
} from "../audio"

interface DiscoVisualizerProps {
  position: [number, number, number]
  width: number
  height: number
  muted?: boolean
  shouldInitAudio?: boolean
  lowQuality?: boolean
}

// DiscoVisualizer - Real-time audio reactive equalizer with YouTube audio
export function DiscoVisualizer({
  position,
  width,
  height,
  muted,
  shouldInitAudio = true,
  lowQuality = false,
}: DiscoVisualizerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const barsRef = useRef<THREE.Mesh[]>([])
  const currentHeights = useRef<number[]>([])
  const [trackInfo, setTrackInfo] = useState<string>("")

  // Number of columns for the equalizer - reduced for performance
  const cols = lowQuality ? 8 : 16
  const barWidth = width / cols - 0.1
  const maxBarHeight = height * 0.95

  // Initialize audio context and analyser with YouTube stream (only for main visualizer)
  useEffect(() => {
    if (!shouldInitAudio || discoAudioInitializedGlobal) return

    const initAudioFunc = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        setDiscoAudioContext(audioContext)

        // Create analyser with more frequency bins for better visualization
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256 // 128 frequency bins
        analyser.smoothingTimeConstant = 0.3
        analyser.minDecibels = -90
        analyser.maxDecibels = -10
        setDiscoAnalyser(analyser)

        // Create audio element with streaming radio (NoCopyrightSounds style music)
        // Using public radio streams that allow CORS
        const audioElement = new Audio()
        audioElement.crossOrigin = "anonymous"
        setDiscoAudioElement(audioElement)

        // Use global stream URLs (loaded from database)
        const radioStreams =
          globalDiscoStreamUrls.length > 0
            ? globalDiscoStreamUrls
            : [
                "https://stream.nightride.fm/nightride.m4a",
                "https://stream.nightride.fm/chillsynth.m4a",
              ]

        let streamIndex = 0

        const tryNextStream = () => {
          if (streamIndex < radioStreams.length && discoAudioElement) {
            discoAudioElement.src = radioStreams[streamIndex]
            streamIndex++
            discoAudioElement.play().catch(() => {
              console.log("Stream failed, trying next...")
              tryNextStream()
            })
          }
        }

        // Handle errors - try next stream
        audioElement.onerror = () => {
          console.log("Disco audio error, trying next stream...")
          tryNextStream()
        }

        // Connect audio to analyser (only once)
        if (!discoSourceConnected) {
          const source = audioContext.createMediaElementSource(audioElement)
          source.connect(analyser)
          analyser.connect(audioContext.destination)
          setDiscoSourceConnected(true)
        }

        // Initialize frequency data array
        setDiscoFrequencyData(new Uint8Array(analyser.frequencyBinCount))

        // Start playing - use global volume from database
        audioElement.volume = muted ? 0 : globalDiscoVolume / 100

        // Try to play first stream
        audioElement.src = radioStreams[streamIndex]
        streamIndex++

        // Try to play (may need user interaction)
        try {
          await audioElement.play()
          setTrackInfo("Playing Electronic Music")
        } catch (playError) {
          console.log("Autoplay blocked, waiting for user interaction")
          // Add click listener to start audio
          const startAudio = () => {
            if (discoAudioElement && discoAudioContext) {
              discoAudioContext.resume()
              discoAudioElement.play().catch(() => tryNextStream())
              document.removeEventListener("click", startAudio)
            }
          }
          document.addEventListener("click", startAudio)
        }

        setDiscoAudioInitializedGlobal(true)
      } catch (err) {
        console.error("Failed to initialize disco audio:", err)
      }
    }

    // Initialize after a short delay
    const timeout = setTimeout(initAudioFunc, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // Update volume when muted changes - audio keeps playing so analyser still works
  useEffect(() => {
    if (discoAudioElement) {
      discoAudioElement.volume = muted ? 0 : 0.7
    }
  }, [muted])

  // Store muted state in global so other components can access it
  useEffect(() => {
    ;(window as typeof window & { discoMuted?: boolean }).discoMuted = muted
  }, [muted])

  // Initialize heights
  useEffect(() => {
    currentHeights.current = Array(cols).fill(0.1)
  }, [cols])

  // Animate the bars based on real audio frequency data
  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Get frequency data if available and not muted
    let frequencies: number[] = []
    if (discoAnalyser && discoFrequencyData && !muted) {
      discoAnalyser.getByteFrequencyData(discoFrequencyData)
      // Only use the first 50% of frequency bins (where music actually has energy)
      // and spread them across all bars - this ensures all bars are active
      const binCount = discoFrequencyData.length
      const usableBins = Math.floor(binCount * 0.5) // Only use low-mid frequencies
      for (let i = 0; i < cols; i++) {
        // Linear mapping across usable frequency range
        const binIndex = Math.floor((i / cols) * usableBins)
        // Average a few bins for smoother visualization
        let sum = 0
        const range = Math.max(1, Math.floor(usableBins / cols / 2))
        for (
          let j = Math.max(0, binIndex - range);
          j <= Math.min(usableBins - 1, binIndex + range);
          j++
        ) {
          sum += discoFrequencyData[j]
        }
        frequencies[i] = sum / (range * 2 + 1) / 255
      }
    } else {
      // Fallback animation when muted or audio not available - more energetic
      for (let i = 0; i < cols; i++) {
        const wave1 = Math.sin(time * 6 + i * 0.2) * 0.5 + 0.5
        const wave2 = Math.sin(time * 10 + i * 0.4) * 0.3 + 0.5
        const wave3 = Math.sin(time * 3 + i * 0.1) * 0.4 + 0.5
        const beat = Math.sin(time * 8) > 0.8 ? 0.3 : 0
        frequencies[i] = Math.min(1, (wave1 + wave2 + wave3) / 3 + beat)
      }
    }

    barsRef.current.forEach((bar, i) => {
      if (bar) {
        const targetHeight = Math.max(0.05, frequencies[i] || 0.05)

        // Smooth interpolation - fast attack, slower decay
        const attackSpeed = 0.6
        const decaySpeed = 0.12
        const diff = targetHeight - currentHeights.current[i]
        const speed = diff > 0 ? attackSpeed : decaySpeed
        currentHeights.current[i] += diff * speed

        const normalizedHeight = Math.max(0.05, currentHeights.current[i])
        const actualHeight = normalizedHeight * maxBarHeight

        bar.scale.y = normalizedHeight
        bar.position.y = (actualHeight - maxBarHeight) / 2

        // Dynamic color based on height - vibrant neon colors
        const mat = bar.material as THREE.MeshBasicMaterial
        const hue = (0.85 - normalizedHeight * 0.5 + i * 0.02) % 1
        const saturation = 1
        const lightness = 0.35 + normalizedHeight * 0.4
        mat.color.setHSL(hue, saturation, lightness)
      }
    })
  })

  // Cleanup on unmount (only for main visualizer that initialized audio)
  useEffect(() => {
    if (!shouldInitAudio) return

    return () => {
      if (discoAudioElement) {
        discoAudioElement.pause()
        discoAudioElement.src = ""
      }
      if (discoAudioContext && discoAudioContext.state !== "closed") {
        discoAudioContext.close()
      }
      setDiscoAudioElement(null)
      setDiscoAudioContext(null)
      setDiscoAnalyser(null)
      setDiscoFrequencyData(null)
      setDiscoSourceConnected(false)
      setDiscoAudioInitializedGlobal(false)
    }
  }, [shouldInitAudio])

  return (
    <group ref={groupRef} position={position}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#2d2d44" />
      </mesh>

      {/* Animated equalizer bars - flat planeGeometry for real screen look */}
      {Array(cols)
        .fill(0)
        .map((_, i) => {
          const x = (i - cols / 2 + 0.5) * (width / cols)
          return (
            <mesh
              key={`disco-bar-${i}`}
              ref={(el) => {
                if (el) barsRef.current[i] = el
              }}
              position={[x, 0, 0.001]}
            >
              <planeGeometry args={[barWidth, maxBarHeight]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
          )
        })}

      {/* Grid overlay - flat lines (reduced based on quality) */}
      {/* Vertical lines */}
      {!lowQuality &&
        Array.from({ length: cols - 1 }, (_, i) => {
          const x = -width / 2 + (width / cols) * (i + 1)
          return (
            <mesh key={`disco-vbar-${i}`} position={[x, 0, 0.002]}>
              <planeGeometry args={[0.04, height]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          )
        })}
      {/* Horizontal lines */}
      {!lowQuality &&
        Array.from({ length: lowQuality ? 3 : 7 }, (_, i) => {
          const rows = lowQuality ? 4 : 8
          const y = -height / 2 + (height / rows) * (i + 1)
          return (
            <mesh key={`disco-hbar-${i}`} position={[0, y, 0.002]}>
              <planeGeometry args={[width, 0.04]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          )
        })}
    </group>
  )
}
