import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

/**
 * Creates a Supabase browser client for use in Client Components and client-side code.
 * This client is singleton-based and handles session persistence automatically.
 * Uses @supabase/ssr for better session management and cookie handling.
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  return browserClient
}

export function resetClient() {
  browserClient = undefined
}
