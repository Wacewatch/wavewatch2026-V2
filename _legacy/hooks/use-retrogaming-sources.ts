import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface RetrogamingSource {
  id: number
  name: string
  description: string
  url: string
  color: string
  category: string
  is_active?: boolean
}

const fallbackSources: RetrogamingSource[] = [
  {
    id: 1,
    name: "GameOnline",
    description: "Collection de jeux rétro classiques",
    url: "https://gam.onl/",
    color: "bg-blue-600",
    category: "Arcade",
    is_active: true,
  },
  {
    id: 2,
    name: "RetroGames Online",
    description: "Jeux vintage des années 80-90",
    url: "https://www.retrogames.onl/",
    color: "bg-green-600",
    category: "Console",
    is_active: true,
  },
  {
    id: 3,
    name: "WebRcade",
    description: "Émulateur web moderne",
    url: "https://play.webrcade.com/",
    color: "bg-purple-600",
    category: "Émulateur",
    is_active: true,
  },
]

const fetcher = async (): Promise<RetrogamingSource[]> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("retrogaming_sources").select("*").eq("is_active", true).order("name")

    if (error) {
      console.error("Error loading retrogaming sources:", error)
      return fallbackSources
    }

    return data || fallbackSources
  } catch (error) {
    console.error("Error loading retrogaming sources:", error)
    return fallbackSources
  }
}

export function useRetrogamingSources() {
  const { data, error, isLoading, mutate } = useSWR<RetrogamingSource[]>("retrogaming-sources", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
    fallbackData: fallbackSources,
  })

  return {
    sources: data || fallbackSources,
    isLoading,
    error,
    refresh: mutate,
  }
}
