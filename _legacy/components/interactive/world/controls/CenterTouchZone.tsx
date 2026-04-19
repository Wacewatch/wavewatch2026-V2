"use client"

import { useRef } from "react"

interface CenterTouchZoneProps {
  onRotate: (deltaYaw: number, deltaPitch: number) => void
}

// Zone centrale pour la rotation de la caméra (entre les deux joysticks)
export function CenterTouchZone({ onRotate }: CenterTouchZoneProps) {
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const touchIdRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (touchIdRef.current === null) {
      const touch = e.changedTouches[0]
      touchIdRef.current = touch.identifier
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (touchIdRef.current !== null && lastTouchRef.current) {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          const touch = e.touches[i]
          const deltaX = touch.clientX - lastTouchRef.current.x
          const deltaY = touch.clientY - lastTouchRef.current.y

          // Sensibilité pour la rotation
          const sensitivity = 0.004
          onRotate(deltaX * sensitivity, -deltaY * sensitivity)

          lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
          break
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (touchIdRef.current !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null
          lastTouchRef.current = null
          break
        }
      }
    }
  }

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-20rem)] h-36 z-10 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchIdRef.current = null
        lastTouchRef.current = null
      }}
    />
  )
}
