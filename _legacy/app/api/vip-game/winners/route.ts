import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: winners, error } = await supabase
      .from("vip_game_winners")
      .select("*")
      .order("won_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[v0] Error fetching winners:", error)
      return NextResponse.json({ winners: [] })
    }

    return NextResponse.json({ winners: winners || [] })
  } catch (error) {
    console.error("[v0] Error in winners route:", error)
    return NextResponse.json({ winners: [] })
  }
}
