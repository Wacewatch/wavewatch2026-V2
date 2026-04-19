import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InteractiveWorldAdmin } from "@/components/admin/interactive-world-admin"

export const metadata = {
  title: "Gestion du Monde Interactif - WaveWatch Admin",
  description: "Gérer le monde interactif, les salles de cinéma et les paramètres",
}

export default async function InteractiveWorldAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("[interactive-world] User:", user?.id, "Auth error:", authError?.message)

  if (!user) {
    console.log("[interactive-world] No user, redirecting to home")
    redirect("/")
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  console.log("[interactive-world] Profile:", profile, "Profile error:", profileError?.message)

  if (!profile?.is_admin) {
    console.log("[interactive-world] User is not admin, redirecting to home")
    redirect("/")
  }

  const [worldSettings, cinemaRooms, cinemaSessions, customizationOptions, onlineUsers, arcadeGames] =
    await Promise.all([
      supabase.from("interactive_world_settings").select("*"),
      supabase.from("interactive_cinema_rooms").select("*").order("room_number"),
      supabase.from("interactive_cinema_sessions").select("*").order("schedule_start", { ascending: false }),
      supabase.from("avatar_customization_options").select("*").order("category, label"),
      supabase
        .from("interactive_profiles")
        .select("*, user_profiles(username, is_vip, is_vip_plus, is_admin)")
        .eq("is_online", true),
      supabase.from("arcade_games").select("*").order("display_order"),
    ])

  return (
    <InteractiveWorldAdmin
      initialSettings={worldSettings.data || []}
      initialRooms={cinemaRooms.data || []}
      initialSessions={cinemaSessions.data || []}
      initialOptions={customizationOptions.data || []}
      initialOnlineUsers={onlineUsers.data || []}
      initialArcadeGames={arcadeGames.data || []}
    />
  )
}
