"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Zap, Trophy, Medal, Award, ChevronDown, ChevronUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { VIPSystem } from "@/lib/vip-system"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"

export function VipOffer() {
  const { user } = useAuth()
  const [topSupporters, setTopSupporters] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    setMounted(true)
    try {
      setTopSupporters(VIPSystem.getTopSupporters(3))
    } catch (error) {
      console.error("Error loading top supporters:", error)
      setTopSupporters([])
    }

    if (isMobile !== undefined) {
      setIsExpanded(!isMobile) // Ouvert sur desktop, fermé sur mobile
    }
  }, [isMobile])

  // Ne pas afficher si l'utilisateur a des privilèges
  if (!mounted) {
    return null
  }

  if (user) {
    const userVIPLevel = VIPSystem.getUserVIPStatus(user.id)
    if (userVIPLevel !== "free") {
      return null
    }
  }

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case 1:
        return <Medal className="w-4 h-4 text-gray-400" />
      case 2:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return null
    }
  }

  const getUsernameColor = (level: string) => {
    return level === "vip"
      ? "text-yellow-600"
      : level === "vip_plus"
        ? "text-purple-600"
        : level === "beta"
          ? "text-cyan-400"
          : "text-foreground"
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-purple-500/30 overflow-hidden">
      {/* Effet de brillance en arrière-plan */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse"></div>

      {/* Header avec bouton toggle */}
      <div className="relative p-4 border-b border-purple-500/20">
        <div
          className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
          onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Soutenez WaveWatch
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
            className={`absolute right-0 text-gray-400 hover:text-white hover:bg-slate-700 ${isMobile ? "hidden" : ""}`}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="relative p-6">
          <div className="space-y-6">
            {/* Section Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plan Gratuit */}
              <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-gray-600">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gratuit</h3>
                <div className="text-2xl font-bold text-white mb-2">0€</div>
                <p className="text-xs text-gray-400 mb-3">Toujours gratuit</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Accès à tout le contenu</li>
                  <li>• Historique de visionnage</li>
                  <li>• Wishlist personnelle</li>
                  <li>• Favoris</li>
                </ul>
              </div>

              {/* Plan VIP */}
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg backdrop-blur-sm border border-yellow-500/30">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">VIP</h3>
                <div className="text-2xl font-bold text-white mb-2">0,99€</div>
                <p className="text-xs text-gray-400 mb-3">par mois</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Tout du plan Gratuit</li>
                  <li>• Badge VIP doré</li>
                  <li>• Nom en couleur dorée</li>
                  <li>• Soutenir WaveWatch</li>
                </ul>
              </div>

              {/* Plan VIP+ */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm border border-purple-500/30">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-400 mb-2">VIP+</h3>
                <div className="text-2xl font-bold text-white mb-2">1,99€</div>
                <p className="text-xs text-gray-400 mb-3">par mois</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Tout du plan VIP</li>
                  <li>• Badge VIP+ premium</li>
                  <li>• Nom en dégradé violet</li>
                  <li>• Soutien maximum</li>
                </ul>
              </div>
            </div>

            {/* Section Top Supporters + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top 3 Supporters */}
              {mounted && topSupporters && topSupporters.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-white mb-4 text-center">🏆 Top Supporters</h4>
                  <div className="space-y-3">
                    {topSupporters.map((supporter, index) => (
                      <div key={supporter.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">{getPositionIcon(index)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate text-sm ${getUsernameColor(supporter.level)}`}>
                            {supporter.username}
                          </p>
                          <p className="text-xs text-gray-400">{supporter.totalContribution.toFixed(2)}€ de soutien</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-300">
                  Les abonnements VIP nous aident à maintenir le site gratuit pour tous !
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="/subscription">
                    <Crown className="w-5 h-5 mr-2" />
                    Devenir VIP
                  </Link>
                </Button>
                <p className="text-xs text-gray-400">Annulation à tout moment • Sans engagement</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
