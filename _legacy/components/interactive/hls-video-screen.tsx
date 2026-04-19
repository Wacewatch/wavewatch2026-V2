'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { VideoTexture, LinearFilter, SRGBColorSpace } from 'three'
import type Hls from 'hls.js'

interface HLSVideoScreenProps {
  src: string
  width?: number
  height?: number
  position?: [number, number, number]
  autoplay?: boolean
  muted?: boolean
  onReady?: () => void
  onError?: (error: string) => void
}

export function HLSVideoScreen({
  src,
  width = 13.5,
  height = 7.5,
  position = [0, 3, -20],
  autoplay = true,
  muted = true,
  onReady,
  onError
}: HLSVideoScreenProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const textureRef = useRef<VideoTexture | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Store cleanup function to ensure it has access to latest refs
  const cleanupRef = useRef<(() => void) | null>(null)

  // Comprehensive cleanup function
  const cleanup = useCallback(() => {
    // Stop and destroy HLS instance
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad()
        hlsRef.current.detachMedia()
        hlsRef.current.destroy()
      } catch (e) {
        // Ignore errors during cleanup
      }
      hlsRef.current = null
    }

    // Stop video completely and remove all tracks
    if (videoRef.current) {
      const video = videoRef.current
      try {
        // Pause playback
        video.pause()

        // Remove all source tracks to stop buffering
        video.removeAttribute('src')
        video.srcObject = null

        // Stop all media tracks if any
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach(track => track.stop())
        }

        // Set volume to 0 and mute as extra safety
        video.volume = 0
        video.muted = true

        // Clear the source completely
        video.src = ''
        video.load()

        // Remove from DOM if attached
        if (video.parentNode) {
          video.parentNode.removeChild(video)
        }

        // Remove all event listeners by cloning and replacing
        const clone = video.cloneNode(false) as HTMLVideoElement
        if (video.parentNode) {
          video.parentNode.replaceChild(clone, video)
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      videoRef.current = null
    }

    // Dispose Three.js texture
    if (textureRef.current) {
      try {
        textureRef.current.dispose()
      } catch (e) {
        // Ignore errors during cleanup
      }
      textureRef.current = null
    }

    // Clear material map
    if (materialRef.current) {
      materialRef.current.map = null
      materialRef.current.needsUpdate = true
    }
  }, [])

  // Store cleanup function in ref so it's always accessible
  useEffect(() => {
    cleanupRef.current = cleanup
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (!src || hasError) return

    let isActive = true
    const eventListeners: Array<{ target: HTMLVideoElement; event: string; handler: EventListener }> = []

    const initHLS = async () => {
      try {
        const HlsModule = await import('hls.js')
        const Hls = HlsModule.default

        if (!isActive) return

        // Create video element
        const video = document.createElement('video')
        video.crossOrigin = 'anonymous'
        video.playsInline = true
        video.muted = muted
        video.loop = true
        video.autoplay = false
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        videoRef.current = video

        // Create texture immediately, it will update when video starts
        const newTexture = new VideoTexture(video)
        newTexture.minFilter = LinearFilter
        newTexture.magFilter = LinearFilter
        newTexture.colorSpace = SRGBColorSpace
        newTexture.needsUpdate = true
        textureRef.current = newTexture

        // Apply texture to material immediately
        if (materialRef.current) {
          materialRef.current.map = newTexture
          materialRef.current.needsUpdate = true
        }

        // Track when video is truly ready
        let isVideoReady = false
        const markVideoReady = () => {
          if (isVideoReady || !isActive) return

          if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
            isVideoReady = true
            setIsReady(true)
            onReady?.()
          }
        }

        const addEventListener = (event: string, handler: EventListener) => {
          video.addEventListener(event, handler)
          eventListeners.push({ target: video, event, handler })
        }

        addEventListener('loadeddata', markVideoReady)
        addEventListener('canplay', markVideoReady)
        addEventListener('playing', markVideoReady)
        addEventListener('timeupdate', markVideoReady)

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })

          if (!isActive) {
            hls.destroy()
            return
          }

          hlsRef.current = hls

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal && isActive) {
              setHasError(true)
              onError?.(data.type)
            }
          })

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoplay && isActive) {
              video.play().catch(err => {
                if (isActive) {
                  video.muted = true
                  video.play().catch(e => console.error('[HLS] Play failed:', e))
                }
              })
            }
          })

          hls.loadSource(src)
          hls.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          video.src = src

          const loadedMetadataHandler = () => {
            if (autoplay && isActive) {
              video.play().catch(err => {
                if (isActive) {
                  video.muted = true
                  video.play()
                }
              })
            }
          }

          addEventListener('loadedmetadata', loadedMetadataHandler)
        } else {
          setHasError(true)
          onError?.('HLS not supported')
        }
      } catch (err) {
        if (isActive) {
          setHasError(true)
          onError?.('Failed to initialize HLS')
        }
      }
    }

    initHLS()

    // Cleanup when src changes or component unmounts
    return () => {
      isActive = false

      // Remove all event listeners
      eventListeners.forEach(({ target, event, handler }) => {
        try {
          target.removeEventListener(event, handler)
        } catch (e) {
          // Ignore errors
        }
      })

      // Call comprehensive cleanup
      cleanupRef.current?.()
    }
  }, [src, autoplay, muted, hasError, onReady, onError])

  // Update muted state when prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
    }
  }, [muted])

  // Update texture every frame when video is playing
  useFrame(() => {
    if (textureRef.current && videoRef.current) {
      const video = videoRef.current
      if (!video.paused && video.readyState >= video.HAVE_CURRENT_DATA) {
        textureRef.current.needsUpdate = true

        // Force material update on first frames
        if (materialRef.current && materialRef.current.map !== textureRef.current) {
          materialRef.current.map = textureRef.current
          materialRef.current.needsUpdate = true
        }
      }
    }
  })

  return (
    <group position={position}>
      {/* Screen background - uses meshBasicMaterial to ignore fog */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[width + 0.5, height + 0.5]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Video screen */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={materialRef}
          color={hasError ? "#660000" : "#ffffff"}
          toneMapped={false}
        />
      </mesh>

      {/* Loading state */}
      {!isReady && !hasError && (
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
      )}
    </group>
  )
}
