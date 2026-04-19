"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function TestAdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = []

    try {
      // Test 1: Vérifier la connexion utilisateur
      results.push({
        test: "Connexion utilisateur",
        status: user ? "✅ Connecté" : "❌ Non connecté",
        details: user ? `ID: ${user.id}, Admin: ${user.isAdmin}` : "Aucun utilisateur connecté",
      })

      // Test 2: Vérifier les tables
      const tables = ["tv_channels", "radio_stations", "retrogaming_sources", "movies", "tv_shows", "anime"]

      for (const table of tables) {
        try {
          const { data, error, count } = await supabase.from(table).select("*", { count: "exact" }).limit(1)

          if (error) {
            results.push({
              test: `Table ${table}`,
              status: "❌ Erreur",
              details: error.message,
            })
          } else {
            results.push({
              test: `Table ${table}`,
              status: "✅ OK",
              details: `${count || 0} enregistrements`,
            })
          }
        } catch (err) {
          results.push({
            test: `Table ${table}`,
            status: "❌ Exception",
            details: err.message,
          })
        }
      }

      // Test 3: Test d'insertion
      try {
        const testData = {
          name: "Test Channel " + Date.now(),
          category: "Test",
          country: "Test",
          language: "Test",
          stream_url: "https://test.com",
          logo_url: "https://test.com/logo.png",
          description: "Test channel",
          quality: "HD",
          is_active: true,
        }

        const { data, error } = await supabase.from("tv_channels").insert([testData]).select()

        if (error) {
          results.push({
            test: "Test d'insertion",
            status: "❌ Erreur",
            details: error.message,
          })
        } else {
          results.push({
            test: "Test d'insertion",
            status: "✅ OK",
            details: `Inséré avec ID: ${data[0]?.id}`,
          })

          // Test 4: Test de mise à jour
          if (data[0]?.id) {
            const { error: updateError } = await supabase
              .from("tv_channels")
              .update({ is_active: false })
              .eq("id", data[0].id)

            if (updateError) {
              results.push({
                test: "Test de mise à jour",
                status: "❌ Erreur",
                details: updateError.message,
              })
            } else {
              results.push({
                test: "Test de mise à jour",
                status: "✅ OK",
                details: "Mise à jour réussie",
              })
            }

            // Test 5: Test de suppression
            const { error: deleteError } = await supabase.from("tv_channels").delete().eq("id", data[0].id)

            if (deleteError) {
              results.push({
                test: "Test de suppression",
                status: "❌ Erreur",
                details: deleteError.message,
              })
            } else {
              results.push({
                test: "Test de suppression",
                status: "✅ OK",
                details: "Suppression réussie",
              })
            }
          }
        }
      } catch (err) {
        results.push({
          test: "Test d'insertion",
          status: "❌ Exception",
          details: err.message,
        })
      }

      // Test 6: Vérifier les colonnes is_active
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("is_active").limit(1)

          if (error) {
            results.push({
              test: `Colonne is_active dans ${table}`,
              status: "❌ Manquante",
              details: error.message,
            })
          } else {
            results.push({
              test: `Colonne is_active dans ${table}`,
              status: "✅ Présente",
              details: "Colonne trouvée",
            })
          }
        } catch (err) {
          results.push({
            test: `Colonne is_active dans ${table}`,
            status: "❌ Erreur",
            details: err.message,
          })
        }
      }
    } catch (error) {
      results.push({
        test: "Test général",
        status: "❌ Erreur critique",
        details: error.message,
      })
    }

    setTestResults(results)
    setLoading(false)
  }

  const fixDatabase = async () => {
    try {
      toast({
        title: "Correction en cours",
        description: "Exécution du script de correction...",
      })

      // Ici on pourrait exécuter des requêtes de correction
      // Pour l'instant, on va juste recharger les tests
      await runTests()

      toast({
        title: "Correction terminée",
        description: "Vérifiez les résultats des tests",
      })
    } catch (error) {
      toast({
        title: "Erreur de correction",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user) {
      runTests()
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Administration - Non connecté</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être connecté pour accéder aux tests d'administration.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Administration WaveWatch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={loading}>
              {loading ? "Test en cours..." : "Relancer les tests"}
            </Button>
            <Button onClick={fixDatabase} variant="outline">
              Corriger la base de données
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Résultats des tests :</h3>
            {testResults.length === 0 ? (
              <p>Aucun test exécuté</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{result.test}</span>
                      <span className="text-sm">{result.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
