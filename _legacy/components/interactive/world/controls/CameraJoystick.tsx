"use client"

import { useState, useRef, useEffect } from "react"

interface CameraJoystickProps {
  onRotate: (deltaYaw: number, deltaPitch: number) => void
}

// Joystick pour la rotation de la caméra (côté droit)
export function CameraJoystick({ onRotate }: CameraJoystickProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const touchIdRef = useRef<number | null>(null) // Track specific touch

  useEffect(() => {
    if (isDragging) {
      const update = () => {
        const maxDistance = 60
        const sensitivity = 0.012 // Sensibilité de rotation (réduite pour une rotation plus lente)
        onRotate(
          (position.x / maxDistance) * sensitivity,
          -(position.y / maxDistance) * sensitivity // Inverser Y pour que haut = regarder en haut
        )
      }
      update()
      intervalRef.current = setInterval(update, 16) // ~60fps pour une rotation fluide
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isDragging, position.x, position.y, onRotate])

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let dx = clientX - centerX
    let dy = clientY - centerY

    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 60

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance
      dy = (dy / distance) * maxDistance
    }

    setPosition({ x: dx, y: dy })
  }

  const handleEnd = () => {
    touchIdRef.current = null
    setIsDragging(false)
    setPosition({ x: 0, y: 0 })
  }

  // Find the touch with matching ID from TouchList
  const findTouch = (touches: TouchList, id: number): Touch | null => {
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === id) return touches[i]
    }
    return null
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-8 w-36 h-36 bg-blue-500/20 backdrop-blur-lg rounded-full z-20 border-4 border-blue-400/30 select-none touch-none"
      onTouchStart={(e) => {
        e.stopPropagation()
        if (touchIdRef.current === null) {
          const touch = e.changedTouches[0]
          touchIdRef.current = touch.identifier
          setIsDragging(true)
          handleMove(touch.clientX, touch.clientY)
        }
      }}
      onTouchMove={(e) => {
        e.stopPropagation()
        if (touchIdRef.current !== null) {
          const touch = findTouch(e.touches, touchIdRef.current)
          if (touch) handleMove(touch.clientX, touch.clientY)
        }
      }}
      onTouchEnd={(e) => {
        e.stopPropagation()
        if (touchIdRef.current !== null) {
          const touch = findTouch(e.changedTouches, touchIdRef.current)
          if (touch) handleEnd()
        }
      }}
      onTouchCancel={handleEnd}
      onMouseDown={(e) => {
        setIsDragging(true)
        handleMove(e.clientX, e.clientY)
      }}
      onMouseMove={(e) => isDragging && handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Icône de caméra au centre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300/50 text-2xl pointer-events-none">
        👁️
      </div>
      <div
        className="absolute w-14 h-14 bg-blue-400/60 rounded-full top-1/2 left-1/2 shadow-lg transition-transform pointer-events-none"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      />
    </div>
  )
}
