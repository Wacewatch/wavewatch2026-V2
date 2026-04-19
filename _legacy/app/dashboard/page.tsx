"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Star,
  TrendingUp,
  Trophy,
  Zap,
  Heart,
  Crown,
  ArrowRight,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Film,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { WatchTracker, type WatchStats } from "@/lib/watch-tracking"
import { VIPSystem, type VIPLevel } from "@/lib/vip-system"
import Image from "next/image"
import Link from "next/link"
import { IframeModal } from "@/components/iframe-modal"
import { AchievementsDashboard } from "@/components/achievements-dashboard"
import { useMobile } from "@/hooks/use-mobile"
import { useMessaging } from "@/hooks/use-messaging"
import { UserFeedbackSection } from "@/components/user-feedback-section"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<WatchStats>({
    totalWatchTime: 0,
    moviesWatched: 0,
    showsWatched: 0,
    episodesWatched: 0,
    tvChannelsFavorites: 0,
    averageRating: 0,
    favoriteGenre: "Aucun",
    watchingStreak: 0,
    totalLikes: 0,
    totalDislikes: 0,
    likesMovies: 0,
    dislikesMovies: 0,
    likesTVShows: 0,
    dislikesTVShows: 0,
    likesEpisodes: 0,
    dislikesEpisodes: 0,
    likesTVChannels: 0,
    dislikesTVChannels: 0,
    likesRadio: 0,
    dislikesRadio: 0,
    likesGames: 0,
    dislikesGames: 0,
    likesPlaylists: 0,
    dislikesPlaylists: 0,
    monthlyStats: [],
    genreStats: [],
  })
  const [interestingFacts, setInterestingFacts] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [userVIPLevel, setUserVIPLevel] = useState<VIPLevel>("free")
  const [watchedItems, setWatchedItems] = useState<any[]>([])
  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    if (typeof window !== "undefined") {
      return Number.parseInt(localStorage.getItem("monthlyGoal") || "10")
    }
    return 10
  })

  const isMobile = useMobile()
  const [isStatsOpen, setIsStatsOpen] = useState(true)
  const [isLikesOpen, setIsLikesOpen] = useState(true)
  const [isDetailedStatsOpen, setIsDetailedStatsOpen] = useState(true)
  const [isFactsOpen, setIsFactsOpen] = useState(true)
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(true)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true)
  const { unreadCount } = useMessaging()

  const calculateRecentWatchTime = (days: number): number => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return WatchTracker.getWatchedItems()
      .filter((item) => item.watchedAt >= cutoffDate)
      .reduce((sum, item) => sum + (item.duration || 0), 0)
  }

  const refreshStats = () => {
    const userStats = WatchTracker.getStats()
    setStats(userStats)
    setInterestingFacts(WatchTracker.getInterestingFacts(userStats))
    setFavoritesCount(WatchTracker.getFavoriteItems().length)
    setWatchedItems(WatchTracker.getWatchedItems().slice(0, 12))
    setFavoriteItems(WatchTracker.getFavoriteItems().slice(0, 12))

    if (user) {
      setUserVIPLevel(VIPSystem.getUserVIPStatus(user.id))
    }

    // Force un re-render pour s'assurer que les stats sont à jour
    console.log("Stats refreshed:", userStats)
  }

  const updateMonthlyGoal = (newGoal: number) => {
    setMonthlyGoal(newGoal)
    localStorage.setItem("monthlyGoal", newGoal.toString())
  }

  const handlePlayItem = (item: any) => {
    let playUrl = ""

    console.log("[v0] Attempting to play item:", item)

    if (item.type === "tv-channel") {
      // Try multiple possible property names for TV channels
      playUrl = item.streamUrl || item.stream_url || item.url || item.streamingUrl || ""
    } else if (item.type === "radio") {
      // Try multiple possible property names for radio stations
      playUrl = item.streamUrl || item.stream_url || item.url || item.streamingUrl || ""
    } else if (item.type === "game") {
      // Try multiple possible property names for games
      playUrl = item.url || item.game_url || item.gameUrl || ""
    }

    if (playUrl) {
      console.log("[v0] Opening player for:", item.title, "URL:", playUrl)
      setSelectedItem({ ...item, url: playUrl })
      setIsModalOpen(true)
    } else {
      console.error("[v0] No playable URL found for item:", JSON.stringify(item))
      // Show a toast notification to the user
      alert(`Impossible de lire "${item.title}". URL de streaming non disponible.`)
    }
  }

  useEffect(() => {
    setMounted(true)
    refreshStats()

    const handleUpdate = () => {
      refreshStats()
    }

    window.addEventListener("vip-updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    const interval = setInterval(refreshStats, 2000)

    return () => {
      window.removeEventListener("vip-updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
      clearInterval(interval)
    }
  }, [user])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Accès refusé</h1>
            <p className="text-gray-300">Vous devez être connecté pour accéder à cette page.</p>
          </div>
        </div>
      </div>
    )
  }

  const vipBadge = VIPSystem.getVIPBadge(userVIPLevel)
  const usernameColor = VIPSystem.getUsernameColor(userVIPLevel)

  // Calculs de statistiques supplémentaires
  const totalHours = Math.floor(stats.totalWatchTime / 60)
  const totalDays = Math.floor(totalHours / 24)
  const currentMonth = new Date().getMonth()
  const monthlyProgress = Math.min((stats.moviesWatched + stats.showsWatched) % monthlyGoal, monthlyGoal)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-400">Bienvenue,</p>
              <span className={`font-medium ${usernameColor}`}>{user.username}</span>
              {vipBadge.text && (
                <Badge variant="secondary" className={`${vipBadge.color} border-current`}>
                  <Crown className="w-3 h-3 mr-1" />
                  {vipBadge.text}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent flex-1 sm:flex-none min-w-[120px]"
            >
              <Link href="/profile">
                <Crown className="h-4 w-4 mr-2" />
                <span className="text-sm">Profil</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent flex-1 sm:flex-none min-w-[120px]"
            >
              <Link href="/playlists">
                <Film className="h-4 w-4 mr-2" />
                <span className="text-sm">Mes Playlists</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent flex-1 sm:flex-none min-w-[120px] relative"
            >
              <Link href="/dashboard/messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-sm">Messagerie</span>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-gray-900">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent flex-1 sm:flex-none min-w-[120px]"
            >
              <Link href="/requests">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-sm">Demandes</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards principales */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="cursor-pointer" onClick={() => setIsStatsOpen(!isStatsOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Statistiques principales</CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-400">
                {isStatsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {isStatsOpen && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Temps total</CardTitle>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-white">
                      {totalHours}h {stats.totalWatchTime % 60}m
                    </div>
                    <p className="text-xs text-gray-400">
                      {totalDays > 0 ? `${totalDays} jour${totalDays > 1 ? "s" : ""}` : "de visionnage"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Likes</CardTitle>
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{stats.totalLikes}</div>
                    <p className="text-xs text-gray-400">contenus likés</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Dislikes</CardTitle>
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-red-400">{stats.totalDislikes}</div>
                    <p className="text-xs text-gray-400">contenus dislikés</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Favoris</CardTitle>
                    <Star className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-white">{favoritesCount}</div>
                    <p className="text-xs text-gray-400">favoris</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Statistiques Like/Dislike détaillées */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="cursor-pointer" onClick={() => setIsLikesOpen(!isLikesOpen)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                  Statistiques d'évaluation
                </CardTitle>
                <CardDescription className="text-gray-400">Vos likes et dislikes par catégorie</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400">
                {isLikesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {isLikesOpen && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-800">
                  <div className="text-xl font-bold text-green-400">{stats.likesMovies}</div>
                  <p className="text-xs text-green-400">Films likés</p>
                </div>
                <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-800">
                  <div className="text-xl font-bold text-red-400">{stats.dislikesMovies}</div>
                  <p className="text-xs text-red-400">Films dislikés</p>
                </div>
                <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-800">
                  <div className="text-xl font-bold text-green-400">{stats.likesTVShows}</div>
                  <p className="text-xs text-green-400">Séries likées</p>
                </div>
                <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-800">
                  <div className="text-xl font-bold text-red-400">{stats.dislikesTVShows}</div>
                  <p className="text-xs text-red-400">Séries dislikées</p>
                </div>
                <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-800">
                  <div className="text-xl font-bold text-green-400">{stats.likesEpisodes}</div>
                  <p className="text-xs text-green-400">Épisodes likés</p>
                </div>
                <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-800">
                  <div className="text-xl font-bold text-red-400">{stats.dislikesEpisodes}</div>
                  <p className="text-xs text-red-400">Épisodes dislikés</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                  <div className="text-xl font-bold text-blue-400">
                    {stats.likesTVChannels + stats.dislikesTVChannels}
                  </div>
                  <p className="text-xs text-blue-400">Chaînes TV évaluées</p>
                </div>
                <div className="text-center p-3 bg-purple-900/20 rounded-lg border border-purple-800">
                  <div className="text-xl font-bold text-purple-400">{stats.likesRadio + stats.dislikesRadio}</div>
                  <p className="text-xs text-purple-400">Radios évaluées</p>
                </div>
                <div className="text-center p-3 bg-orange-900/20 rounded-lg border border-orange-800">
                  <div className="text-xl font-bold text-orange-400">{stats.likesGames + stats.dislikesGames}</div>
                  <p className="text-xs text-orange-400">Jeux évalués</p>
                </div>
                <div className="text-center p-3 bg-indigo-900/20 rounded-lg border border-indigo-800">
                  <div className="text-xl font-bold text-indigo-400">
                    {stats.likesPlaylists + stats.dislikesPlaylists}
                  </div>
                  <p className="text-xs text-indigo-400">Playlists évaluées</p>
                </div>
                <div className="text-center p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-xl font-bold text-gray-300">{stats.totalLikes + stats.totalDislikes}</div>
                  <p className="text-xs text-gray-400">Total évaluations</p>
                </div>
              </div>

              {(stats.likesPlaylists > 0 || stats.dislikesPlaylists > 0) && (
                <div className="mt-4 p-4 bg-indigo-900/10 rounded-lg border border-indigo-800">
                  <div className="flex items-center gap-2 mb-3">
                    <List className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-sm font-medium text-indigo-400">Évaluations de Playlists</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-green-900/20 rounded border border-green-800">
                      <div className="text-lg font-bold text-green-400">{stats.likesPlaylists}</div>
                      <p className="text-xs text-green-400">Playlists likées</p>
                    </div>
                    <div className="text-center p-2 bg-red-900/20 rounded border border-red-800">
                      <div className="text-lg font-bold text-red-400">{stats.dislikesPlaylists}</div>
                      <p className="text-xs text-red-400">Playlists dislikées</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Stats détaillées */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="cursor-pointer" onClick={() => setIsDetailedStatsOpen(!isDetailedStatsOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Statistiques détaillées</CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-400">
                {isDetailedStatsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {isDetailedStatsOpen && (
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Note moyenne
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}/10</div>
                    <Progress value={stats.averageRating * 10} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Genre favori
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="secondary"
                      className="text-sm sm:text-lg px-2 sm:px-3 py-1 bg-gray-700 text-gray-300"
                    >
                      {stats.favoriteGenre}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />7 derniers jours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {Math.floor(calculateRecentWatchTime(7) / 60)}h {calculateRecentWatchTime(7) % 60}m
                    </div>
                    <p className="text-xs text-gray-400 mt-1">temps de visionnage</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      30 derniers jours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {Math.floor(calculateRecentWatchTime(30) / 60)}h {calculateRecentWatchTime(30) % 60}m
                    </div>
                    <p className="text-xs text-gray-400 mt-1">temps de visionnage</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contenu regardé détaillé */}
              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    Statistiques de visionnage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-800">
                      <div className="text-2xl font-bold text-red-400">{stats.moviesWatched}</div>
                      <p className="text-sm text-red-400">Films</p>
                    </div>
                    <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-800">
                      <div className="text-2xl font-bold text-blue-400">{stats.showsWatched}</div>
                      <p className="text-sm text-blue-400">Séries</p>
                    </div>
                    <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-800">
                      <div className="text-2xl font-bold text-green-400">{stats.episodesWatched}</div>
                      <p className="text-sm text-green-400">Épisodes</p>
                    </div>
                    <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-800">
                      <div className="text-2xl font-bold text-purple-400">{stats.tvChannelsFavorites}</div>
                      <p className="text-sm text-purple-400">Chaînes TV</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="cursor-pointer" onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Votre avis compte</CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-400">
                {isFeedbackOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {isFeedbackOpen && (
            <CardContent>
              <UserFeedbackSection />
            </CardContent>
          )}
        </Card>

        {/* Interesting Facts - Section améliorée */}
        {interestingFacts.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
            <CardHeader className="cursor-pointer" onClick={() => setIsFactsOpen(!isFactsOpen)}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-300">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Le saviez-vous ?
                  </CardTitle>
                  <CardDescription className="text-blue-400">
                    Quelques statistiques amusantes sur votre visionnage et vos évaluations
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-400">
                  {isFactsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>
            {isFactsOpen && (
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {interestingFacts.map((fact, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-sm"
                    >
                      <p className="text-sm font-medium text-gray-200 flex items-center gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        {fact}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="cursor-pointer" onClick={() => setIsAchievementsOpen(!isAchievementsOpen)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Succès et Badges
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Débloquez des badges en explorant la plateforme
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400">
                {isAchievementsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {isAchievementsOpen && (
            <CardContent>
              <AchievementsDashboard />
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700 text-gray-300">
              Historique
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-gray-700 text-gray-300">
              Favoris ({favoritesCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Historique de visionnage</CardTitle>
                <CardDescription className="text-gray-400">Vos derniers films et épisodes regardés</CardDescription>
              </CardHeader>
              <CardContent>
                {watchedItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucun historique de visionnage pour le moment.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {watchedItems.map((item) => {
                        let imageUrl = ""

                        if (item.type === "episode" && item.showId) {
                          if (item.posterPath) {
                            if (item.posterPath.startsWith("http")) {
                              imageUrl = item.posterPath
                            } else {
                              imageUrl = `https://image.tmdb.org/t/p/w300${item.posterPath}`
                            }
                          }
                        } else if (item.type === "tv-channel" || item.type === "radio") {
                          // For TV channels and radio, use logoUrl if available
                          imageUrl = item.logoUrl || ""
                        } else if (item.type === "game") {
                          // For games, use the game's image URL
                          imageUrl = item.imageUrl || item.logoUrl || ""
                        } else if (item.type === "playlist") {
                          // For playlists, use the playlist's cover image
                          imageUrl = item.coverImage || ""
                        } else if (item.posterPath) {
                          // For movies/TV shows, construct TMDB URL
                          if (item.posterPath.startsWith("http")) {
                            imageUrl = item.posterPath
                          } else {
                            imageUrl = `https://image.tmdb.org/t/p/w300${item.posterPath}`
                          }
                        } else if (item.profilePath) {
                          // For actors
                          imageUrl = `https://image.tmdb.org/t/p/w300${item.profilePath}`
                        }

                        // Fallback placeholder based on item type
                        const fallbackImage =
                          item.type === "tv-channel"
                            ? "/placeholder.svg?height=300&width=200&text=TV"
                            : item.type === "radio"
                              ? "/placeholder.svg?height=300&width=200&text=Radio"
                              : item.type === "game"
                                ? "/placeholder.svg?height=300&width=200&text=Game"
                                : item.type === "playlist"
                                  ? "/placeholder.svg?height=300&width=200&text=Playlist"
                                  : item.type === "episode"
                                    ? "/placeholder.svg?height=300&width=200&text=Episode"
                                    : "/placeholder.svg?height=300&width=200&text=No+Image"

                        const getItemUrl = () => {
                          if (item.type === "movie") {
                            return `/movies/${item.tmdbId}`
                          } else if (item.type === "tv") {
                            return `/tv-shows/${item.tmdbId}`
                          } else if (item.type === "episode" && item.showId) {
                            return `/tv-shows/${item.showId}`
                          } else if (item.type === "playlist") {
                            return `/playlists/${item.id}`
                          }
                          return `/movies/${item.tmdbId || item.id}`
                        }

                        const isPlayableItem =
                          item.type === "tv-channel" || item.type === "radio" || item.type === "game"

                        const handleItemClick = (e: React.MouseEvent) => {
                          if (isPlayableItem) {
                            e.preventDefault()
                            handlePlayItem(item)
                          }
                        }

                        return (
                          <Link key={item.id} href={isPlayableItem ? "#" : getItemUrl()} onClick={handleItemClick}>
                            <div className="space-y-2 group cursor-pointer">
                              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                                <Image
                                  src={imageUrl || fallbackImage}
                                  alt={item.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = fallbackImage
                                  }}
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                    Vu
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-400">{new Date(item.watchedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                    {WatchTracker.getWatchedItems().length > 12 && (
                      <div className="text-center mt-6">
                        <Button
                          asChild
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                        >
                          <Link href="/dashboard/history">
                            Tout voir ({WatchTracker.getWatchedItems().length})
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Mes Favoris</CardTitle>
                <CardDescription className="text-gray-400">
                  Vos films, séries, chaînes TV, radios et acteurs préférés
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    Aucun favori pour le moment. Ajoutez des contenus à vos favoris depuis leurs pages de détails.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {favoriteItems.map((item) => {
                        let imageUrl = ""

                        // Handle different item types with proper image URLs
                        if (item.type === "tv-channel" || item.type === "radio") {
                          imageUrl = item.logoUrl || ""
                        } else if (item.type === "game") {
                          imageUrl = item.imageUrl || item.logoUrl || ""
                        } else if (item.type === "playlist") {
                          imageUrl = item.coverImage || ""
                        } else if (item.posterPath) {
                          if (item.posterPath.startsWith("http")) {
                            imageUrl = item.posterPath
                          } else {
                            imageUrl = `https://image.tmdb.org/t/p/w300${item.posterPath}`
                          }
                        } else if (item.profilePath) {
                          imageUrl = `https://image.tmdb.org/t/p/w300${item.profilePath}`
                        }

                        // Fallback placeholder based on item type
                        const fallbackImage =
                          item.type === "tv-channel"
                            ? "/placeholder.svg?height=300&width=200&text=TV"
                            : item.type === "radio"
                              ? "/placeholder.svg?height=300&width=200&text=Radio"
                              : item.type === "game"
                                ? "/placeholder.svg?height=300&width=200&text=Game"
                                : item.type === "playlist"
                                  ? "/placeholder.svg?height=300&width=200&text=Playlist"
                                  : item.type === "actor"
                                    ? "/placeholder.svg?height=300&width=200&text=Actor"
                                    : "/placeholder.svg?height=300&width=200&text=No+Image"

                        const getItemUrl = () => {
                          switch (item.type) {
                            case "movie":
                              return `/movies/${item.tmdbId}`
                            case "tv":
                              return `/tv-shows/${item.tmdbId}`
                            case "tv-channel":
                              return `/tv-channels`
                            case "radio":
                              return `/radio`
                            case "actor":
                              return `/actors/${item.tmdbId}`
                            case "playlist":
                              return `/playlists/${item.id}`
                            default:
                              return `/movies/${item.tmdbId || item.id}`
                          }
                        }

                        const isPlayableItem =
                          item.type === "tv-channel" || item.type === "radio" || item.type === "game"

                        const handleItemClick = (e: React.MouseEvent) => {
                          if (isPlayableItem) {
                            e.preventDefault()
                            handlePlayItem(item)
                          }
                        }

                        return (
                          <Link key={item.id} href={isPlayableItem ? "#" : getItemUrl()} onClick={handleItemClick}>
                            <div className="space-y-2 group cursor-pointer">
                              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                                <Image
                                  src={imageUrl || fallbackImage}
                                  alt={item.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = fallbackImage
                                  }}
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                                    <Heart className="w-3 h-3" />
                                  </Badge>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                    {item.type === "movie"
                                      ? "Film"
                                      : item.type === "tv"
                                        ? "Série"
                                        : item.type === "tv-channel"
                                          ? "TV"
                                          : item.type === "radio"
                                            ? "Radio"
                                            : item.type === "actor"
                                              ? "Acteur"
                                              : item.type === "playlist"
                                                ? "Playlist"
                                                : "Autre"}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 text-white">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-400">{new Date(item.addedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                    {WatchTracker.getFavoriteItems().length > 12 && (
                      <div className="text-center mt-6">
                        <Button
                          asChild
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                        >
                          <Link href="/dashboard/favorites">
                            Tout voir ({WatchTracker.getFavoriteItems().length})
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedItem && (
        <IframeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedItem(null)
          }}
          title={selectedItem.title}
          src={selectedItem.url}
        />
      )}
    </div>
  )
}
