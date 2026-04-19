import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("interactive_quests")
      .select("*")
      .order("category", { ascending: true })
      .order("xp_reward", { ascending: true })

    if (error) {
      console.error("Error fetching quests:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in quests API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
