import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ votes: [] })
    }

    const { data: votes, error } = await supabase
      .from("content_request_votes")
      .select("request_id")
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ votes: votes || [] })
  } catch (error: any) {
    console.error("Error fetching votes:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la récupération des votes" }, { status: 500 })
  }
}
