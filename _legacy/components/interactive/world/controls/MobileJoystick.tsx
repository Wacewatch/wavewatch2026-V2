"use client"

import { useState, useRef, useEffect } from "react"

interface MobileJoystickProps {
  onMove: (dx: number, dz: number) => void
}

export function MobileJoystick({ onMove }: MobileJoystickProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const touchIdRef = useRef<number | null>(null) // Track specific touch

  useEffect(() => {
    if (isDragging) {
      // Utiliser setInterval à 50ms comme le clavier pour avoir la même cadence
      const update = () => {
        const maxDistance = 60
        onMove(position.x / maxDistance, position.y / maxDistance)
      }
      update() // Premier appel immédiat
      intervalRef.current = setInterval(update, 50) // Même intervalle que le clavier
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      onMove(0, 0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isDragging, position.x, position.y, onMove])

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
      className="fixed bottom-24 left-8 w-36 h-36 bg-white/20 backdrop-blur-lg rounded-full z-20 border-4 border-white/30 select-none touch-none"
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
      <div
        className="absolute w-14 h-14 bg-white/60 rounded-full top-1/2 left-1/2 shadow-lg transition-transform pointer-events-none"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      />
    </div>
  )
}
