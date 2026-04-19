import { createClient } from "@/lib/supabase/client"

/**
 * @deprecated Use createClient from @/lib/supabase/client instead
 */
export { createClient }

// Re-export for backwards compatibility - single instance
export const supabase = createClient()
