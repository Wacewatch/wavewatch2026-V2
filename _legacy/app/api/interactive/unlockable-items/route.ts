import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("interactive_unlockable_items")
      .select("*")
      .order("unlock_level", { ascending: true })

    if (error) {
      console.error("Error fetching unlockable items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in unlockable-items API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
