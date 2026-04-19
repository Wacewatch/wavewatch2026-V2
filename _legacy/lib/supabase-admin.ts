import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Fonction pour créer un profil utilisateur
export async function createUserProfile(userId: string, username: string, email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: userId,
        username: username,
        email: email,
        is_vip: false,
        is_admin: username.toLowerCase() === "wwadmin",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in createUserProfile:", error)
    return { success: false, error: error.message }
  }
}

// Fonction pour vérifier si un utilisateur existe
export async function checkUserExists(email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, username, email")
      .eq("email", email)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking user:", error)
      return { exists: false, error: error.message }
    }

    return { exists: !!data, user: data }
  } catch (error: any) {
    console.error("Error in checkUserExists:", error)
    return { exists: false, error: error.message }
  }
}
