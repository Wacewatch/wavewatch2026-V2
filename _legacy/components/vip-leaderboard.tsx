"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Trophy, Medal, Award, Star, Zap, Users, Percent } from "lucide-react"
import { VIPSystem, type VIPUser } from "@/lib/vip-system"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function VIPLeaderboard() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVIP: 0,
    totalVIPPlus: 0,
    totalBeta: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    vipPercentage: 0,
    totalUsers: 0,
  })
  const [topSupporters, setTopSupporters] = useState<VIPUser[]>([])
  const [newestVIPs, setNewestVIPs] = useState<VIPUser[]>([])
  const [oldestVIPs, setOldestVIPs] = useState<VIPUser[]>([])
  const [betaUsers, setBetaUsers] = useState<VIPUser[]>([])

  useEffect(() => {
    setMounted(true)
    loadData()

    const handleVIPUpdate = () => {
      loadData()
    }

    window.addEventListener("vip-updated", handleVIPUpdate)
    return () => window.removeEventListener("vip-updated", handleVIPUpdate)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: usersData,
        error: usersError,
        count,
      } = await supabase.from("user_profiles").select("id, username, is_vip, created_at", { count: "exact" })

      if (usersError) {
        console.error("Error fetching users:", usersError)
        return
      }

      console.log("[v0] VIP Leaderboard: Loaded", usersData?.length, "users (count:", count, ")")

      const totalUsers = count || usersData?.length || 0 // Use the count parameter from Supabase for accurate total
      const vipUsers = usersData?.filter((user) => user.is_vip) || []
      const totalVIPCount = vipUsers.length

      const localVipStats = VIPSystem.getVIPStats()
      const allLocalVIPs = VIPSystem.getVIPUsers().filter((user) => user.level !== "free")

      const totalVIPAndPremium = totalVIPCount + localVipStats.totalVIPPlus
      const vipPercentage = totalUsers > 0 ? (totalVIPAndPremium / totalUsers) * 100 : 0

      console.log("Debug VIP calculation:", {
        totalUsers,
        totalVIPCount,
        totalVIPPlus: localVipStats.totalVIPPlus,
        totalBeta: localVipStats.totalBeta,
        totalVIPAndPremium,
        vipPercentage,
      })

      setStats({
        totalVIP: totalVIPCount,
        totalVIPPlus: localVipStats.totalVIPPlus,
        totalBeta: localVipStats.totalBeta,
        monthlyRevenue: localVipStats.monthlyRevenue,
        totalRevenue: localVipStats.totalRevenue,
        totalUsers: totalUsers,
        vipPercentage: Math.round(vipPercentage * 10) / 10,
      })

      setTopSupporters([...allLocalVIPs].sort((a, b) => b.totalContribution - a.totalContribution).slice(0, 5))

      const dbVIPs = vipUsers.map((user) => ({
        id: user.id,
        username: user.username,
        level: "vip" as const,
        subscriptionDate: new Date(user.created_at),
        totalContribution: 0.99,
        monthlyContribution: 0.99,
      }))

      const allVIPs = [...allLocalVIPs, ...dbVIPs]

      const uniqueVIPs = allVIPs.filter(
        (vip, index, self) => index === self.findIndex((v) => v.username === vip.username),
      )

      setNewestVIPs(
        [...uniqueVIPs]
          .sort((a, b) => new Date(b.subscriptionDate).getTime() - new Date(a.subscriptionDate).getTime())
          .slice(0, 5),
      )

      setOldestVIPs(
        [...uniqueVIPs]
          .sort((a, b) => new Date(a.subscriptionDate).getTime() - new Date(b.subscriptionDate).getTime())
          .slice(0, 5),
      )

      const betaUsersList = allLocalVIPs.filter((user) => user.level === "beta")
      setBetaUsers(betaUsersList.slice(0, 10))
    } catch (error) {
      console.error("Error loading VIP data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
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
        return (
          <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-500">#{index + 1}</span>
        )
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
        <Badge variant="secondary" className="text-yellow-600 border-yellow-400 text-xs">
          <Crown className="w-3 h-3 mr-1" />
          VIP
        </Badge>
      )
    }
    if (level === "vip_plus") {
      return (
        <Badge variant="secondary" className="text-purple-600 border-purple-400 text-xs">
          <Crown className="w-3 h-3 mr-1" />
          VIP+
        </Badge>
      )
    }
    if (level === "beta") {
      return (
        <Badge variant="secondary" className="text-cyan-400 border-cyan-400 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          BETA
        </Badge>
      )
    }
    return null
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getDaysSince = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="space-y-6 px-2 sm:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded mx-auto mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Statistiques générales - Responsive amélioré */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.totalVIP}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">VIP</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalVIPPlus}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">VIP+</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.vipPercentage}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Taux VIP</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Utilisateurs</div>
          </CardContent>
        </Card>
      </div>

      {/* Classements */}
      <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🏆 Hall of Fame VIP
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            Rejoignez nos supporters et apparaissez dans ce classement prestigieux !
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="veterans" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 text-xs sm:text-sm">
              <TabsTrigger value="veterans" className="data-[state=active]:bg-purple-600/20 px-1 sm:px-3">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Vétérans</span>
                <span className="sm:hidden">Vétérans</span>
              </TabsTrigger>
              <TabsTrigger value="newest" className="data-[state=active]:bg-green-600/20 px-1 sm:px-3">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nouveaux VIP</span>
                <span className="sm:hidden">Nouveaux</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="veterans" className="mt-6">
              <div className="space-y-3">
                {oldestVIPs.length > 0 ? (
                  oldestVIPs.map((vip, index) => (
                    <div
                      key={vip.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className={`font-bold text-sm sm:text-base truncate ${getUsernameColor(vip.level)}`}>
                              {vip.username}
                            </p>
                            {getVIPBadge(vip.level)}
                            {getDaysSince(vip.subscriptionDate) >= 365 && (
                              <Badge
                                variant="secondary"
                                className="text-purple-400 border-purple-400 text-xs animate-pulse"
                              >
                                VÉTÉRAN
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            Membre depuis {formatDate(vip.subscriptionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm text-purple-400">{getDaysSince(vip.subscriptionDate)} jours</p>
                        <p className="text-xs text-gray-400">d'ancienneté</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Soyez parmi les premiers vétérans VIP !</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="newest" className="mt-6">
              <div className="space-y-3">
                {newestVIPs.length > 0 ? (
                  newestVIPs.map((vip, index) => (
                    <div
                      key={vip.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className={`font-bold text-sm sm:text-base truncate ${getUsernameColor(vip.level)}`}>
                              {vip.username}
                            </p>
                            {getVIPBadge(vip.level)}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            Rejoint le {formatDate(vip.subscriptionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm text-green-400">
                          Il y a {getDaysSince(vip.subscriptionDate)} jours
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Soyez le prochain nouveau VIP !</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to action */}
          <div className="mt-8 text-center p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-lg border border-purple-500/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">🌟 Votre nom pourrait être ici !</h3>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Rejoignez nos supporters et apparaissez dans ces classements prestigieux
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300">
              <span>✨ Badge exclusif</span>
              <span>•</span>
              <span>🎨 Pseudo coloré</span>
              <span>•</span>
              <span>🏆 Classement public</span>
              <span>•</span>
              <span>💝 Soutenir WaveWatch</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
