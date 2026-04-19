import { type NextRequest, NextResponse } from "next/server"
import { getCachedFootballData, setCachedFootballData } from "@/lib/football-cache"

// API-Football (gratuite: 100 requêtes/jour)
const API_KEY = process.env.FOOTBALL_API_KEY || "test"
const API_HOST = "v3.football.api-sports.io"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const league = searchParams.get("league") || "61" // Ligue 1 par défaut
    const season = searchParams.get("season") || new Date().getFullYear().toString()
    const days = searchParams.get("days") || "7" // 7 jours à venir par défaut

    console.log("[v0] Fetching football fixtures for league:", league)

    const cached = await getCachedFootballData("fixtures", league)
    if (cached) {
      console.log("[v0] Returning cached fixtures for league:", league)
      return NextResponse.json({
        fixtures: cached,
        error: null,
        cached: true,
      })
    }

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + Number.parseInt(days))

    const fromDate = today.toISOString().split("T")[0]
    const toDate = futureDate.toISOString().split("T")[0]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(
      `https://${API_HOST}/fixtures?league=${league}&season=${season}&from=${fromDate}&to=${toDate}&timezone=Europe/Paris`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] Football API error:", response.status, response.statusText)
      return NextResponse.json(
        {
          fixtures: [],
          error: "API temporairement indisponible",
          cached: false,
        },
        { status: 200 },
      )
    }

    const data = await response.json()
    console.log("[v0] Football fixtures received:", data.response?.length || 0)

    if (data.response && data.response.length > 0) {
      await setCachedFootballData("fixtures", data.response, league)
    }

    return NextResponse.json({
      fixtures: data.response || [],
      error: null,
      cached: false,
    })
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[v0] Football fixtures API timeout")
    } else {
      console.error("[v0] Error fetching football fixtures:", error)
    }
    return NextResponse.json(
      {
        fixtures: [],
        error: "Erreur de chargement des matchs",
        cached: false,
      },
      { status: 200 },
    )
  }
}
