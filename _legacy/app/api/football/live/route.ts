import { type NextRequest, NextResponse } from "next/server"
import { getCachedFootballData, setCachedFootballData, clearOldCache } from "@/lib/football-cache"

const API_KEY = process.env.FOOTBALL_API_KEY || "test"
const API_HOST = "v3.football.api-sports.io"

export async function GET(request: NextRequest) {
  try {
    const cached = await getCachedFootballData("live")
    if (cached) {
      console.log("[v0] Returning cached live matches")
      return NextResponse.json({ fixtures: cached, error: null, cached: true })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`https://${API_HOST}/fixtures?live=all&timezone=Europe/Paris`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": API_HOST,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] Football live API error:", response.status)
      return NextResponse.json({ fixtures: [], error: null, cached: false }, { status: 200 })
    }

    const data = await response.json()
    console.log("[v0] Live football matches:", data.response?.length || 0)

    if (data.response && data.response.length > 0) {
      await setCachedFootballData("live", data.response)
    }

    clearOldCache()

    return NextResponse.json({
      fixtures: data.response || [],
      error: null,
      cached: false,
    })
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[v0] Football API request timeout")
    } else {
      console.error("[v0] Error fetching live matches:", error)
    }
    return NextResponse.json({ fixtures: [], error: null, cached: false }, { status: 200 })
  }
}
