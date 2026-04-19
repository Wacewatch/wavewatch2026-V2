import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Loading favorites for user:", user.id)

    const { data, error } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[v0] Favorites query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Favorites loaded, count:", data?.length || 0)
    return NextResponse.json({ favorites: data })
  } catch (error) {
    console.log("[v0] Favorites API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, contentType, contentTitle, metadata } = await request.json()

    console.log("[v0] Adding favorite for user:", user.id, "content:", contentId, contentType)

    const { data, error } = await supabase.from("user_favorites").insert({
      user_id: user.id,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      metadata: metadata || {},
    })

    if (error) {
      console.log("[v0] Favorites save error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Favorite added successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.log("[v0] Favorites POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")
    const contentType = searchParams.get("contentType")

    if (!contentId || !contentType) {
      return NextResponse.json({ error: "Missing contentId or contentType" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .delete()
      .match({
        user_id: user.id,
        content_id: Number.parseInt(contentId),
        content_type: contentType,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
