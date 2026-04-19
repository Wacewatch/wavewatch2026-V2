"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Save, Trophy, RefreshCw } from 'lucide-react'

interface StadiumData {
  id: string
  name: string
  match_title: string | null
  embed_url: string | null
  schedule_start: string | null
  schedule_end: string | null
  is_open: boolean
  access_level: string
}

export function StadiumSettingsPanel() {
  const [stadium, setStadium] = useState<StadiumData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadStadiumData()
  }, [])

  const loadStadiumData = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("interactive_stadium")
      .select("*")
      .single()

    if (error) {
      console.error("Error loading stadium data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du stade",
        variant: "destructive",
      })
    } else if (data) {
      setStadium(data)
    }
    setIsLoading(false)
  }

  const handleUpdateStadium = async () => {
    if (!stadium) return

    setIsSaving(true)

    const { error } = await supabase
      .from("interactive_stadium")
      .update({
        name: stadium.name,
        match_title: stadium.match_title || null,
        embed_url: stadium.embed_url || null,
        schedule_start: stadium.schedule_start ? new Date(stadium.schedule_start).toISOString() : null,
        schedule_end: stadium.schedule_end ? new Date(stadium.schedule_end).toISOString() : null,
        is_open: stadium.is_open,
        access_level: stadium.access_level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stadium.id)

    if (error) {
      console.error("Error saving stadium settings:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres du stade",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres du stade ont été mis à jour avec succès",
      })
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des données du stade...</span>
      </div>
    )
  }

  if (!stadium) {
    return (
      <div className="text-center text-gray-400 py-8">
        Aucune donnée de stade trouvée.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Stade de Football
        </h3>
      </div>

      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Nom du Stade</label>
            <Input
              value={stadium.name}
              onChange={(e) => setStadium({ ...stadium, name: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Titre du Match</label>
            <Input
              value={stadium.match_title || ""}
              onChange={(e) => setStadium({ ...stadium, match_title: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-gray-300">URL Embed (Iframe)</label>
            <Input
              value={stadium.embed_url || ""}
              onChange={(e) => setStadium({ ...stadium, embed_url: e.target.value })}
              placeholder="https://www.youtube.com/embed/..."
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Heure de Début</label>
            <Input
              type="datetime-local"
              value={
                stadium.schedule_start ? new Date(stadium.schedule_start).toISOString().slice(0, 16) : ""
              }
              onChange={(e) => setStadium({ ...stadium, schedule_start: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Heure de Fin</label>
            <Input
              type="datetime-local"
              value={
                stadium.schedule_end ? new Date(stadium.schedule_end).toISOString().slice(0, 16) : ""
              }
              onChange={(e) => setStadium({ ...stadium, schedule_end: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Niveau d'Accès</label>
            <select
              value={stadium.access_level}
              onChange={(e) => setStadium({ ...stadium, access_level: e.target.value })}
              className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
            >
              <option value="public">Public</option>
              <option value="vip">VIP</option>
              <option value="vip_plus">VIP+</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2 flex items-center">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded"
                checked={stadium.is_open}
                onChange={(e) => setStadium({ ...stadium, is_open: e.target.checked })}
              />
              Stade Ouvert
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button
              onClick={handleUpdateStadium}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder le Stade"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
