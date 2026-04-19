import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    let query = supabase.from("user_feedback").select("*")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ feedback: data })
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const body = await request.json()
    const { user_id, content_rating, functionality_rating, design_rating, guestbook_message } = body

    // Check if user already has feedback
    const { data: existing } = await supabase.from("user_feedback").select("*").eq("user_id", user_id).single()

    let result
    if (existing) {
      // Update existing feedback
      result = await supabase
        .from("user_feedback")
        .update({
          content_rating,
          functionality_rating,
          design_rating,
          guestbook_message,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id)
        .select()
        .single()
    } else {
      // Insert new feedback
      result = await supabase
        .from("user_feedback")
        .insert({
          user_id,
          content_rating,
          functionality_rating,
          design_rating,
          guestbook_message,
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json({ feedback: result.data })
  } catch (error) {
    console.error("Error saving feedback:", error)
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
