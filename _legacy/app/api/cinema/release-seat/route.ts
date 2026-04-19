import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/database"

/**
 * API pour libérer un siège de cinéma
 * Utilisé par sendBeacon quand l'utilisateur ferme la page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { room_id, user_id } = body

    if (!room_id || !user_id) {
      return NextResponse.json({ error: "Missing room_id or user_id" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Libérer le siège de cet utilisateur dans cette salle
    const { error } = await supabase
      .from("interactive_cinema_seats")
      .update({
        is_occupied: false,
        user_id: null,
        occupied_at: null,
      })
      .eq("room_id", room_id)
      .eq("user_id", user_id)

    if (error) {
      console.error("Error releasing seat:", error)
      return NextResponse.json({ error: "Failed to release seat" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in release-seat API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
