"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Trophy, Medal, Award, FlaskRoundIcon as Flask } from "lucide-react"
import { VIPSystem, type VIPUser } from "@/lib/vip-system"

export function TopSupporters() {
  const [supporters, setSupporters] = useState<VIPUser[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const loadSupporters = () => {
      setSupporters(VIPSystem.getTopSupporters(10))
    }

    loadSupporters()

    const handleVIPUpdate = () => {
      loadSupporters()
    }

    window.addEventListener("vip-updated", handleVIPUpdate)
    return () => window.removeEventListener("vip-updated", handleVIPUpdate)
  }, [])

  if (!mounted || supporters.length === 0) {
    return null
  }

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{index + 1}</span>
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

  const getVIPBadge = (level: string) => {
    if (level === "vip") {
      return (
        <Badge variant="secondary" className="text-yellow-600 border-yellow-400">
          <Crown className="w-3 h-3 mr-1" />
          VIP
        </Badge>
      )
    }
    if (level === "vip_plus") {
      return (
        <Badge variant="secondary" className="text-purple-600 border-purple-400">
          <Crown className="w-3 h-3 mr-1" />
          VIP+
        </Badge>
      )
    }
    if (level === "beta") {
      return (
        <Badge variant="secondary" className="text-cyan-400 border-cyan-400">
          <Flask className="w-3 h-3 mr-1" />
          BETA
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-900/50 border-t border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Top Supporters WaveWatch
            </CardTitle>
            <CardDescription className="text-gray-400">
              Merci à nos généreux supporters qui nous aident à maintenir WaveWatch gratuit pour tous !
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supporters.map((supporter, index) => (
                <div
                  key={supporter.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30"
                        : index === 2
                          ? "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30"
                          : "bg-gray-700/30 border border-gray-600/30"
                  }`}
                >
                  <div className="flex-shrink-0">{getPositionIcon(index)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${getUsernameColor(supporter.level)}`}>
                        {supporter.username}
                      </p>
                      {getVIPBadge(supporter.level)}
                    </div>
                    <p className="text-sm text-gray-400">{supporter.totalPaid.toFixed(2)}€ de soutien</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                Vous aussi, soutenez WaveWatch et apparaissez dans ce classement !
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
