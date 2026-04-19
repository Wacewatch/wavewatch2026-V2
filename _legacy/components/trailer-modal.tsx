"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TrailerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  trailerUrl: string
}

export function TrailerModal({ isOpen, onClose, title, trailerUrl }: TrailerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-black border-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="w-full h-full">
          <iframe
            src={trailerUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={`Bande-annonce - ${title}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
