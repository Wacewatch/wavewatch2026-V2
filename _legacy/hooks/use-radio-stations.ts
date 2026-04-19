import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface RadioStation {
  id: number
  name: string
  genre: string
  country: string
  frequency?: string
  logo_url: string
  stream_url: string
  description?: string
  website?: string
  is_active?: boolean
}

const fallbackStations: RadioStation[] = [
  {
    id: 1,
    name: "NRJ",
    genre: "Pop",
    country: "France",
    frequency: "100.3 FM",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/NRJ_2015_logo.png",
    stream_url: "https://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3",
    description: "Hit Music Only",
    website: "https://www.nrj.fr",
    is_active: true,
  },
  {
    id: 2,
    name: "RTL",
    genre: "Talk/News",
    country: "France",
    frequency: "104.3 FM",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/RTL_logo_2015.svg",
    stream_url: "https://streaming.radio.rtl.fr/rtl-1-44-128",
    description: "La première radio de France",
    website: "https://www.rtl.fr",
    is_active: true,
  },
  {
    id: 3,
    name: "France Inter",
    genre: "Talk/News",
    country: "France",
    frequency: "87.8 FM",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/France_Inter_logo_2021.svg",
    stream_url: "https://direct.franceinter.fr/live/franceinter-midfi.mp3",
    description: "Radio du service public français",
    website: "https://www.franceinter.fr",
    is_active: true,
  },
]

const fetcher = async (): Promise<RadioStation[]> => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase not configured, using fallback data")
      return fallbackStations
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("radio_stations").select("*").eq("is_active", true).order("name")

    if (error) {
      console.error("Error loading radio stations:", error)
      return fallbackStations
    }

    return data || fallbackStations
  } catch (error) {
    console.error("Error loading radio stations:", error)
    return fallbackStations
  }
}

export function useRadioStations() {
  const { data, error, isLoading, mutate } = useSWR<RadioStation[]>("radio-stations", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
    fallbackData: fallbackStations,
  })

  return {
    stations: data || fallbackStations,
    isLoading,
    error,
    refresh: mutate,
  }
}
