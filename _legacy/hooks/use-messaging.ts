"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject?: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  sender_username?: string
  recipient_username?: string
}

interface UserProfile {
  id: string
  username: string
  email: string
  allow_messages: boolean
}

export function useMessaging() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [sentMessages, setSentMessages] = useState<Message[]>([])
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadMessages()
      loadSentMessages()
      loadBlockedUsers()
      loadUnreadCount()
    }
  }, [user?.id])

  const loadMessages = async () => {
    if (!user?.id) return

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("user_messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Error loading messages:", messagesError)
        return
      }

      const senderIds = [...new Set(messagesData?.map((msg) => msg.sender_id) || [])]
      
      if (senderIds.length === 0) {
        setMessages([])
        return
      }

      const { data: sendersData, error: sendersError } = await supabase
        .from("user_profiles")
        .select("id, username")
        .in("id", senderIds)

      if (sendersError) {
        console.error("Error loading senders:", sendersError)
        return
      }

      const sendersMap = new Map(sendersData?.map((sender) => [sender.id, sender.username]) || [])

      const messagesWithUsernames =
        messagesData?.map((msg) => ({
          ...msg,
          sender_username: sendersMap.get(msg.sender_id) || "Utilisateur inconnu",
        })) || []

      setMessages(messagesWithUsernames)
    } catch (error) {
      console.error("Error loading messages:", error)
      setMessages([])
    }
  }

  const loadSentMessages = async () => {
    if (!user?.id) return

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("user_messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Error loading sent messages:", messagesError)
        return
      }

      const recipientIds = [...new Set(messagesData?.map((msg) => msg.recipient_id) || [])]
      
      if (recipientIds.length === 0) {
        setSentMessages([])
        return
      }

      const { data: recipientsData, error: recipientsError } = await supabase
        .from("user_profiles")
        .select("id, username")
        .in("id", recipientIds)

      if (recipientsError) {
        console.error("Error loading recipients:", recipientsError)
        return
      }

      const recipientsMap = new Map(recipientsData?.map((recipient) => [recipient.id, recipient.username]) || [])

      const messagesWithUsernames =
        messagesData?.map((msg) => ({
          ...msg,
          recipient_username: recipientsMap.get(msg.recipient_id) || "Utilisateur inconnu",
        })) || []

      setSentMessages(messagesWithUsernames)
    } catch (error) {
      console.error("Error loading sent messages:", error)
      setSentMessages([])
    }
  }

  const loadBlockedUsers = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id)

      if (error) {
        console.error("Error loading blocked users:", error)
        return
      }

      setBlockedUsers(data?.map((b) => b.blocked_id) || [])
    } catch (error) {
      console.error("Error loading blocked users:", error)
      setBlockedUsers([])
    }
  }

  const loadUnreadCount = async () => {
    if (!user?.id) return

    try {
      const { count, error } = await supabase
        .from("user_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      setUnreadCount(count || 0)
    } catch (error) {
      console.error("Error loading unread count:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (recipientId: string, subject: string, content: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.from("user_messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject: subject.trim() || null,
        content: content.trim(),
      })

      if (error) throw error

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      })

      await loadSentMessages()
      return true
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
      return false
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .eq("recipient_id", user.id)

      if (error) throw error

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg)))

      await loadUnreadCount()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const blockUser = async (userId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: userId,
      })

      if (error) throw error

      setBlockedUsers((prev) => [...prev, userId])
      toast({
        title: "Utilisateur bloqué",
        description: "Cet utilisateur ne pourra plus vous envoyer de messages",
      })

      return true
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de bloquer cet utilisateur",
        variant: "destructive",
      })
      return false
    }
  }

  const unblockUser = async (userId: string) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", userId)

      if (error) throw error

      setBlockedUsers((prev) => prev.filter((id) => id !== userId))
      toast({
        title: "Utilisateur débloqué",
        description: "Cet utilisateur peut maintenant vous envoyer des messages",
      })

      return true
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de débloquer cet utilisateur",
        variant: "destructive",
      })
      return false
    }
  }

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query.trim() || query.length < 2) return []

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, email, allow_messages")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .neq("id", user?.id || "")
        .limit(10)

      if (error) throw error

      // Filter for users who allow messages (default to true if column doesn't exist yet)
      return (data || []).filter((u) => u.allow_messages !== false)
    } catch (error) {
      console.error("Error searching users:", error)
      return []
    }
  }

  const updateMessagePreferences = async (allowMessages: boolean) => {
    if (!user?.id) {
      console.error("[v0] No user ID for updating message preferences")
      return false
    }

    try {
      console.log("[v0] Updating message preferences for user:", user.id, "to:", allowMessages)

      const { error } = await supabase.from("user_profiles").update({ allow_messages: allowMessages }).eq("id", user.id)

      if (error) {
        console.error("[v0] Error updating message preferences:", error)
        throw error
      }

      console.log("[v0] Message preferences updated successfully")

      toast({
        title: "Préférences mises à jour",
        description: allowMessages
          ? "Vous pouvez maintenant recevoir des messages"
          : "Vous ne recevrez plus de nouveaux messages",
      })

      return true
    } catch (error) {
      console.error("[v0] Error updating preferences:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos préférences",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user?.id) return false

    try {
      console.log("[v0] Attempting to delete message:", messageId, "for user:", user.id)

      const { data: messageCheck, error: checkError } = await supabase
        .from("user_messages")
        .select("id, recipient_id")
        .eq("id", messageId)
        .eq("recipient_id", user.id)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking message:", checkError)
        throw checkError
      }

      if (!messageCheck) {
        console.log("[v0] Message not found or not owned by user")
        toast({
          title: "Erreur",
          description: "Message introuvable ou vous n'avez pas les permissions",
          variant: "destructive",
        })
        return false
      }

      const { error: deleteError } = await supabase
        .from("user_messages")
        .delete()
        .eq("id", messageId)
        .eq("recipient_id", user.id)

      if (deleteError) {
        console.error("[v0] Supabase error deleting message:", deleteError)
        throw deleteError
      }

      console.log("[v0] Message deleted successfully")

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== messageId)
        console.log("[v0] Messages after deletion:", filtered.length)
        return filtered
      })

      await loadMessages()

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      })

      await loadUnreadCount()
      return true
    } catch (error) {
      console.error("[v0] Error deleting message:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message. Vérifiez vos permissions.",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    messages,
    sentMessages,
    blockedUsers,
    unreadCount,
    loading,
    sendMessage,
    markAsRead,
    deleteMessage,
    blockUser,
    unblockUser,
    searchUsers,
    updateMessagePreferences,
    refreshMessages: loadMessages,
    refreshUnreadCount: loadUnreadCount,
  }
}
