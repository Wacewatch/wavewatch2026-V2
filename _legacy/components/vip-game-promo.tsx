"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Crown, Info, Sparkles, Clock, ExternalLink, Trophy, Gift } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const AD_URL = "https://otieu.com/4/9248013"

const PRIZES = [
  { name: "VIP 1 mois", chance: "2.5%", color: "bg-purple-600", icon: "👑" },
  { name: "VIP 1 semaine", chance: "7%", color: "bg-blue-600", icon: "💎" },
  { name: "VIP 1 jour", chance: "20%", color: "bg-green-600", icon: "⭐" },
  { name: "Aucun gain", chance: "70.5%", color: "bg-gray-600", icon: "😢" },
]

export function VIPGamePromo() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [playsRemaining, setPlaysRemaining] = useState(3)
  const [playsToday, setPlaysToday] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [winners, setWinners] = useState<any[]>([])
  const [rotation, setRotation] = useState(0)
  const [nextResetAt, setNextResetAt] = useState<string>("")
  const [timeUntilReset, setTimeUntilReset] = useState<string>("")
  const [showAdWarning, setShowAdWarning] = useState(false)

  useEffect(() => {
    checkPlayStatus()
    fetchWinners()
  }, [user])

  useEffect(() => {
    if (nextResetAt) {
      const interval = setInterval(() => updateCountdown(), 1000)
      return () => clearInterval(interval)
    }
  }, [nextResetAt])

  const checkPlayStatus = async () => {
    try {
      const response = await fetch("/api/vip-game/status", {
        credentials: "same-origin",
      })
      if (!response.ok) return

      const data = await response.json()
      setPlaysRemaining(data.playsRemaining || 0)
      setPlaysToday(data.playsToday || 0)
      setNextResetAt(data.nextResetAt || "")
    } catch (error) {
      console.error("Error checking play status:", error)
    }
  }

  const updateCountdown = () => {
    if (!nextResetAt) return

    const now = new Date()
    const reset = new Date(nextResetAt)
    const diff = reset.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeUntilReset("")
      checkPlayStatus()
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`)
  }

  const fetchWinners = async () => {
    try {
      const response = await fetch("/api/vip-game/winners", {
        credentials: "same-origin",
      })
      if (!response.ok) return
      const data = await response.json()
      setWinners(data.winners || [])
    } catch (error) {
      console.error("Error fetching winners:", error)
    }
  }

  const handlePlayClick = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour jouer",
        variant: "destructive",
      })
      return
    }

    if (playsRemaining <= 0) {
      toast({
        title: "Plus de parties disponibles",
        description: `Revenez dans ${timeUntilReset}`,
        variant: "destructive",
      })
      return
    }

    setShowAdWarning(true)
  }

  const handleConfirmPlay = () => {
    setShowAdWarning(false)
    // Ouvre la pub dans un nouvel onglet
    window.open(AD_URL, "_blank")
    // Lance le jeu après un court délai
    setTimeout(() => {
      playGame()
    }, 500)
  }

  const playGame = async () => {
    setIsPlaying(true)
    setIsSpinning(true)
    setResult(null)

    const spins = 5 + Math.random() * 3
    const finalRotation = rotation + spins * 360
    setRotation(finalRotation)

    try {
      const response = await fetch("/api/vip-game/play", {
        method: "POST",
        credentials: "same-origin",
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error("Erreur de communication avec le serveur")
      }

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du jeu")
      }

      setTimeout(() => {
        setIsSpinning(false)
        setResult(data.prize)
        setPlaysRemaining(data.playsRemaining)
        setPlaysToday((prev) => prev + 1)

        if (data.prize && data.prize !== "none") {
          const prizeText =
            data.prize === "vip_1_month" ? "VIP 1 mois" : data.prize === "vip_1_week" ? "VIP 1 semaine" : "VIP 1 jour"

          toast({
            title: "🎉 Félicitations !",
            description: `Vous avez gagné ${prizeText} !`,
          })
          window.dispatchEvent(new Event("vip-updated"))
        } else {
          toast({
            title: "Dommage !",
            description: `Il vous reste ${data.playsRemaining} partie(s) aujourd'hui !`,
          })
        }

        fetchWinners()
      }, 3000)
    } catch (error: any) {
      setIsSpinning(false)
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsPlaying(false)
    }
  }

  const getPrizeLabel = (prize: string) => {
    switch (prize) {
      case "vip_1_month":
        return "VIP 1 mois"
      case "vip_1_week":
        return "VIP 1 semaine"
      case "vip_1_day":
        return "VIP 1 jour"
      default:
        return "Aucun gain"
    }
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 border-purple-700 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold">Jeu VIP Gratuit</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Info className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    Informations sur le jeu
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Règles du jeu */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Comment jouer ?
                    </h3>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Tout le monde peut jouer gratuitement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>3 parties gratuites par jour (réinitialisation à minuit UTC)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Regardez une courte publicité avant chaque partie</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Tentez de gagner un statut VIP gratuit !</span>
                      </li>
                    </ul>
                  </div>

                  {/* Liste des gains */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-yellow-400">Gains possibles</h3>
                    <div className="grid gap-3">
                      {PRIZES.map((prize, index) => (
                        <div key={index} className={`${prize.color} rounded-lg p-4 flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{prize.icon}</span>
                            <span className="font-semibold text-white">{prize.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white font-bold">
                            {prize.chance}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Derniers gagnants */}
                  {winners.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-yellow-400">Derniers gagnants</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {winners.slice(0, 10).map((winner, index) => (
                          <div key={index} className="bg-white/5 rounded p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <span className="font-medium">{winner.username}</span>
                            </div>
                            <Badge variant="secondary" className="bg-purple-600">
                              {getPrizeLabel(winner.prize)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-white text-lg">Tentez de gagner un statut VIP gratuit !</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-green-600 text-white">
                {playsRemaining} partie(s) restante(s)
              </Badge>
              {timeUntilReset && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span>Réinitialisation dans {timeUntilReset}</span>
                </div>
              )}
            </div>
          </div>

          {/* Spinning Wheel */}
          <div className="relative w-64 h-64 mx-auto">
            <div
              className={`w-full h-full rounded-full border-8 border-yellow-400 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 flex items-center justify-center transition-transform duration-3000 ease-out ${
                isSpinning ? "animate-spin-slow" : ""
              }`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <Crown className="w-24 h-24 text-yellow-300" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-yellow-400" />
            </div>
          </div>

          {result && (
            <div className="text-center">
              <Badge
                variant="secondary"
                className={`text-lg px-4 py-2 ${
                  result === "none"
                    ? "bg-gray-600"
                    : result === "vip_1_month"
                      ? "bg-purple-600"
                      : result === "vip_1_week"
                        ? "bg-blue-600"
                        : "bg-green-600"
                }`}
              >
                {getPrizeLabel(result)}
              </Badge>
            </div>
          )}

          {!user ? (
            <div className="text-center space-y-3">
              <p className="text-yellow-400">Connectez-vous pour jouer !</p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6">
                  Se connecter
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              onClick={handlePlayClick}
              disabled={playsRemaining <= 0 || isPlaying}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6 disabled:opacity-50"
            >
              {playsRemaining <= 0
                ? `Revenez dans ${timeUntilReset}`
                : isPlaying
                  ? "En cours..."
                  : `Jouer (${playsRemaining}/3)`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'avertissement pour la pub */}
      <Dialog open={showAdWarning} onOpenChange={setShowAdWarning}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-yellow-400" />
              Publicité requise
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Pour jouer gratuitement, vous devez regarder une courte publicité. Un nouvel onglet va s'ouvrir.
            </p>
            <p className="text-sm text-gray-400">
              Cela nous aide à maintenir le site gratuit pour tous les utilisateurs.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmPlay}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir la pub et jouer
              </Button>
              <Button onClick={() => setShowAdWarning(false)} variant="outline" className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
