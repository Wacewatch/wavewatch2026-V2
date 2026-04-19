import { createClient } from "@/lib/supabase/client"

// Re-export for backwards compatibility - single instance
export const supabase = createClient()

export const recoverSession = async () => {
  try {
    const { session, error } = await supabase.auth.getSession()
    if (error) {
      console.warn("[v0] Session recovery error:", error.message)
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignore signout errors during recovery
      }
      return null
    }
    return session
  } catch (error) {
    console.warn("[v0] Session recovery failed:", error)
    return null
  }
}
