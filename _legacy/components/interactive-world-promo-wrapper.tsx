import { supabase } from "@/lib/supabase"
import { InteractiveWorldPromo } from "./interactive-world-promo"

async function getCinemaSessionsData() {
  try {
    const now = new Date()

    const { data: sessions } = await supabase
      .from("interactive_cinema_sessions")
      .select("*, interactive_cinema_rooms(name, room_number)")
      .eq("is_active", true)
      .order("schedule_start", { ascending: true })

    if (!sessions) return []

    const sortedSessions = sessions.sort((a, b) => {
      const nowTime = now.getTime()
      const aStart = new Date(a.schedule_start).getTime()
      const aEnd = new Date(a.schedule_end).getTime()
      const bStart = new Date(b.schedule_start).getTime()
      const bEnd = new Date(b.schedule_end).getTime()

      const aIsPlaying = nowTime >= aStart && nowTime <= aEnd
      const bIsPlaying = nowTime >= bStart && nowTime <= bEnd
      const aIsFinished = nowTime > aEnd
      const bIsFinished = nowTime > bEnd

      // EN COURS sessions first
      if (aIsPlaying && !bIsPlaying) return -1
      if (!aIsPlaying && bIsPlaying) return 1

      // Finished sessions last
      if (aIsFinished && !bIsFinished) return 1
      if (!aIsFinished && bIsFinished) return -1

      // Then sort by start time
      return aStart - bStart
    })

    return sortedSessions
  } catch (error) {
    console.error("Error loading cinema sessions:", error)
    return []
  }
}

async function getStadiumData() {
  try {
    const now = new Date().toISOString()

    // Get current or next stadium match
    const { data: stadium } = await supabase
      .from("interactive_stadium")
      .select("*")
      .eq("is_open", true)
      .gte("schedule_end", now)
      .order("schedule_start", { ascending: true })
      .limit(1)
      .single()

    return stadium
  } catch (error) {
    console.error("Error loading stadium data:", error)
    return null
  }
}

export async function InteractiveWorldPromoWrapper() {
  const cinemaSessions = await getCinemaSessionsData()
  const stadium = await getStadiumData()

  return <InteractiveWorldPromo cinemaSessions={cinemaSessions} stadium={stadium} />
}
