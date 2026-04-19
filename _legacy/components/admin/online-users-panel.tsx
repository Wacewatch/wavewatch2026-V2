"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Crown, Star, Shield, MapPin, Users, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface OnlineUser {
  id: string
  user_id: string
  username: string
  position_x: number
  position_y: number
  position_z: number
  current_room: string
  last_seen: string
  is_vip?: boolean
  is_vip_plus?: boolean
  is_admin?: boolean
}

export function OnlineUsersPanel({ users }: { users: any[] }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()

    // Subscribe to presence changes
    const channel = supabase.channel("online-users-admin")

    channel
      .on("presence", { event: "sync" }, () => {
        loadUsers()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)

    // Calculate 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // First get interactive profiles that are online AND were seen recently
    const { data: profiles, error } = await supabase
      .from("interactive_profiles")
      .select("*")
      .eq("is_online", true)
      .gte("last_seen", twoMinutesAgo)

    if (error) {
      console.error("Error loading online users:", error)
      setIsLoading(false)
      return
    }

    if (!profiles || profiles.length === 0) {
      setOnlineUsers([])
      setIsLoading(false)
      return
    }

    // Get user_ids that exist
    const userIds = profiles.map(p => p.user_id).filter(Boolean)

    // Fetch user profiles separately
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("id, username, is_vip, is_vip_plus, is_admin")
      .in("id", userIds)

    // Merge the data
    const mergedUsers = profiles.map(profile => {
      const userProfile = userProfiles?.find(up => up.id === profile.user_id)
      return {
        ...profile,
        username: userProfile?.username || profile.username || "Anonyme",
        is_vip: userProfile?.is_vip || false,
        is_vip_plus: userProfile?.is_vip_plus || false,
        is_admin: userProfile?.is_admin || false,
      }
    })

    setOnlineUsers(mergedUsers)
    setIsLoading(false)
  }

  const getRoleIcon = (user: OnlineUser) => {
    if (user.is_admin) return <Shield className="w-4 h-4 text-red-500" />
    if (user.is_vip_plus) return <Crown className="w-4 h-4 text-purple-500" />
    if (user.is_vip) return <Star className="w-4 h-4 text-yellow-500" />
    return null
  }

  const getRoleBadge = (user: OnlineUser) => {
    if (user.is_admin) return <Badge className="bg-red-600">Admin</Badge>
    if (user.is_vip_plus) return <Badge className="bg-purple-600">VIP+</Badge>
    if (user.is_vip) return <Badge className="bg-yellow-600">VIP</Badge>
    return <Badge className="bg-gray-600">Membre</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des utilisateurs en ligne...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Utilisateurs En Ligne: {onlineUsers.length}
        </h3>
        <Button size="sm" variant="outline" onClick={loadUsers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {onlineUsers.map((user) => (
          <div key={user.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-4">
            <Avatar className="bg-gray-600">
              <AvatarFallback className="bg-gray-600 text-white">
                {user.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {getRoleIcon(user)}
                <span className="font-medium text-white">{user.username}</span>
                {getRoleBadge(user)}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{user.current_room || "Ville"}</span>
                <span>•</span>
                <span>
                  Position: ({user.position_x?.toFixed(1)}, {user.position_z?.toFixed(1)})
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {user.last_seen ? new Date(user.last_seen).toLocaleTimeString() : "-"}
            </div>
          </div>
        ))}

        {onlineUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Aucun utilisateur en ligne actuellement
          </div>
        )}
      </div>
    </div>
  )
}
