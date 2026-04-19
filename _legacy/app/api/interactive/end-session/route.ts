import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitId, durationSeconds } = body

    if (!visitId) {
      return NextResponse.json({ error: "Missing visitId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the session - RLS will ensure user can only update their own visits
    const { error } = await supabase
      .from("interactive_world_visits")
      .update({
        session_end: new Date().toISOString(),
        session_duration_seconds: durationSeconds || 0
      })
      .eq("id", visitId)
      .eq("user_id", user.id) // Extra safety check

    if (error) {
      console.error("[end-session] Error updating session:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[end-session] Exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
