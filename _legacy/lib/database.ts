import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Singleton client for browser usage only
let browserClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "createClient from lib/database.ts should only be used in browser context. Use lib/supabase/server.ts for server-side code.",
    )
  }

  return createBrowserClient()
}

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin client should not be used in browser context")
  }

  // This should only be used server-side
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js")
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

// Database operations for user data
export async function addToWatchHistory(
  userId: string,
  contentId: number,
  contentType: string,
  contentTitle: string,
  metadata: any = {},
) {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_watch_history").upsert(
    {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      metadata,
      last_watched_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,content_id,content_type",
    },
  )

  return { data, error }
}

export async function addToFavorites(
  userId: string,
  contentId: number,
  contentType: string,
  contentTitle: string,
  metadata: any = {},
) {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_favorites").insert({
    user_id: userId,
    content_id: contentId,
    content_type: contentType,
    content_title: contentTitle,
    metadata,
  })

  return { data, error }
}

export async function removeFromFavorites(userId: string, contentId: number, contentType: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_favorites")
    .delete()
    .match({ user_id: userId, content_id: contentId, content_type: contentType })

  return { data, error }
}

export async function addToWishlist(
  userId: string,
  contentId: number,
  contentType: string,
  contentTitle: string,
  metadata: any = {},
) {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_wishlist").insert({
    user_id: userId,
    content_id: contentId,
    content_type: contentType,
    content_title: contentTitle,
    metadata,
  })

  return { data, error }
}

export async function removeFromWishlist(userId: string, contentId: number, contentType: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_wishlist")
    .delete()
    .match({ user_id: userId, content_id: contentId, content_type: contentType })

  return { data, error }
}

export async function getUserPreferences(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  return { data, error }
}
