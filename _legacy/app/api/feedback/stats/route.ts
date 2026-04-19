import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

let cachedData: {
  stats: { content: number; functionality: number; design: number; totalFeedback: number }
  guestbookMessages: Array<{ message: string; username: string; created_at: string }>
} | null = null
let cacheTime = 0
const CACHE_DURATION = 30000 // 30 seconds

export async function GET() {
  try {
    const now = Date.now()
    if (cachedData && now - cacheTime < CACHE_DURATION) {
      console.log("[v0] Returning cached feedback stats")
      return NextResponse.json(cachedData)
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    )

    // Get all feedback data
    const { data, error } = await supabase.from("user_feedback").select("*")

    if (error) {
      console.error("[v0] Error fetching feedback:", error)
      if (cachedData) {
        console.log("[v0] Returning stale cache due to error")
        return NextResponse.json(cachedData)
      }
      return NextResponse.json({
        stats: { content: 0, functionality: 0, design: 0, totalFeedback: 0 },
        guestbookMessages: [],
      })
    }

    // Calculate averages
    const totalFeedback = data.length
    const contentAvg = totalFeedback > 0 ? data.reduce((sum, f) => sum + (f.content_rating || 0), 0) / totalFeedback : 0
    const functionalityAvg =
      totalFeedback > 0 ? data.reduce((sum, f) => sum + (f.functionality_rating || 0), 0) / totalFeedback : 0
    const designAvg = totalFeedback > 0 ? data.reduce((sum, f) => sum + (f.design_rating || 0), 0) / totalFeedback : 0

    const { data: feedbackMessages, error: feedbackError } = await supabase
      .from("user_feedback")
      .select("guestbook_message, created_at, user_id")
      .not("guestbook_message", "is", null)
      .neq("guestbook_message", "")
      .order("created_at", { ascending: false })

    if (feedbackError) {
      console.error("[v0] Error fetching guestbook messages:", feedbackError)
      if (cachedData) {
        console.log("[v0] Returning stale cache due to guestbook error")
        return NextResponse.json(cachedData)
      }
      return NextResponse.json({
        stats: {
          content: contentAvg,
          functionality: functionalityAvg,
          design: designAvg,
          totalFeedback,
        },
        guestbookMessages: [],
      })
    }

    // Get unique user IDs
    const userIds = [...new Set((feedbackMessages || []).map((f) => f.user_id).filter(Boolean))]

    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, username, email")
      .in("id", userIds)

    if (profilesError) {
      console.error("[v0] Error loading user profiles:", profilesError)
    }

    const usernameMap = new Map(
      (profiles || []).map((p) => {
        const displayName = p.username || (p.email ? p.email.split("@")[0] : "Utilisateur")
        return [p.id, displayName]
      }),
    )

    // Map messages with usernames
    const guestbookMessages = (feedbackMessages || [])
      .filter((f) => f.guestbook_message && f.guestbook_message.trim() !== "")
      .map((f) => {
        const username = usernameMap.get(f.user_id) || "Utilisateur anonyme"
        return {
          message: f.guestbook_message,
          username: username,
          created_at: f.created_at,
        }
      })

    cachedData = {
      stats: {
        content: contentAvg,
        functionality: functionalityAvg,
        design: designAvg,
        totalFeedback,
      },
      guestbookMessages,
    }
    cacheTime = now

    return NextResponse.json(cachedData)
  } catch (error) {
    console.error("[v0] Error in feedback stats route:", error)
    if (cachedData) {
      console.log("[v0] Returning stale cache due to exception")
      return NextResponse.json(cachedData)
    }
    return NextResponse.json(
      {
        stats: { content: 0, functionality: 0, design: 0, totalFeedback: 0 },
        guestbookMessages: [],
      },
      { status: 500 },
    )
  }
}
