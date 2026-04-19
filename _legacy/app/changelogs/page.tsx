"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface Changelog {
  id: string
  version: string
  title: string
  description: string
  release_date: string
  created_at: string
}

export default function ChangelogsPage() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChangelogs = async () => {
      const supabase = createClient()

      const { data, error } = await supabase.from("changelogs").select("*").order("release_date", { ascending: false })

      if (!error && data) {
        setChangelogs(data)
      }
      setLoading(false)
    }

    fetchChangelogs()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Package className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nouveautés</h1>
            <p className="text-blue-300 text-lg">Découvrez les dernières mises à jour et améliorations de WaveWatch</p>
          </div>

          {/* Changelogs List */}
          <div className="space-y-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-blue-900/50 border-blue-700">
                    <CardHeader>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-8 w-64" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : changelogs.length === 0 ? (
              <Card className="bg-blue-900/50 border-blue-700">
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-300">Aucune mise à jour pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              changelogs.map((changelog) => (
                <Card
                  key={changelog.id}
                  className="bg-blue-900/50 border-blue-700 hover:bg-blue-900/70 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-blue-800 text-blue-200 border-blue-600">
                        Version {changelog.version}
                      </Badge>
                      <div className="flex items-center text-blue-300 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(changelog.release_date)}
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-white">{changelog.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-blue-200 whitespace-pre-line">{changelog.description}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
