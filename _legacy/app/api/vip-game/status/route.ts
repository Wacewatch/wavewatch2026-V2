import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  console.log("[v0] VIP Game Status: Request received")

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] VIP Game Status: User not authenticated")
      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const tomorrowStart = new Date(todayStart)
      tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

      return NextResponse.json({
        playsRemaining: 3,
        playsToday: 0,
        nextResetAt: tomorrowStart.toISOString(),
      })
    }

    console.log("[v0] VIP Game Status: User authenticated:", user.id)

    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    console.log(
      "[v0] VIP Game Status: Checking plays from",
      todayStart.toISOString(),
      "to",
      tomorrowStart.toISOString(),
    )

    const { data: plays, error } = await supabase
      .from("vip_game_plays")
      .select("id")
      .eq("user_id", user.id)
      .gte("played_at", todayStart.toISOString())
      .lt("played_at", tomorrowStart.toISOString())

    if (error) {
      console.error("[v0] VIP Game Status: Error fetching plays:", error)
      return NextResponse.json({
        playsRemaining: 3,
        playsToday: 0,
        nextResetAt: tomorrowStart.toISOString(),
      })
    }

    const playsToday = plays?.length || 0
    const playsRemaining = Math.max(0, 3 - playsToday)

    console.log("[v0] VIP Game Status: Plays today:", playsToday, "Remaining:", playsRemaining)

    return NextResponse.json({
      playsRemaining,
      playsToday,
      nextResetAt: tomorrowStart.toISOString(),
    })
  } catch (err) {
    console.error("[v0] VIP Game Status: Exception:", err)
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    return NextResponse.json(
      {
        playsRemaining: 3,
        playsToday: 0,
        nextResetAt: tomorrowStart.toISOString(),
      },
      { status: 500 },
    )
  }
}
