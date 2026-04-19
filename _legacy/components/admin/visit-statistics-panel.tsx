"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Clock, TrendingUp, RefreshCw, Timer, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserStatsModal } from "./user-stats-modal"

interface VisitStat {
  user_id: string
  email: string | null
  username: string | null
  visit_count: number
  last_visit: string
  first_visit: string
  avg_session_seconds: number | null
  total_session_seconds: number | null
}

interface VisitStatisticsPanelProps {
  initialStats?: VisitStat[]
  initialLast24h?: number
}

// Format seconds to human readable duration
const formatDuration = (seconds: number | null): string => {
  if (!seconds || seconds === 0) return "-"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export function VisitStatisticsPanel({ initialStats = [], initialLast24h = 0 }: VisitStatisticsPanelProps) {
  const [stats, setStats] = useState<VisitStat[]>(initialStats)
  const [last24hCount, setLast24hCount] = useState(initialLast24h)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<VisitStat | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    setLoading(true)
    try {
      // Fetch visit stats per user
      const { data: visitStats, error: statsError } = await supabase
        .from("interactive_world_visit_stats")
        .select("*")
        .order("visit_count", { ascending: false })

      if (statsError) {
        console.error("Error fetching visit stats:", statsError)
      } else {
        setStats(visitStats || [])
      }

      // Fetch count for last 24 hours
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      const { count, error: countError } = await supabase
        .from("interactive_world_visits")
        .select("*", { count: "exact", head: true })
        .gte("visited_at", twentyFourHoursAgo.toISOString())

      if (countError) {
        console.error("Error fetching 24h count:", countError)
      } else {
        setLast24hCount(count || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const totalVisits = stats.reduce((sum, stat) => sum + stat.visit_count, 0)
  const uniqueVisitors = stats.length
  const totalTimeSeconds = stats.reduce((sum, stat) => sum + (stat.total_session_seconds || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6" />
            <span className="text-sm opacity-80">Dernières 24h</span>
          </div>
          <div className="text-4xl font-bold">{last24hCount}</div>
          <div className="text-sm opacity-80 mt-1">connexions</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6" />
            <span className="text-sm opacity-80">Visiteurs uniques</span>
          </div>
          <div className="text-4xl font-bold">{uniqueVisitors}</div>
          <div className="text-sm opacity-80 mt-1">utilisateurs</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm opacity-80">Total visites</span>
          </div>
          <div className="text-4xl font-bold">{totalVisits}</div>
          <div className="text-sm opacity-80 mt-1">depuis le début</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-6 h-6" />
            <span className="text-sm opacity-80">Temps total</span>
          </div>
          <div className="text-4xl font-bold">{formatDuration(totalTimeSeconds)}</div>
          <div className="text-sm opacity-80 mt-1">cumulé</div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          onClick={fetchStats}
          disabled={loading}
          variant="outline"
          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* User table */}
      <div className="bg-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800">
                <th className="text-left px-4 py-3 text-gray-300 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Pseudo</th>
                <th className="text-center px-4 py-3 text-gray-300 font-medium">Visites</th>
                <th className="text-center px-4 py-3 text-gray-300 font-medium">Temps moyen</th>
                <th className="text-center px-4 py-3 text-gray-300 font-medium">Temps total</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Dernière visite</th>
                <th className="text-center px-4 py-3 text-gray-300 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Aucune visite enregistrée pour le moment
                  </td>
                </tr>
              ) : (
                stats.map((stat, index) => (
                  <tr
                    key={stat.user_id}
                    className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(stat)}
                  >
                    <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-white">{stat.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-300">{stat.username || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                        {stat.visit_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-orange-600/80 px-3 py-1 rounded-full text-sm font-medium">
                        {formatDuration(stat.avg_session_seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-purple-600/80 px-3 py-1 rounded-full text-sm font-medium">
                        {formatDuration(stat.total_session_seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {formatDate(stat.last_visit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUser(stat)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User details modal */}
      {selectedUser && (
        <UserStatsModal
          userId={selectedUser.user_id}
          email={selectedUser.email}
          username={selectedUser.username}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
