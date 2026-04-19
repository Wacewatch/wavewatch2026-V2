import { createAdminClient } from "@/lib/database"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Reset all cinema seats using admin client (bypasses RLS)
    const { error } = await supabase
      .from("interactive_cinema_seats")
      .update({ user_id: null, is_occupied: false, occupied_at: null })
      .not("id", "is", null) // This matches all rows

    if (error) {
      console.error("Error resetting seats:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "All cinema seats have been reset" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
