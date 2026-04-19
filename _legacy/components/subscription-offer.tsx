"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useMobile } from "@/hooks/use-mobile"

export function SubscriptionOffer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-4">
        <div
          className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
          onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-foreground">
              <Crown className="w-5 h-5 text-yellow-500" />
              Abonnements VIP
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Débloquez des fonctionnalités exclusives</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
            className={`absolute right-0 text-muted-foreground hover:text-foreground ${isMobile ? "hidden" : ""}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Plan Gratuit */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Gratuit</div>
                  <div className="text-xs text-muted-foreground">Accès de base</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">0€</div>
                <div className="text-xs text-muted-foreground">Toujours</div>
              </div>
            </div>

            {/* Plan VIP */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors relative">
              <Badge className="absolute -top-2 -right-2 text-xs bg-yellow-500 text-black border-0">Populaire</Badge>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-yellow-600 dark:text-yellow-400">VIP</div>
                  <div className="text-xs text-muted-foreground">Badge doré exclusif</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">0,99€</div>
                <div className="text-xs text-muted-foreground">par mois</div>
              </div>
            </div>

            {/* Plan VIP+ */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">VIP+</div>
                  <div className="text-xs text-muted-foreground">Expérience ultime</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">1,99€</div>
                <div className="text-xs text-muted-foreground">par mois</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/subscription" className="flex items-center gap-2">
                Voir tous les plans
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>✨ Badge VIP • 🎨 Couleurs personnalisées</p>
            <p>🚀 Support prioritaire • 💎 Soutenir WaveWatch</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
