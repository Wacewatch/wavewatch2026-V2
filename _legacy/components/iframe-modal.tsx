"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Maximize2, Minimize2 } from "lucide-react"

interface IframeModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  title: string
}

export function IframeModal({ isOpen, onClose, src, title }: IframeModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "max-w-full w-screen h-screen p-0 bg-black border-0 rounded-none"
            : "max-w-6xl w-[90vw] h-[80vh] p-0 bg-black border border-gray-700 rounded-lg"
        }`}
      >
        {/* Controls Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-700 p-2 flex items-center justify-between">
          <h3 className="text-white font-medium text-sm truncate flex-1 mr-4">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-8 w-8"
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <iframe
          src={src}
          className="w-full h-full border-0"
          allowFullScreen
          title={title}
          style={{
            position: "absolute",
            top: isFullscreen ? 0 : 48,
            left: 0,
            right: 0,
            bottom: 0,
            height: isFullscreen ? "100%" : "calc(100% - 48px)",
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
