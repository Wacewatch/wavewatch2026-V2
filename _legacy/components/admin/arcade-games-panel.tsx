"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, Eye, EyeOff, Gamepad2 } from 'lucide-react'

interface ArcadeGame {
  id: number
  name: string
  url: string
  image_url: string | null
  media_type: 'image' | 'video'
  open_in_new_tab: boolean
  use_proxy: boolean
  is_active: boolean
  display_order: number
}

interface ArcadeGameForm {
  name: string
  url: string
  image_url: string
  media_type: string
  open_in_new_tab: boolean
  use_proxy: boolean
}

interface ArcadeGamesPanelProps {
  games: ArcadeGame[]
}

export function ArcadeGamesPanel({ games: initialGames }: ArcadeGamesPanelProps) {
  const [arcadeMachines, setArcadeMachines] = useState<ArcadeGame[]>(initialGames)
  const [showAddArcadeGame, setShowAddArcadeGame] = useState(false)
  const [editingArcadeGame, setEditingArcadeGame] = useState<ArcadeGame | null>(null)
  const [arcadeGameForm, setArcadeGameForm] = useState<ArcadeGameForm>({
    name: '',
    url: '',
    image_url: '',
    media_type: 'image',
    open_in_new_tab: false,
    use_proxy: false,
  })

  const supabase = createClient()

  const handleAddArcadeGame = async () => {
    if (!arcadeGameForm.name || !arcadeGameForm.url) return

    const maxOrder = arcadeMachines.length > 0
      ? Math.max(...arcadeMachines.map(g => g.display_order))
      : 0

    const { data, error } = await supabase
      .from('arcade_games')
      .insert({
        name: arcadeGameForm.name,
        url: arcadeGameForm.url,
        image_url: arcadeGameForm.image_url || null,
        media_type: arcadeGameForm.media_type,
        open_in_new_tab: arcadeGameForm.open_in_new_tab,
        use_proxy: arcadeGameForm.use_proxy,
        display_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding game:', error)
      return
    }

    setArcadeMachines([...arcadeMachines, data])
    setShowAddArcadeGame(false)
    setArcadeGameForm({ name: '', url: '', image_url: '', media_type: 'image', open_in_new_tab: false, use_proxy: false })
  }

  const handleUpdateArcadeGame = async () => {
    if (!editingArcadeGame || !arcadeGameForm.name || !arcadeGameForm.url) return

    const { data, error } = await supabase
      .from('arcade_games')
      .update({
        name: arcadeGameForm.name,
        url: arcadeGameForm.url,
        image_url: arcadeGameForm.image_url || null,
        media_type: arcadeGameForm.media_type,
        open_in_new_tab: arcadeGameForm.open_in_new_tab,
        use_proxy: arcadeGameForm.use_proxy,
      })
      .eq('id', editingArcadeGame.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating game:', error)
      return
    }

    setArcadeMachines(arcadeMachines.map(g => g.id === editingArcadeGame.id ? data : g))
    setEditingArcadeGame(null)
    setArcadeGameForm({ name: '', url: '', image_url: '', media_type: 'image', open_in_new_tab: false, use_proxy: false })
  }

  const handleToggleArcadeGame = async (game: ArcadeGame) => {
    const { error } = await supabase
      .from('arcade_games')
      .update({ is_active: !game.is_active })
      .eq('id', game.id)

    if (error) {
      console.error('Error toggling game:', error)
      return
    }

    setArcadeMachines(arcadeMachines.map(g => g.id === game.id ? { ...g, is_active: !g.is_active } : g))
  }

  const handleDeleteArcadeGame = async (id: number) => {
    if (!confirm('Supprimer ce jeu ?')) return

    const { error } = await supabase
      .from('arcade_games')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting game:', error)
      return
    }

    setArcadeMachines(arcadeMachines.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Machines d'Arcade
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {arcadeMachines.length} jeux - {arcadeMachines.filter(g => g.is_active).length} actifs
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowAddArcadeGame(true)
              setArcadeGameForm({ name: '', url: '', image_url: '', media_type: 'image', open_in_new_tab: false, use_proxy: false })
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddArcadeGame && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-white">Nouveau jeu d'arcade</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Nom *</label>
              <Input
                value={arcadeGameForm.name}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, name: e.target.value })}
                placeholder="Ex: Pac-Man"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">URL du jeu *</label>
              <Input
                value={arcadeGameForm.url}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">URL de l'image</label>
              <Input
                value={arcadeGameForm.image_url}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, image_url: e.target.value })}
                placeholder="/arcade/game.png"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Type de média</label>
              <select
                value={arcadeGameForm.media_type}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, media_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={arcadeGameForm.open_in_new_tab}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, open_in_new_tab: e.target.checked })}
              />
              Ouvrir dans un nouvel onglet
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={arcadeGameForm.use_proxy}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, use_proxy: e.target.checked })}
              />
              Utiliser le proxy
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddArcadeGame(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleAddArcadeGame} disabled={!arcadeGameForm.name || !arcadeGameForm.url}>
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {/* Formulaire d'édition */}
      {editingArcadeGame && (
        <div className="bg-gray-800 border border-yellow-600 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-yellow-400">Modifier: {editingArcadeGame.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Nom *</label>
              <Input
                value={arcadeGameForm.name}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, name: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">URL du jeu *</label>
              <Input
                value={arcadeGameForm.url}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, url: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">URL de l'image</label>
              <Input
                value={arcadeGameForm.image_url}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, image_url: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Type de média</label>
              <select
                value={arcadeGameForm.media_type}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, media_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={arcadeGameForm.open_in_new_tab}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, open_in_new_tab: e.target.checked })}
              />
              Ouvrir dans un nouvel onglet
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={arcadeGameForm.use_proxy}
                onChange={(e) => setArcadeGameForm({ ...arcadeGameForm, use_proxy: e.target.checked })}
              />
              Utiliser le proxy
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingArcadeGame(null)
                setArcadeGameForm({ name: '', url: '', image_url: '', media_type: 'image', open_in_new_tab: false, use_proxy: false })
              }}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleUpdateArcadeGame} disabled={!arcadeGameForm.name || !arcadeGameForm.url}>
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Liste des jeux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
        {arcadeMachines.map((machine) => (
          <div
            key={machine.id}
            className={`bg-gray-700 p-3 rounded-lg border ${machine.is_active ? 'border-gray-600' : 'border-gray-700 opacity-60'}`}
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-white">{machine.name}</div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleToggleArcadeGame(machine)}
                  title={machine.is_active ? 'Désactiver' : 'Activer'}
                >
                  {machine.is_active
                    ? <Eye className="w-3 h-3 text-green-400" />
                    : <EyeOff className="w-3 h-3 text-red-400" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setEditingArcadeGame(machine)
                    setArcadeGameForm({
                      name: machine.name,
                      url: machine.url,
                      image_url: machine.image_url || '',
                      media_type: machine.media_type || 'image',
                      open_in_new_tab: machine.open_in_new_tab,
                      use_proxy: machine.use_proxy
                    })
                  }}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  onClick={() => handleDeleteArcadeGame(machine.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1 truncate" title={machine.url}>
              {machine.url}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded ${machine.is_active ? "bg-green-600/50 text-green-200" : "bg-gray-600 text-gray-400"}`}>
                {machine.is_active ? "Actif" : "Inactif"}
              </span>
              {machine.open_in_new_tab && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-600/50 text-blue-200">
                  Nouvel onglet
                </span>
              )}
            </div>
          </div>
        ))}
        {arcadeMachines.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-8">
            Aucun jeu configuré. Cliquez sur "Ajouter" pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}
