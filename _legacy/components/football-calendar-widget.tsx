"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ChevronDown, ChevronUp, Tv, Radio } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import Image from "next/image"

interface FootballFixture {
  fixture: {
    id: number
    date: string
    status: {
      long: string
      short: string
      elapsed: number | null
    }
    venue: {
      name: string
      city: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

// Mapping des chaînes TV françaises par ligue
const TV_CHANNELS: Record<string, string[]> = {
  "61": ["Canal+", "beIN Sports"], // Ligue 1
  "39": ["RMC Sport", "Canal+"], // Premier League
  "140": ["L'Équipe", "beIN Sports"], // La Liga
  "135": ["Canal+", "beIN Sports"], // Serie A
  "78": ["Canal+", "beIN Sports"], // Bundesliga
  "2": ["Canal+", "RMC Sport", "TF1"], // Champions League
}

export function FootballCalendarWidget() {
  const [fixtures, setFixtures] = useState<FootballFixture[]>([])
  const [liveFixtures, setLiveFixtures] = useState<FootballFixture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState("61") // Ligue 1 par défaut
  const isMobile = useMobile()
  const isMountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const leagues = [
    { id: "61", name: "Ligue 1", flag: "🇫🇷" },
    { id: "39", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: "140", name: "La Liga", flag: "🇪🇸" },
    { id: "135", name: "Serie A", flag: "🇮🇹" },
    { id: "78", name: "Bundesliga", flag: "🇩🇪" },
    { id: "2", name: "Champions League", flag: "🏆" },
  ]

  useEffect(() => {
    if (isMobile !== undefined) {
      setIsExpanded(!isMobile)
    }
  }, [isMobile])

  useEffect(() => {
    // Initial load
    fetchFixtures()
    fetchLiveMatches()

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchLiveMatches()
      }
    }, 300000) // 5 minutes

    return () => {
      // Cleanup interval on unmount or league change
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [selectedLeague])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const fetchFixtures = async () => {
    if (!isMountedRef.current) return
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/football/fixtures?league=${selectedLeague}&days=7`)
      const data = await response.json()

      if (!isMountedRef.current) return

      if (data.error) {
        setError(data.error)
      } else {
        setFixtures(data.fixtures || [])
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error("[v0] Error loading football fixtures:", err)
        setError("Impossible de charger les matchs")
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchLiveMatches = async () => {
    if (!isMountedRef.current) return
    try {
      const response = await fetch("/api/football/live")
      const data = await response.json()
      if (isMountedRef.current) {
        setLiveFixtures(data.fixtures || [])
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error("[v0] Error loading live matches:", err)
      }
    }
  }

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain"
    } else {
      return date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    }
  }

  const getMatchStatus = (fixture: FootballFixture) => {
    const status = fixture.fixture.status.short
    if (status === "NS") return "À venir"
    if (status === "1H" || status === "2H" || status === "HT") return "En cours"
    if (status === "FT") return "Terminé"
    if (status === "CANC") return "Annulé"
    if (status === "PST") return "Reporté"
    return status
  }

  const getTVChannels = (leagueId: string) => {
    return TV_CHANNELS[leagueId] || ["Canal+", "beIN Sports"]
  }

  const allMatches = [...liveFixtures, ...fixtures].slice(0, 15)

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-950 to-blue-900 border-green-700">
        <CardHeader>
          <div
            className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
            onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">Calendrier Football</CardTitle>
              </div>
              <CardDescription className="text-green-300">Chargement des matchs...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-green-950 to-blue-900 border-green-700">
      <CardHeader>
        <div
          className={`flex items-center justify-center relative ${isMobile ? "cursor-pointer" : ""}`}
          onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-green-400" />
              <CardTitle className="text-white">Calendrier Football</CardTitle>
            </div>
            <CardDescription className="text-green-300">
              Matchs à venir et en direct {liveFixtures.length > 0 && `(${liveFixtures.length} live)`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isMobile ? undefined : () => setIsExpanded(!isExpanded)}
            className={`absolute right-0 text-gray-400 hover:text-white hover:bg-green-800 ${isMobile ? "hidden" : ""}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Sélecteur de ligue */}
          <div className="flex flex-wrap gap-2 justify-center">
            {leagues.map((league) => (
              <Button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                variant={selectedLeague === league.id ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  selectedLeague === league.id
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-green-600 text-green-300 hover:bg-green-800/50 bg-transparent"
                }`}
              >
                <span className="mr-1">{league.flag}</span>
                {league.name}
              </Button>
            ))}
          </div>

          {error && <p className="text-red-300 text-center py-4">{error}</p>}

          {allMatches.length === 0 && !error && (
            <p className="text-green-300 text-center py-4">Aucun match prévu prochainement</p>
          )}

          {/* Liste des matchs */}
          <div className="space-y-3 overflow-x-auto">
            {allMatches.map((fixture) => {
              const isLive =
                fixture.fixture.status.short === "1H" ||
                fixture.fixture.status.short === "2H" ||
                fixture.fixture.status.short === "HT"
              const tvChannels = getTVChannels(fixture.league.id.toString())

              return (
                <div
                  key={fixture.fixture.id}
                  className={`p-3 rounded-lg ${isLive ? "bg-green-900/50 border-2 border-green-500 animate-pulse" : "bg-green-900/30 border border-green-700/50"} hover:bg-green-800/50 transition-colors`}
                >
                  {/* En-tête match */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={fixture.league.logo || "/placeholder.svg"}
                        alt={fixture.league.name}
                        width={20}
                        height={20}
                      />
                      <span className="text-xs text-green-300 truncate">{fixture.league.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLive && (
                        <Badge variant="destructive" className="text-xs animate-pulse whitespace-nowrap">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE {fixture.fixture.status.elapsed}'
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-green-600 text-green-300 text-xs whitespace-nowrap">
                        {isLive ? getMatchStatus(fixture) : formatMatchDate(fixture.fixture.date)}
                      </Badge>
                    </div>
                  </div>

                  {/* Équipes et score - layout responsif */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2">
                    {/* Équipe domicile */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Image
                        src={fixture.teams.home.logo || "/placeholder.svg"}
                        alt={fixture.teams.home.name}
                        width={32}
                        height={32}
                        className="flex-shrink-0"
                      />
                      <span className="text-white font-medium text-sm truncate">{fixture.teams.home.name}</span>
                    </div>

                    {/* Score - centralisé */}
                    <div className="flex items-center gap-2 flex-shrink-0 justify-center w-full sm:w-auto">
                      {isLive || fixture.fixture.status.short === "FT" ? (
                        <>
                          <span className="text-xl sm:text-2xl font-bold text-white">{fixture.goals.home ?? 0}</span>
                          <span className="text-green-400">-</span>
                          <span className="text-xl sm:text-2xl font-bold text-white">{fixture.goals.away ?? 0}</span>
                        </>
                      ) : (
                        <span className="text-green-400 font-medium text-sm">
                          {formatMatchTime(fixture.fixture.date)}
                        </span>
                      )}
                    </div>

                    {/* Équipe extérieur */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-white font-medium text-sm truncate text-right">
                        {fixture.teams.away.name}
                      </span>
                      <Image
                        src={fixture.teams.away.logo || "/placeholder.svg"}
                        alt={fixture.teams.away.name}
                        width={32}
                        height={32}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>

                  {/* Chaînes TV */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-green-700/50">
                    <Tv className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1 w-full">
                      {tvChannels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs bg-green-800 text-green-200">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
