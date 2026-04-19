"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SpoilerTextProps {
  children: React.ReactNode
  className?: string
  alwaysShow?: boolean
}

export function SpoilerText({ children, className = "", alwaysShow = false }: SpoilerTextProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [hideSpoilers, setHideSpoilers] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreference = localStorage.getItem("wavewatch_hide_spoilers")
      setHideSpoilers(storedPreference === "true")
    }

    const handlePreferencesUpdate = (e: CustomEvent) => {
      if (e.detail?.hideSpoilers !== undefined) {
        setHideSpoilers(e.detail.hideSpoilers)
        setIsRevealed(false)
      }
    }

    window.addEventListener("preferences-updated", handlePreferencesUpdate as EventListener)

    return () => {
      window.removeEventListener("preferences-updated", handlePreferencesUpdate as EventListener)
    }
  }, [])

  if (alwaysShow || !hideSpoilers || isRevealed) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className}`}>
      <div className="filter blur-md select-none pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded">
        <Button
          onClick={() => setIsRevealed(true)}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          <Eye className="w-4 h-4 mr-2" />
          Afficher le synopsis (spoilers)
        </Button>
      </div>
    </div>
  )
}
