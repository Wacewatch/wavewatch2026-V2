import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

interface CachedFootballData {
  type: "fixtures" | "live"
  league?: string
  data: any
  timestamp: number
  expiresAt: number
}

// Cache en mémoire pour les données de la session
const memoryCache = new Map<string, CachedFootballData>()

const CACHE_DURATION = {
  live: 5 * 60 * 1000, // 5 minutes pour les matchs en live
  fixtures: 30 * 60 * 1000, // 30 minutes pour les fixtures à venir
}

export async function getCachedFootballData(
  type: "fixtures" | "live",
  league?: string,
  forceRefresh = false,
): Promise<any | null> {
  const cacheKey = `football_${type}_${league || "all"}`

  // Vérifier le cache mémoire d'abord
  const memCached = memoryCache.get(cacheKey)
  if (memCached && Date.now() < memCached.expiresAt && !forceRefresh) {
    console.log("[v0] Cache hit (memory):", cacheKey)
    return memCached.data
  }

  // Vérifier le cache Supabase
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { data: cachedData } = await supabase
      .from("football_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cachedData && !forceRefresh) {
      console.log("[v0] Cache hit (Supabase):", cacheKey)
      const parsed = cachedData.data
      // Store in memory for faster access
      memoryCache.set(cacheKey, {
        type,
        league,
        data: parsed,
        timestamp: Date.now(),
        expiresAt: new Date(cachedData.expires_at).getTime(),
      })
      return parsed
    }
  } catch (err) {
    console.log("[v0] Supabase cache check failed, will proceed with API call")
  }

  return null
}

export async function setCachedFootballData(type: "fixtures" | "live", data: any, league?: string): Promise<void> {
  const cacheKey = `football_${type}_${league || "all"}`
  const expiresAt = Date.now() + CACHE_DURATION[type]

  // Store in memory
  memoryCache.set(cacheKey, {
    type,
    league,
    data,
    timestamp: Date.now(),
    expiresAt,
  })

  // Store in Supabase for persistence across sessions
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          persistSession: false,
        },
      }
    )

    await supabase.from("football_cache").upsert(
      {
        cache_key: cacheKey,
        data,
        expires_at: new Date(expiresAt).toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" },
    )
  } catch (err) {
    console.log("[v0] Failed to cache in Supabase, using memory only")
  }
}

export function clearOldCache(): void {
  // Clear expired entries from memory
  const now = Date.now()
  for (const [key, value] of memoryCache.entries()) {
    if (now > value.expiresAt) {
      memoryCache.delete(key)
    }
  }
}
