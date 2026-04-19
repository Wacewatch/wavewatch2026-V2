import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { id, username, email, is_admin } = await request.json()

    if (!id || !username || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Utiliser le client admin pour contourner RLS
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id,
        username,
        email,
        is_vip: false,
        is_admin: is_admin || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
