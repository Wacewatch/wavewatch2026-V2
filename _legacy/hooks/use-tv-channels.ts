import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface TVChannel {
  id: number
  name: string
  category: string
  country: string
  language: string
  logo_url: string
  stream_url: string
  description?: string
  quality?: string
  is_active?: boolean
  trailer_url?: string
}

const fallbackChannels: TVChannel[] = [
  {
    id: 1,
    name: "Master TV",
    category: "Premium",
    country: "France",
    language: "Français",
    logo_url: "https://i.imgur.com/8QZqZqZ.png",
    stream_url: "https://embed.wavewatch.xyz/embed/BgYgx",
    description: "Chaîne premium Master TV",
    quality: "HD",
    is_active: true,
  },
  {
    id: 2,
    name: "TF1",
    category: "Généraliste",
    country: "France",
    language: "Français",
    logo_url: "https://logos-world.net/wp-content/uploads/2020/06/TF1-Logo.png",
    stream_url: "https://embed.wavewatch.xyz/embed/Z4no6",
    description: "Première chaîne de télévision française",
    quality: "HD",
    is_active: true,
  },
  {
    id: 3,
    name: "Canal+",
    category: "Premium",
    country: "France",
    language: "Français",
    logo_url: "https://logos-world.net/wp-content/uploads/2020/06/Canal-Plus-Logo.png",
    stream_url: "https://embed.wavewatch.xyz/embed/Y6mnp",
    description: "Canal+ - Chaîne premium généraliste",
    quality: "4K",
    is_active: true,
  },
]

const fetcher = async (): Promise<TVChannel[]> => {
  try {
    console.log("[v0] Fetching TV channels from database...")
    const supabase = createClient()

    const { data, error } = await supabase.from("tv_channels").select("*").eq("is_active", true).order("name")

    if (error) {
      console.error("[v0] Error loading TV channels:", error.message)
      console.error("[v0] Error hint:", error.hint)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error details:", error.details)

      if (error.message.includes("JSON") || error.message.includes("Invalid")) {
        console.error("[v0] ❌ Supabase project issue detected:")
        console.error("[v0]   - Project may be PAUSED (check Supabase dashboard)")
        console.error("[v0]   - Tables may not exist (run SQL migrations)")
        console.error("[v0]   - RLS policies may be blocking requests")
        console.error("[v0]   - Using fallback data instead")
      }

      return fallbackChannels
    }

    console.log("[v0] Successfully loaded", data?.length || 0, "TV channels from database")
    return data && data.length > 0 ? data : fallbackChannels
  } catch (error) {
    console.error("[v0] Exception loading TV channels:", error)

    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error("[v0] ❌ JSON PARSE ERROR DETECTED")
      console.error("[v0] This means Supabase returned plain text instead of JSON")
      console.error("[v0] Most likely causes:")
      console.error("[v0]   1. Supabase project is PAUSED - check your Supabase dashboard")
      console.error("[v0]   2. Wrong API URL or key")
      console.error("[v0]   3. Network/CORS issue")
      console.error("[v0] Using fallback TV channels data...")
    }

    return fallbackChannels
  }
}

export function useTVChannels() {
  const { data, error, isLoading, mutate } = useSWR<TVChannel[]>("tv-channels", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    fallbackData: fallbackChannels,
  })

  return {
    channels: data || fallbackChannels,
    isLoading,
    error,
    refresh: mutate,
  }
}
