"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Tv, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function LiveWatchPromo() {
  return (
    <Card className="w-full bg-gradient-to-br from-cyan-500/10 via-gray-900/50 to-gray-900 border-cyan-500/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <Image
                src="https://i.imgur.com/ovX7j6R.png"
                alt="LiveWatch Logo"
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
                <h3 className="text-2xl md:text-3xl font-bold text-white">LiveWatch</h3>
                <Badge className="bg-cyan-600 text-white border-0">by WaveWatch</Badge>
              </div>
              <p className="text-sm text-gray-300 italic">Votre plateforme mondiale de streaming TV en direct</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                  <Globe className="w-3 h-3 mr-1" />
                  17 Pays
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                  <Tv className="w-3 h-3 mr-1" />
                  40 000+ Chaînes
                </Badge>
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30">
                  Accès Gratuit
                </Badge>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Découvrez plus de 40 000 chaînes TV en direct provenant de 17 pays. Profitez de toutes les chaînes 
                nationales et payantes sans abonnement, le tout accessible gratuitement et instantanément.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white" size="lg">
                <Link href="https://livewatch.sbs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Accéder au site
                </Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center md:text-left">
              🌍 France • 🇮🇹 Italie • 🇪🇸 Espagne • 🇬🇧 Royaume-Uni • 🇩🇪 Allemagne • Et 12 autres pays...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
