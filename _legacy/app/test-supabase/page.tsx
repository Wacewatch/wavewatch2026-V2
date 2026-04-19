"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { testSupabaseConnection, createTestUser } from "@/lib/supabase-test"
import { Badge } from "@/components/ui/badge"

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const connectionTest = await testSupabaseConnection()
      const userTest = await createTestUser()

      setTestResults({
        connection: connectionTest,
        userCreation: userTest,
        timestamp: new Date().toLocaleString(),
      })
    } catch (error) {
      console.error("Test error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-blue-900/80 border-blue-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Test Supabase</CardTitle>
            <CardDescription className="text-blue-200">
              Diagnostiquer les problèmes de connexion et d'authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={runTests} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Test en cours..." : "Lancer les tests"}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <div className="text-sm text-blue-300">Tests effectués le : {testResults.timestamp}</div>

                {/* Test de connexion */}
                <Card className="bg-blue-800/50 border-blue-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      Test de connexion
                      <Badge variant={testResults.connection.success ? "default" : "destructive"}>
                        {testResults.connection.success ? "✅ Réussi" : "❌ Échec"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.connection.success ? (
                      <div className="text-green-400">
                        Connexion à Supabase réussie !
                        {testResults.connection.hasSession && (
                          <div className="text-blue-300 mt-1">Session active détectée</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-red-400">Erreur : {testResults.connection.error}</div>
                        {testResults.connection.needsSetup && (
                          <div className="text-yellow-400">💡 Solution : Exécutez le script de création des tables</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Test de création d'utilisateur */}
                <Card className="bg-blue-800/50 border-blue-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      Test de création d'utilisateur
                      <Badge variant={testResults.userCreation.success ? "default" : "destructive"}>
                        {testResults.userCreation.success ? "✅ Réussi" : "❌ Échec"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.userCreation.success ? (
                      <div className="text-green-400">
                        Utilisateur test créé : {testResults.userCreation.user?.email}
                      </div>
                    ) : (
                      <div className="text-red-400">Erreur : {testResults.userCreation.error}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommandations */}
                <Card className="bg-blue-800/50 border-blue-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white">Recommandations</CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-200 space-y-2">
                    {!testResults.connection.success && testResults.connection.needsSetup && (
                      <div>1. Exécutez le script SQL pour créer les tables</div>
                    )}
                    {!testResults.connection.success && !testResults.connection.needsSetup && (
                      <div>1. Vérifiez vos variables d'environnement Supabase</div>
                    )}
                    {testResults.connection.success && !testResults.userCreation.success && (
                      <div>2. Vérifiez les politiques RLS de votre base de données</div>
                    )}
                    {testResults.connection.success && testResults.userCreation.success && (
                      <div className="text-green-400">✅ Tout fonctionne correctement !</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
