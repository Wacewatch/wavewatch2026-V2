import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer ou créer l'enregistrement XP
    let { data: userXP, error } = await supabase.from("interactive_user_xp").select("*").eq("user_id", userId).single()

    if (error && error.code === "PGRST116") {
      // Pas d'enregistrement, créer un nouveau
      const { data: newXP, error: insertError } = await supabase
        .from("interactive_user_xp")
        .insert({ user_id: userId, xp: 0, level: 1 })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating user XP:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      userXP = newXP
    } else if (error) {
      console.error("Error fetching user XP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(userXP)
  } catch (error: any) {
    console.error("Error in user-xp API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, xpToAdd } = await request.json()

    if (!userId || typeof xpToAdd !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer l'XP actuel
    const { data: currentXP } = await supabase.from("interactive_user_xp").select("*").eq("user_id", userId).single()

    const newXP = (currentXP?.xp || 0) + xpToAdd

    // Mettre à jour l'XP (le trigger s'occupera du niveau)
    const { data, error } = await supabase
      .from("interactive_user_xp")
      .upsert({ user_id: userId, xp: newXP }, { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      console.error("Error updating XP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in user-xp POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
