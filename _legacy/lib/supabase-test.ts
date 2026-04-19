import { supabase } from "./supabase"

export async function testSupabaseConnection() {
  try {
    console.log("🔍 Testing Supabase connection...")

    // Test 1: Connexion de base
    const { data, error } = await supabase.from("user_profiles").select("count").limit(1)

    if (error) {
      if (error.code === "42P01") {
        console.log("⚠️ Table user_profiles does not exist")
        return { success: false, error: "Tables not created yet", needsSetup: true }
      }
      console.error("❌ Supabase connection error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Supabase connection successful")

    // Test 2: Test d'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    console.log("🔐 Current session:", !!session)

    return { success: true, hasSession: !!session }
  } catch (error: any) {
    console.error("❌ Supabase test failed:", error)
    return { success: false, error: error.message }
  }
}

export async function createTestUser() {
  try {
    console.log("👤 Creating test user...")

    const { data, error } = await supabase.auth.signUp({
      email: "test@wavewatch.com",
      password: "testpassword123",
      options: {
        data: {
          username: "testuser",
        },
      },
    })

    if (error) {
      console.error("❌ Test user creation failed:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Test user created:", data.user?.email)
    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("❌ Test user creation error:", error)
    return { success: false, error: error.message }
  }
}
