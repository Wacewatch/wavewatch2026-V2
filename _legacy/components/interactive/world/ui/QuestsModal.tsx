"use client"

import { X, Trophy, Star, Target, Clock, Users, Sparkles, Lock, Check } from "lucide-react"
import { useState, useEffect } from "react"

interface Quest {
  id: string
  quest_code: string
  title: string
  description: string
  category: string
  xp_reward: number
  requirement_type: string
  requirement_value: number
  is_repeatable: boolean
}

interface UserQuest {
  quest_id: string
  progress: number
  is_completed: boolean
  completed_at: string | null
}

interface UnlockableItem {
  id: string
  item_code: string
  name: string
  description: string | null
  category: string
  unlock_level: number
  item_value: string
}

interface UserUnlockedItem {
  item_id: string
}

interface QuestsModalProps {
  onClose: () => void
  userId: string
}

export function QuestsModal({ onClose, userId }: QuestsModalProps) {
  const [userXP, setUserXP] = useState<{ xp: number; level: number } | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [userQuests, setUserQuests] = useState<UserQuest[]>([])
  const [unlockableItems, setUnlockableItems] = useState<UnlockableItem[]>([])
  const [unlockedItems, setUnlockedItems] = useState<UserUnlockedItem[]>([])
  const [selectedTab, setSelectedTab] = useState<"quests" | "rewards">("quests")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestsData()
  }, [userId])

  const loadQuestsData = async () => {
    try {
      setLoading(true)

      // Charger les données XP de l'utilisateur
      const xpRes = await fetch(`/api/interactive/user-xp?userId=${userId}`)
      if (xpRes.ok) {
        const xpData = await xpRes.json()
        setUserXP(xpData)
      }

      // Charger toutes les quêtes
      const questsRes = await fetch("/api/interactive/quests")
      if (questsRes.ok) {
        const questsData = await questsRes.json()
        setQuests(questsData)
      }

      // Charger la progression des quêtes de l'utilisateur
      const userQuestsRes = await fetch(`/api/interactive/user-quests?userId=${userId}`)
      if (userQuestsRes.ok) {
        const userQuestsData = await userQuestsRes.json()
        setUserQuests(userQuestsData)
      }

      // Charger les items déblocables
      const itemsRes = await fetch("/api/interactive/unlockable-items")
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setUnlockableItems(itemsData)
      }

      // Charger les items débloqués par l'utilisateur
      const unlockedRes = await fetch(`/api/interactive/unlocked-items?userId=${userId}`)
      if (unlockedRes.ok) {
        const unlockedData = await unlockedRes.json()
        setUnlockedItems(unlockedData)
      }
    } catch (error) {
      console.error("[v0] Error loading quests data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer l'XP requis pour le prochain niveau
  const calculateXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(level, 1.5))
  }

  const xpForCurrentLevel = userXP ? calculateXPForLevel(userXP.level) : 0
  const xpForNextLevel = userXP ? calculateXPForLevel(userXP.level + 1) : 0
  const xpProgress = userXP ? userXP.xp - xpForCurrentLevel : 0
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const progressPercentage = (xpProgress / xpNeeded) * 100

  // Filtrer les quêtes par catégorie
  const filteredQuests = quests.filter((quest) => selectedCategory === "all" || quest.category === selectedCategory)

  // Grouper les quêtes par statut
  const completedQuests = filteredQuests.filter((quest) => {
    const userQuest = userQuests.find((uq) => uq.quest_id === quest.id)
    return userQuest?.is_completed
  })

  const inProgressQuests = filteredQuests.filter((quest) => {
    const userQuest = userQuests.find((uq) => uq.quest_id === quest.id)
    return userQuest && !userQuest.is_completed && userQuest.progress > 0
  })

  const availableQuests = filteredQuests.filter((quest) => {
    const userQuest = userQuests.find((uq) => uq.quest_id === quest.id)
    return !userQuest || (userQuest.progress === 0 && !userQuest.is_completed)
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "exploration":
        return <Target className="w-5 h-5" />
      case "social":
        return <Users className="w-5 h-5" />
      case "time":
        return <Clock className="w-5 h-5" />
      case "events":
        return <Star className="w-5 h-5" />
      default:
        return <Trophy className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "exploration":
        return "from-blue-500 to-cyan-500"
      case "social":
        return "from-green-500 to-emerald-500"
      case "time":
        return "from-orange-500 to-amber-500"
      case "events":
        return "from-purple-500 to-pink-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const isItemUnlocked = (item: UnlockableItem) => {
    return unlockedItems.some((ui) => ui.item_id === item.id)
  }

  const isItemAvailable = (item: UnlockableItem) => {
    return userXP && userXP.level >= item.unlock_level
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl w-full max-w-5xl max-h-[90vh] border-2 border-purple-500/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/20">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-white font-bold text-3xl flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Quêtes & Récompenses
              </h2>
              {!loading && userXP && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">
                      Niveau <span className="text-2xl font-bold text-yellow-400">{userXP.level}</span>
                    </span>
                    <span className="text-white/60">
                      {xpProgress} / {xpNeeded} XP
                    </span>
                  </div>
                  <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden border-2 border-white/20">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs text-center">
                    {xpNeeded - xpProgress} XP avant le niveau {userXP.level + 1}
                  </p>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-4">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setSelectedTab("quests")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedTab === "quests"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              <Target className="w-5 h-5 inline mr-2" />
              Quêtes
            </button>
            <button
              onClick={() => setSelectedTab("rewards")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedTab === "rewards"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              Récompenses
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
              <p className="text-white/60 mt-4">Chargement...</p>
            </div>
          ) : selectedTab === "quests" ? (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "all", label: "Toutes", icon: <Trophy className="w-4 h-4" /> },
                  { value: "exploration", label: "Exploration", icon: <Target className="w-4 h-4" /> },
                  { value: "social", label: "Social", icon: <Users className="w-4 h-4" /> },
                  { value: "time", label: "Temps", icon: <Clock className="w-4 h-4" /> },
                  { value: "events", label: "Événements", icon: <Star className="w-4 h-4" /> },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === cat.value
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Quests Lists */}
              {inProgressQuests.length > 0 && (
                <div>
                  <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    En cours ({inProgressQuests.length})
                  </h3>
                  <div className="space-y-3">
                    {inProgressQuests.map((quest) => {
                      const userQuest = userQuests.find((uq) => uq.quest_id === quest.id)
                      const progress = userQuest ? (userQuest.progress / quest.requirement_value) * 100 : 0

                      return (
                        <div
                          key={quest.id}
                          className={`bg-gradient-to-r ${getCategoryColor(quest.category)} p-[2px] rounded-lg`}
                        >
                          <div className="bg-gray-900 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getCategoryIcon(quest.category)}
                                  <h4 className="text-white font-bold">{quest.title}</h4>
                                </div>
                                <p className="text-white/70 text-sm mb-3">{quest.description}</p>
                                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getCategoryColor(
                                      quest.category,
                                    )} transition-all duration-300`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                <p className="text-white/60 text-xs mt-1">
                                  {userQuest?.progress || 0} / {quest.requirement_value}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="bg-yellow-500/20 px-3 py-1 rounded-lg">
                                  <span className="text-yellow-400 font-bold text-sm">+{quest.xp_reward} XP</span>
                                </div>
                                {quest.is_repeatable && <span className="text-purple-400 text-xs mt-1">Répétable</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {availableQuests.length > 0 && (
                <div>
                  <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Disponibles ({availableQuests.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {availableQuests.map((quest) => (
                      <div
                        key={quest.id}
                        className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(quest.category)}
                              <h4 className="text-white font-semibold text-sm">{quest.title}</h4>
                            </div>
                            <p className="text-white/60 text-xs">{quest.description}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="bg-yellow-500/20 px-2 py-1 rounded">
                              <span className="text-yellow-400 font-bold text-xs">+{quest.xp_reward}</span>
                            </div>
                            {quest.is_repeatable && <span className="text-purple-400 text-xs mt-1">♻️</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedQuests.length > 0 && (
                <div>
                  <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Complétées ({completedQuests.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {completedQuests.map((quest) => (
                      <div
                        key={quest.id}
                        className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 opacity-60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="w-4 h-4 text-green-400" />
                              <h4 className="text-white font-semibold text-sm line-through">{quest.title}</h4>
                            </div>
                            <p className="text-white/40 text-xs">{quest.description}</p>
                          </div>
                          <div className="bg-green-500/20 px-2 py-1 rounded">
                            <span className="text-green-400 font-bold text-xs">✓ +{quest.xp_reward}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-xl mb-4">Items Déblocables par Niveau</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {unlockableItems
                  .sort((a, b) => a.unlock_level - b.unlock_level)
                  .map((item) => {
                    const unlocked = isItemUnlocked(item)
                    const available = isItemAvailable(item)
                    const locked = !available

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg p-4 border-2 transition-all ${
                          unlocked
                            ? "bg-green-500/10 border-green-500/50"
                            : locked
                              ? "bg-gray-800/50 border-gray-700 opacity-50"
                              : "bg-blue-500/10 border-blue-500/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-bold text-sm">{item.name}</h4>
                          {unlocked ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : locked ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <p className="text-white/60 text-xs mb-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-400 font-bold text-sm">Niveau {item.unlock_level}</span>
                          <span className="text-white/40 text-xs capitalize">{item.category}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
