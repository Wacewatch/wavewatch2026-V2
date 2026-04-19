"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Save, Music, RefreshCw, Plus, Trash2, Volume2 } from 'lucide-react'

interface DiscoData {
  id: string
  name: string
  is_open: boolean
  access_level: string
  current_track_title: string | null
  current_track_artist: string | null
  stream_url: string | null
  stream_urls: string[]
  volume: number
  schedule_start: string | null
  schedule_end: string | null
}

export function DiscoSettingsPanel() {
  const [disco, setDisco] = useState<DiscoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newStreamUrl, setNewStreamUrl] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadDiscoData()
  }, [])

  const loadDiscoData = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("interactive_disco")
      .select("*")
      .single()

    if (error) {
      console.error("Error loading disco data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la discothèque",
        variant: "destructive",
      })
    } else if (data) {
      setDisco({
        ...data,
        stream_urls: data.stream_urls || []
      })
    }
    setIsLoading(false)
  }

  const handleUpdateDisco = async () => {
    if (!disco) return

    setIsSaving(true)

    const { error } = await supabase
      .from("interactive_disco")
      .update({
        name: disco.name,
        is_open: disco.is_open,
        access_level: disco.access_level,
        current_track_title: disco.current_track_title || null,
        current_track_artist: disco.current_track_artist || null,
        stream_url: disco.stream_url || null,
        stream_urls: disco.stream_urls,
        volume: disco.volume,
        schedule_start: disco.schedule_start ? new Date(disco.schedule_start).toISOString() : null,
        schedule_end: disco.schedule_end ? new Date(disco.schedule_end).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", disco.id)

    if (error) {
      console.error("Error saving disco settings:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres de la discothèque",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de la discothèque ont été mis à jour avec succès",
      })
    }

    setIsSaving(false)
  }

  const handleAddStreamUrl = () => {
    if (!disco || !newStreamUrl.trim()) return

    if (!newStreamUrl.startsWith('http://') && !newStreamUrl.startsWith('https://')) {
      toast({
        title: "URL invalide",
        description: "L'URL doit commencer par http:// ou https://",
        variant: "destructive",
      })
      return
    }

    setDisco({
      ...disco,
      stream_urls: [...disco.stream_urls, newStreamUrl.trim()]
    })
    setNewStreamUrl("")
  }

  const handleRemoveStreamUrl = (index: number) => {
    if (!disco) return
    const newUrls = disco.stream_urls.filter((_, i) => i !== index)
    setDisco({ ...disco, stream_urls: newUrls })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des données de la discothèque...</span>
      </div>
    )
  }

  if (!disco) {
    return (
      <div className="text-center text-gray-400 py-8">
        Aucune donnée de discothèque trouvée.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Music className="w-5 h-5" />
          Discothèque
        </h3>
      </div>

      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Nom de la Discothèque</label>
            <Input
              value={disco.name}
              onChange={(e) => setDisco({ ...disco, name: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Titre du Morceau Actuel</label>
            <Input
              value={disco.current_track_title || ""}
              onChange={(e) => setDisco({ ...disco, current_track_title: e.target.value })}
              placeholder="Ex: Electronic Mix"
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Artiste Actuel</label>
            <Input
              value={disco.current_track_artist || ""}
              onChange={(e) => setDisco({ ...disco, current_track_artist: e.target.value })}
              placeholder="Ex: DJ WaveWatch"
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Volume par défaut: {disco.volume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={disco.volume}
              onChange={(e) => setDisco({ ...disco, volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Niveau d'Accès</label>
            <select
              value={disco.access_level}
              onChange={(e) => setDisco({ ...disco, access_level: e.target.value })}
              className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
            >
              <option value="public">Public</option>
              <option value="vip">VIP</option>
              <option value="vip_plus">VIP+</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Heure de Début</label>
            <Input
              type="datetime-local"
              value={
                disco.schedule_start ? new Date(disco.schedule_start).toISOString().slice(0, 16) : ""
              }
              onChange={(e) => setDisco({ ...disco, schedule_start: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Heure de Fin</label>
            <Input
              type="datetime-local"
              value={
                disco.schedule_end ? new Date(disco.schedule_end).toISOString().slice(0, 16) : ""
              }
              onChange={(e) => setDisco({ ...disco, schedule_end: e.target.value })}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>

          <div className="space-y-2 flex items-center">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded"
                checked={disco.is_open}
                onChange={(e) => setDisco({ ...disco, is_open: e.target.checked })}
              />
              Discothèque Ouverte
            </label>
          </div>
        </div>

        {/* Section des URLs de streaming */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
            <Music className="w-4 h-4" />
            URLs de Streaming Audio
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Ajoutez des URLs de streams radio ou audio. Le système essaiera chaque URL dans l'ordre si la précédente échoue.
          </p>

          <div className="space-y-2 mb-4">
            {disco.stream_urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                <Input
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...disco.stream_urls]
                    newUrls[index] = e.target.value
                    setDisco({ ...disco, stream_urls: newUrls })
                  }}
                  className="bg-gray-600 border-gray-500 text-white text-sm flex-1"
                />
                <Button
                  onClick={() => handleRemoveStreamUrl(index)}
                  size="sm"
                  variant="destructive"
                  className="px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newStreamUrl}
              onChange={(e) => setNewStreamUrl(e.target.value)}
              placeholder="https://stream.example.com/audio.mp3"
              className="bg-gray-600 border-gray-500 text-white text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddStreamUrl()
                }
              }}
            />
            <Button
              onClick={handleAddStreamUrl}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleUpdateDisco}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder la Discothèque"}
          </Button>
        </div>
      </div>
    </div>
  )
}
