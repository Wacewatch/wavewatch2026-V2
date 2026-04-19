"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Film, Tv, Sparkles, Tv2, Radio, Gamepad2, List, Award, ThumbsUp, Calendar, Lock } from "lucide-react"
import { WatchTracker } from "@/lib/watch-tracking"
import { AchievementSystem, type Achievement, type AchievementProgress } from "@/lib/achievements"

const CATEGORY_ICONS: Record<string, any> = {
  movie: Film,
  tv: Tv,
  anime: Sparkles,
  "tv-channel": Tv2,
  radio: Radio,
  retrogaming: Gamepad2,
  playlist: List,
  vip: Award,
  social: ThumbsUp,
  general: Calendar,
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: "Films",
  tv: "Séries",
  anime: "Animés",
  "tv-channel": "Chaînes TV",
  radio: "Radio",
  retrogaming: "Rétrogaming",
  playlist: "Playlists",
  vip: "VIP",
  social: "Social",
  general: "Général",
}

// Mock achievements data (in production, this would come from the database)
const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Movies
  {
    id: "1",
    code: "movie_first",
    name: "Premier Film",
    description: "Regardez votre premier film",
    category: "movie",
    icon: "Film",
    color: "text-blue-400",
    requirement_type: "count",
    requirement_value: 1,
    points: 10,
    rarity: "common",
    created_at: "",
  },
  {
    id: "2",
    code: "movie_10",
    name: "Cinéphile Débutant",
    description: "Regardez 10 films",
    category: "movie",
    icon: "Film",
    color: "text-blue-400",
    requirement_type: "count",
    requirement_value: 10,
    points: 25,
    rarity: "common",
    created_at: "",
  },
  {
    id: "3",
    code: "movie_50",
    name: "Amateur de Cinéma",
    description: "Regardez 50 films",
    category: "movie",
    icon: "Film",
    color: "text-blue-400",
    requirement_type: "count",
    requirement_value: 50,
    points: 50,
    rarity: "rare",
    created_at: "",
  },
  {
    id: "4",
    code: "movie_100",
    name: "Cinéphile Confirmé",
    description: "Regardez 100 films",
    category: "movie",
    icon: "Film",
    color: "text-blue-400",
    requirement_type: "count",
    requirement_value: 100,
    points: 100,
    rarity: "epic",
    created_at: "",
  },
  {
    id: "5",
    code: "movie_500",
    name: "Maître du 7ème Art",
    description: "Regardez 500 films",
    category: "movie",
    icon: "Film",
    color: "text-blue-400",
    requirement_type: "count",
    requirement_value: 500,
    points: 250,
    rarity: "legendary",
    created_at: "",
  },

  // TV Shows
  {
    id: "6",
    code: "tv_first",
    name: "Première Série",
    description: "Regardez votre première série",
    category: "tv",
    icon: "Tv",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 1,
    points: 10,
    rarity: "common",
    created_at: "",
  },
  {
    id: "7",
    code: "tv_10",
    name: "Sériephile Débutant",
    description: "Regardez 10 séries",
    category: "tv",
    icon: "Tv",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 10,
    points: 25,
    rarity: "common",
    created_at: "",
  },
  {
    id: "8",
    code: "tv_episodes_100",
    name: "Marathonien",
    description: "Regardez 100 épisodes",
    category: "tv",
    icon: "Trophy",
    color: "text-yellow-400",
    requirement_type: "count",
    requirement_value: 100,
    points: 50,
    rarity: "rare",
    created_at: "",
  },
  {
    id: "9",
    code: "tv_episodes_500",
    name: "Légende des Séries",
    description: "Regardez 500 épisodes",
    category: "tv",
    icon: "Crown",
    color: "text-yellow-400",
    requirement_type: "count",
    requirement_value: 500,
    points: 150,
    rarity: "epic",
    created_at: "",
  },
  {
    id: "10",
    code: "tv_episodes_1000",
    name: "Dieu des Séries",
    description: "Regardez 1000 épisodes",
    category: "tv",
    icon: "Crown",
    color: "text-purple-400",
    requirement_type: "count",
    requirement_value: 1000,
    points: 300,
    rarity: "legendary",
    created_at: "",
  },

  // TV Channels
  {
    id: "11",
    code: "tv_channel_first",
    name: "Première Chaîne",
    description: "Ajoutez votre première chaîne TV en favoris",
    category: "tv-channel",
    icon: "Tv2",
    color: "text-cyan-400",
    requirement_type: "count",
    requirement_value: 1,
    points: 10,
    rarity: "common",
    created_at: "",
  },
  {
    id: "12",
    code: "tv_channel_5",
    name: "Zappeur",
    description: "Ajoutez 5 chaînes TV en favoris",
    category: "tv-channel",
    icon: "Tv2",
    color: "text-cyan-400",
    requirement_type: "count",
    requirement_value: 5,
    points: 20,
    rarity: "common",
    created_at: "",
  },
  {
    id: "13",
    code: "tv_channel_like_10",
    name: "Fan de TV",
    description: "Likez 10 chaînes TV",
    category: "tv-channel",
    icon: "ThumbsUp",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 10,
    points: 30,
    rarity: "rare",
    created_at: "",
  },

  // Radio
  {
    id: "14",
    code: "radio_first",
    name: "Première Radio",
    description: "Ajoutez votre première radio en favoris",
    category: "radio",
    icon: "Radio",
    color: "text-orange-400",
    requirement_type: "count",
    requirement_value: 1,
    points: 10,
    rarity: "common",
    created_at: "",
  },
  {
    id: "15",
    code: "radio_5",
    name: "Auditeur Régulier",
    description: "Ajoutez 5 radios en favoris",
    category: "radio",
    icon: "Radio",
    color: "text-orange-400",
    requirement_type: "count",
    requirement_value: 5,
    points: 20,
    rarity: "common",
    created_at: "",
  },

  // Retrogaming
  {
    id: "16",
    code: "game_first",
    name: "Premier Jeu",
    description: "Jouez à votre premier jeu rétro",
    category: "retrogaming",
    icon: "Gamepad2",
    color: "text-red-400",
    requirement_type: "count",
    requirement_value: 1,
    points: 10,
    rarity: "common",
    created_at: "",
  },
  {
    id: "17",
    code: "game_10",
    name: "Gamer Rétro",
    description: "Jouez à 10 jeux rétro",
    category: "retrogaming",
    icon: "Gamepad2",
    color: "text-red-400",
    requirement_type: "count",
    requirement_value: 10,
    points: 25,
    rarity: "common",
    created_at: "",
  },

  // Playlists
  {
    id: "18",
    code: "playlist_like_10",
    name: "Découvreur",
    description: "Likez 10 playlists",
    category: "playlist",
    icon: "ThumbsUp",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 10,
    points: 30,
    rarity: "rare",
    created_at: "",
  },

  // Social
  {
    id: "19",
    code: "social_likes_50",
    name: "Critique Positif",
    description: "Likez 50 contenus",
    category: "social",
    icon: "ThumbsUp",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 50,
    points: 30,
    rarity: "common",
    created_at: "",
  },
  {
    id: "20",
    code: "social_likes_100",
    name: "Super Fan",
    description: "Likez 100 contenus",
    category: "social",
    icon: "ThumbsUp",
    color: "text-green-400",
    requirement_type: "count",
    requirement_value: 100,
    points: 50,
    rarity: "rare",
    created_at: "",
  },
  {
    id: "21",
    code: "social_favorites_50",
    name: "Collectionneur",
    description: "Ajoutez 50 favoris",
    category: "social",
    icon: "ThumbsUp",
    color: "text-yellow-400",
    requirement_type: "count",
    requirement_value: 50,
    points: 40,
    rarity: "rare",
    created_at: "",
  },

  // General
  {
    id: "22",
    code: "general_streak_7",
    name: "Semaine Active",
    description: "Connectez-vous 7 jours de suite",
    category: "general",
    icon: "Calendar",
    color: "text-blue-400",
    requirement_type: "streak",
    requirement_value: 7,
    points: 30,
    rarity: "common",
    created_at: "",
  },
  {
    id: "23",
    code: "general_time_24h",
    name: "Journée Complète",
    description: "Regardez 24h de contenu",
    category: "general",
    icon: "Calendar",
    color: "text-purple-400",
    requirement_type: "time",
    requirement_value: 1440,
    points: 50,
    rarity: "rare",
    created_at: "",
  },
]

export function AchievementsDashboard() {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [totalPoints, setTotalPoints] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    const stats = WatchTracker.getStats()
    const favorites = WatchTracker.getFavoriteItems()

    // Add additional stats
    const enhancedStats = {
      ...stats,
      radioFavorites: favorites.filter((f) => f.type === "radio").length,
      gamesFavorites: favorites.filter((f) => f.type === "game").length,
      favoritesCount: favorites.length,
    }

    const unlockedCodes = AchievementSystem.checkAchievements(enhancedStats)

    const progressList: AchievementProgress[] = MOCK_ACHIEVEMENTS.map((achievement) => {
      const unlocked = unlockedCodes.includes(achievement.code)
      const progress = AchievementSystem.calculateProgress(achievement, enhancedStats)
      const percentage = Math.min((progress / achievement.requirement_value) * 100, 100)

      return {
        achievement,
        unlocked,
        progress,
        percentage,
      }
    })

    setAchievements(progressList)

    const points = progressList.filter((p) => p.unlocked).reduce((sum, p) => sum + p.achievement.points, 0)
    setTotalPoints(points)

    setUnlockedCount(progressList.filter((p) => p.unlocked).length)
  }, [])

  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.achievement.category === selectedCategory)

  const categories = ["all", ...Array.from(new Set(MOCK_ACHIEVEMENTS.map((a) => a.category)))]

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Succès & Badges
            </CardTitle>
            <CardDescription className="text-gray-400">Débloquez des succès en explorant WaveWatch</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{totalPoints}</div>
            <div className="text-xs text-gray-400">points</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <Progress value={(unlockedCount / MOCK_ACHIEVEMENTS.length) * 100} className="h-2" />
          </div>
          <div className="text-sm text-gray-400">
            {unlockedCount}/{MOCK_ACHIEVEMENTS.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList className="grid grid-cols-5 lg:grid-cols-11 bg-gray-900 gap-1 h-auto p-1">
            <TabsTrigger value="all" className="text-xs px-2 py-1">
              Tous
            </TabsTrigger>
            {categories
              .filter((c) => c !== "all")
              .map((category) => {
                const Icon = CATEGORY_ICONS[category]
                return (
                  <TabsTrigger key={category} value={category} className="text-xs px-2 py-1 flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    <span className="hidden lg:inline">{CATEGORY_LABELS[category]}</span>
                  </TabsTrigger>
                )
              })}
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(({ achievement, unlocked, progress, percentage }) => {
              const Icon = CATEGORY_ICONS[achievement.category]
              const rarityColor = AchievementSystem.getRarityColor(achievement.rarity)
              const rarityBg = AchievementSystem.getRarityBg(achievement.rarity)

              return (
                <Card
                  key={achievement.id}
                  className={`${rarityBg} border-2 ${rarityColor} ${unlocked ? "opacity-100" : "opacity-60"} transition-all hover:scale-105`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${unlocked ? "bg-gray-700" : "bg-gray-800"}`}>
                        {unlocked ? (
                          <Icon className={`h-6 w-6 ${achievement.color}`} />
                        ) : (
                          <Lock className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-white truncate">{achievement.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {achievement.points}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{achievement.description}</p>
                        {!unlocked && (
                          <div className="space-y-1">
                            <Progress value={percentage} className="h-1" />
                            <p className="text-xs text-gray-500">
                              {progress}/{achievement.requirement_value}
                            </p>
                          </div>
                        )}
                        {unlocked && (
                          <Badge variant="secondary" className="bg-green-900/50 text-green-400 text-xs">
                            ✓ Débloqué
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
