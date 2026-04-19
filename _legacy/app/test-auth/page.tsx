"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function TestAuthPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("testuser@gmail.com")
  const [testUsername, setTestUsername] = useState("testuser")
  const [testPassword, setTestPassword] = useState("password123")
  const { toast } = useToast()

  const addResult = (message: string, type: "success" | "error" | "info" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    setTestResults((prev) => [...prev, formattedMessage])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
    return emailRegex.test(email)
  }

  const testSupabaseConnection = async () => {
    try {
      addResult("Testing Supabase connection...")
      const { supabase } = await import("@/lib/supabase")

      // Test de connexion basique
      const { data, error } = await supabase.from("user_profiles").select("count").limit(1)

      if (error) {
        addResult(`Supabase connection failed: ${error.message}`, "error")
        return false
      }

      addResult("Supabase connection successful", "success")
      return true
    } catch (error: any) {
      addResult(`Supabase connection error: ${error.message}`, "error")
      return false
    }
  }

  const testAuthStats = async () => {
    try {
      addResult("Getting auth statistics...")
      const { supabase } = await import("@/lib/supabase")

      const { data, error } = await supabase.rpc("get_auth_stats")

      if (error) {
        addResult(`Auth stats failed: ${error.message}`, "error")
        return false
      }

      if (data && data.length > 0) {
        const stats = data[0]
        addResult(`Total users: ${stats.users_count}`, "info")
        addResult(`Total profiles: ${stats.profiles_count}`, "info")
        addResult(`Confirmed users: ${stats.confirmed_count}`, "info")
      } else {
        addResult("No stats returned", "info")
      }

      return true
    } catch (error: any) {
      addResult(`Auth stats error: ${error.message}`, "error")
      return false
    }
  }

  const testSimpleUserView = async () => {
    try {
      addResult("Testing simple user view...")
      const { supabase } = await import("@/lib/supabase")

      const { data, error } = await supabase.from("simple_user_view").select("*").limit(10)

      if (error) {
        addResult(`User view failed: ${error.message}`, "error")
        return false
      }

      addResult(`Found ${data?.length || 0} users in view`, "info")
      data?.forEach((user, index) => {
        addResult(
          `User ${index + 1}: ${user.email} (${user.username || "no username"}) - Confirmed: ${user.confirmed}`,
          "info",
        )
      })

      return true
    } catch (error: any) {
      addResult(`User view error: ${error.message}`, "error")
      return false
    }
  }

  const confirmAllUsers = async () => {
    try {
      addResult("Confirming all users...")
      const { supabase } = await import("@/lib/supabase")

      const { data, error } = await supabase.rpc("confirm_all_users")

      if (error) {
        addResult(`Failed to confirm all users: ${error.message}`, "error")
        return false
      }

      addResult(`Result: ${data}`, "success")
      return true
    } catch (error: any) {
      addResult(`Confirm all users error: ${error.message}`, "error")
      return false
    }
  }

  const testManualProfileCreation = async () => {
    try {
      addResult("Testing manual profile creation...")
      const { supabase } = await import("@/lib/supabase")

      const testId = crypto.randomUUID()

      const { data, error } = await supabase.rpc("create_simple_test_profile", {
        p_id: testId,
        p_username: "manual_test",
        p_email: "manual@test.com",
      })

      if (error) {
        addResult(`Manual profile creation failed: ${error.message}`, "error")
        return false
      }

      addResult(`Manual profile created: ${JSON.stringify(data)}`, "success")

      // Nettoyer
      await supabase.from("user_profiles").delete().eq("id", testId)
      addResult("Manual profile cleaned up", "info")

      return true
    } catch (error: any) {
      addResult(`Manual profile creation error: ${error.message}`, "error")
      return false
    }
  }

  const cleanupTestData = async () => {
    try {
      addResult("Cleaning up test data...")
      const { supabase } = await import("@/lib/supabase")

      const { error } = await supabase.rpc("clean_test_data")

      if (error) {
        addResult(`Cleanup failed: ${error.message}`, "error")
      } else {
        addResult("Test data cleaned up", "success")
      }

      return true
    } catch (error: any) {
      addResult(`Cleanup error: ${error.message}`, "error")
      return true // Continue même si le nettoyage échoue
    }
  }

  const testSignUp = async () => {
    try {
      // Valider l'email d'abord
      if (!validateEmail(testEmail)) {
        addResult(`Invalid email format: ${testEmail}`, "error")
        return false
      }

      addResult(`Testing signup for ${testEmail}...`)
      const { supabase } = await import("@/lib/supabase")

      const { data, error } = await supabase.auth.signUp({
        email: testEmail.toLowerCase(),
        password: testPassword,
        options: {
          data: {
            username: testUsername,
          },
        },
      })

      if (error) {
        addResult(`Signup failed: ${error.message}`, "error")

        // Si l'email est invalide, suggérer un autre
        if (error.message.includes("invalid")) {
          addResult("Try using a real email domain like @gmail.com", "info")
        }

        return false
      }

      if (data.user) {
        addResult(`Signup successful! User ID: ${data.user.id}`, "success")
        addResult(`Email confirmed: ${data.user.email_confirmed_at ? "Yes" : "No"}`, "info")

        // Attendre que le trigger crée le profil et confirme l'email
        addResult("Waiting for profile creation and email confirmation...")
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Vérifier si le profil a été créé
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          addResult(`Profile creation failed: ${profileError.message}`, "error")
        } else if (profile) {
          addResult(`Profile created successfully: ${JSON.stringify(profile)}`, "success")
        }

        // Vérifier si l'email a été confirmé
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user?.email_confirmed_at) {
          addResult("Email automatically confirmed", "success")
        } else {
          addResult("Email not yet confirmed, will try manual confirmation", "info")
        }

        return data.user
      }

      addResult("Signup returned no user", "error")
      return false
    } catch (error: any) {
      addResult(`Signup error: ${error.message}`, "error")
      return false
    }
  }

  const testSignIn = async () => {
    try {
      if (!validateEmail(testEmail)) {
        addResult(`Invalid email format: ${testEmail}`, "error")
        return false
      }

      addResult(`Testing signin for ${testEmail}...`)
      const { supabase } = await import("@/lib/supabase")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail.toLowerCase(),
        password: testPassword,
      })

      if (error) {
        addResult(`Signin failed: ${error.message}`, "error")

        // Si l'email n'est pas confirmé, essayer de le confirmer
        if (error.message.includes("Email not confirmed")) {
          addResult("Email not confirmed, attempting confirmation...", "info")

          const { data: confirmData, error: confirmError } = await supabase.rpc("confirm_user_email", {
            user_email: testEmail.toLowerCase(),
          })

          if (confirmError) {
            addResult(`Email confirmation failed: ${confirmError.message}`, "error")
          } else {
            addResult(`Confirmation result: ${confirmData}`, "success")

            // Réessayer la connexion
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: testEmail.toLowerCase(),
              password: testPassword,
            })

            if (retryError) {
              addResult(`Retry signin failed: ${retryError.message}`, "error")
              return false
            }

            if (retryData.user && retryData.session) {
              addResult(`Retry signin successful after email confirmation!`, "success")
              return true
            }
          }
        }

        return false
      }

      if (data.user && data.session) {
        addResult(`Signin successful! User ID: ${data.user.id}`, "success")

        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          addResult(`Profile fetch failed: ${profileError.message}`, "error")
        } else {
          addResult(`Profile fetched: ${JSON.stringify(profile)}`, "success")
        }

        return true
      }

      addResult("Signin returned no user/session", "error")
      return false
    } catch (error: any) {
      addResult(`Signin error: ${error.message}`, "error")
      return false
    }
  }

  const runFullTest = async () => {
    setLoading(true)
    clearResults()

    addResult("Starting comprehensive authentication test V6...")

    // Test 1: Connexion Supabase
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      setLoading(false)
      return
    }

    // Test 2: Statistiques initiales
    await testAuthStats()

    // Test 3: Vue des utilisateurs
    await testSimpleUserView()

    // Test 4: Confirmer tous les utilisateurs
    await confirmAllUsers()

    // Test 5: Création manuelle de profil
    await testManualProfileCreation()

    // Test 6: Nettoyage des données de test
    await cleanupTestData()

    // Test 7: Inscription
    const signupResult = await testSignUp()

    // Test 8: Connexion (seulement si inscription réussie)
    if (signupResult) {
      await testSignIn()
    }

    // Test 9: Statistiques finales
    await testAuthStats()

    addResult("Comprehensive test V6 completed!")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test d'Authentification BDD - Version 6</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email de test</label>
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="testuser@gmail.com"
                />
                {!validateEmail(testEmail) && testEmail && (
                  <p className="text-red-400 text-xs mt-1">Format d'email invalide</p>
                )}
                <p className="text-gray-400 text-xs mt-1">Utilisez un domaine réel comme @gmail.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom d'utilisateur</label>
                <Input
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={runFullTest} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Test en cours..." : "Test Complet V6"}
              </Button>
              <Button onClick={testSupabaseConnection} variant="outline" className="border-gray-600">
                Test Connexion
              </Button>
              <Button onClick={testAuthStats} variant="outline" className="border-gray-600">
                Stats Auth
              </Button>
              <Button onClick={confirmAllUsers} variant="outline" className="border-gray-600">
                Confirmer Tous
              </Button>
              <Button onClick={testSimpleUserView} variant="outline" className="border-gray-600">
                Vue Utilisateurs
              </Button>
              <Button onClick={testSignUp} variant="outline" className="border-gray-600">
                Test Inscription
              </Button>
              <Button onClick={testSignIn} variant="outline" className="border-gray-600">
                Test Connexion
              </Button>
              <Button onClick={clearResults} variant="outline" className="border-gray-600">
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-400">Aucun test exécuté</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="font-mono text-sm">
                      {result.includes("SUCCESS") && <span className="text-green-400">{result}</span>}
                      {result.includes("ERROR") && <span className="text-red-400">{result}</span>}
                      {result.includes("INFO") && <span className="text-blue-400">{result}</span>}
                      {!result.includes("SUCCESS") && !result.includes("ERROR") && !result.includes("INFO") && (
                        <span className="text-gray-300">{result}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Variables d'Environnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configuré" : "✗ Manquant"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Configuré" : "✗ Manquant"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
