import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] VIP Game Play: Request received")

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] VIP Game Play: User not authenticated")
      return NextResponse.json({ error: "Vous devez être connecté pour jouer" }, { status: 401 })
    }

    console.log("[v0] VIP Game Play: User authenticated:", user.id)

    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    const { data: plays, error: checkError } = await supabase
      .from("vip_game_plays")
      .select("id")
      .eq("user_id", user.id)
      .gte("played_at", todayStart.toISOString())
      .lt("played_at", tomorrowStart.toISOString())

    if (checkError) {
      console.error("[v0] VIP Game Play: Error checking plays:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    const playsToday = plays?.length || 0
    console.log("[v0] VIP Game Play: Plays today:", playsToday)

    if (playsToday >= 3) {
      console.log("[v0] VIP Game Play: Max plays reached")
      return NextResponse.json({ error: "Vous avez déjà joué 3 fois aujourd'hui" }, { status: 400 })
    }

    const random = Math.random() * 100
    let prize = "none"
    let vipDuration = 0

    if (random < 2.5) {
      prize = "vip_1_month"
      vipDuration = 30 * 24 * 60 * 60 * 1000
    } else if (random < 9.5) {
      prize = "vip_1_week"
      vipDuration = 7 * 24 * 60 * 60 * 1000
    } else if (random < 29.5) {
      prize = "vip_1_day"
      vipDuration = 24 * 60 * 60 * 1000
    }

    console.log("[v0] VIP Game Play: Prize determined:", prize)

    const playedAt = new Date().toISOString()
    const { error: playError } = await supabase.from("vip_game_plays").insert({
      user_id: user.id,
      prize,
      played_at: playedAt,
      ad_watched: true,
    })

    if (playError) {
      console.error("[v0] VIP Game Play: Error recording play:", playError)
      return NextResponse.json({ error: playError.message }, { status: 500 })
    }

    console.log("[v0] VIP Game Play: Play recorded successfully")

    if (prize !== "none") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("username, email, vip_expires_at, is_vip_plus")
        .eq("id", user.id)
        .maybeSingle()

      const username = profile?.username || profile?.email?.split("@")[0] || "Utilisateur"

      const currentExpiry = profile?.vip_expires_at ? new Date(profile.vip_expires_at) : new Date()
      const baseDate = currentExpiry > now ? currentExpiry : now
      const newExpiry = new Date(baseDate.getTime() + vipDuration)

      await supabase
        .from("user_profiles")
        .update({
          is_vip: true,
          is_vip_plus: profile?.is_vip_plus || false,
          vip_expires_at: newExpiry.toISOString(),
        })
        .eq("id", user.id)

      await supabase.from("vip_game_winners").insert({
        user_id: user.id,
        username,
        prize,
        won_at: playedAt,
      })

      console.log("[v0] VIP Game Play: VIP status updated for winner")
    }

    const response = {
      prize,
      playedAt,
      playsRemaining: 3 - playsToday - 1,
    }

    console.log("[v0] VIP Game Play: Returning response:", response)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[v0] VIP Game Play: Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Erreur interne du serveur" }, { status: 500 })
  }
}
