import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("interactive_profiles")
      .update({
        is_online: false,
        last_seen: new Date().toISOString(),
      })
      .eq("user_id", user_id)

    if (error) {
      console.error("Error disconnecting user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in disconnect API:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
