import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("content_request_votes")
      .select("id")
      .eq("request_id", requestId)
      .eq("user_id", user.id)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: "Vous avez déjà voté pour cette demande" }, { status: 400 })
    }

    // Add vote
    const { error } = await supabase.from("content_request_votes").insert({
      request_id: requestId,
      user_id: user.id,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error voting:", error)
    return NextResponse.json({ error: error.message || "Erreur lors du vote" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Remove vote
    const { error } = await supabase
      .from("content_request_votes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error removing vote:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la suppression du vote" }, { status: 500 })
  }
}
