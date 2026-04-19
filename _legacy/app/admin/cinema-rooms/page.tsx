"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Users } from 'lucide-react'

interface CinemaRoom {
  id: string
  room_number: number
  name: string
  capacity: number
  theme: string
  movie_tmdb_id: number | null
  movie_title: string | null
  movie_poster: string | null
  schedule_start: string | null
  schedule_end: string | null
  is_open: boolean
  access_level: string
}

export default function CinemaRoomsAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<CinemaRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingRoom, setEditingRoom] = useState<CinemaRoom | null>(null)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Cette page est réservée aux administrateurs.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    if (user && user.isAdmin) {
      loadRooms()
    }
  }, [user, router, toast])

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from("interactive_cinema_rooms")
      .select("*")
      .order("room_number", { ascending: true })

    if (error) {
      console.error("Error loading rooms:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les salles",
        variant: "destructive",
      })
      return
    }

    setRooms(data || [])
    setIsLoading(false)
  }

  const handleSaveRoom = async (roomData: Partial<CinemaRoom>) => {
    if (editingRoom) {
      // Update existing room
      const { error } = await supabase
        .from("interactive_cinema_rooms")
        .update(roomData)
        .eq("id", editingRoom.id)

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la salle",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Salle mise à jour",
        description: "La salle a été mise à jour avec succès",
      })
    } else {
      // Create new room
      const { data: newRoom, error } = await supabase
        .from("interactive_cinema_rooms")
        .insert(roomData)
        .select()
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la salle",
          variant: "destructive",
        })
        return
      }

      // Generate seats for new room
      if (newRoom && roomData.capacity) {
        const { error: seatsError } = await supabase.rpc("generate_cinema_seats", {
          room_uuid: newRoom.id,
          total_capacity: roomData.capacity,
        })

        if (seatsError) {
          console.error("Error generating seats:", seatsError)
        }
      }

      toast({
        title: "Salle créée",
        description: "La salle a été créée avec succès",
      })
    }

    loadRooms()
    setShowForm(false)
    setEditingRoom(null)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
      return
    }

    const { error } = await supabase.from("interactive_cinema_rooms").delete().eq("id", roomId)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Salle supprimée",
      description: "La salle a été supprimée avec succès",
    })

    loadRooms()
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
          <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestion des Salles de Cinéma</h1>
        <Button
          onClick={() => {
            setEditingRoom(null)
            setShowForm(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Salle
        </Button>
      </div>

      {showForm && <RoomForm room={editingRoom} onSave={handleSaveRoom} onCancel={() => setShowForm(false)} />}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {rooms.map((room) => (
          <Card key={room.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Salle {room.room_number}</h3>
                <p className="text-sm text-muted-foreground">{room.name}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingRoom(room)
                    setShowForm(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDeleteRoom(room.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Capacité: {room.capacity} places</span>
              </div>
              <div>
                <span className="font-medium">Thème:</span> {room.theme}
              </div>
              <div>
                <span className="font-medium">Accès:</span> {room.access_level}
              </div>
              <div>
                <span className="font-medium">Statut:</span>{" "}
                <span className={room.is_open ? "text-green-500" : "text-red-500"}>
                  {room.is_open ? "Ouverte" : "Fermée"}
                </span>
              </div>
              {room.movie_title && (
                <div>
                  <span className="font-medium">Film:</span> {room.movie_title}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RoomForm({
  room,
  onSave,
  onCancel,
}: {
  room: CinemaRoom | null
  onSave: (data: Partial<CinemaRoom>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    room_number: room?.room_number || 0,
    name: room?.name || "",
    capacity: room?.capacity || 50,
    theme: room?.theme || "default",
    access_level: room?.access_level || "all",
    is_open: room?.is_open || false,
    movie_title: room?.movie_title || "",
  })

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">{room ? "Modifier la Salle" : "Nouvelle Salle"}</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="room_number">Numéro de Salle</Label>
          <Input
            id="room_number"
            type="number"
            value={formData.room_number}
            onChange={(e) => setFormData({ ...formData, room_number: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nom de la Salle</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité (places)</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Thème</Label>
          <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Par défaut</SelectItem>
              <SelectItem value="luxury">Luxe</SelectItem>
              <SelectItem value="imax">IMAX</SelectItem>
              <SelectItem value="vintage">Vintage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access_level">Niveau d'Accès</Label>
          <Select
            value={formData.access_level}
            onValueChange={(value) => setFormData({ ...formData, access_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="vip_plus">VIP Plus</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="movie_title">Titre du Film (optionnel)</Label>
          <Input
            id="movie_title"
            value={formData.movie_title}
            onChange={(e) => setFormData({ ...formData, movie_title: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_open"
            checked={formData.is_open}
            onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
          />
          <Label htmlFor="is_open">Salle Ouverte</Label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={() => onSave(formData)}>Sauvegarder</Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </Card>
  )
}
