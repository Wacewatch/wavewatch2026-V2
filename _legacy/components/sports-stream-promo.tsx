"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function SportsStreamPromo() {
  return (
    <Card className="w-full bg-gradient-to-br from-red-500/10 via-gray-900/50 to-gray-900 border-red-500/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <Image
                src="/images/minisports-stream-logo-removebg-preview.png"
                alt="Sports-Stream Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h3 className="text-2xl md:text-3xl font-bold text-white">Sports-Stream</h3>
                <Badge className="bg-red-600 text-white border-0">by WaveWatch</Badge>
              </div>
              <p className="text-sm text-gray-300 italic">Votre destination ultime pour le streaming sportif</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-500/30">
                  <Play className="w-3 h-3 mr-1" />
                  Multi-sources
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                  +15 Sports
                </Badge>
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30">
                  Sans inscription
                </Badge>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Profitez d'un streaming multi-sports de haute qualité avec plus de 15 disciplines disponibles. Accédez à
                plusieurs sources de streaming pour chaque événement, le tout sans inscription requise.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white" size="lg">
                <Link href="https://sports-stream.sbs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Accéder au site
                </Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center md:text-left">
              🏀 Football • 🎾 Tennis • 🏈 Basketball • ⚾ Baseball • 🏒 Hockey • Et plus encore...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
