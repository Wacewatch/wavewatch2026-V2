"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface ChatMessage {
  id?: string
  user_id: string
  username: string
  message: string
  room: string
  created_at?: string
}

interface ChatBubble {
  message: string
  timestamp: number
}

interface UseWorldChatProps {
  userId: string
  username: string
  currentCinemaRoom: { id: string } | null
  enableChat: boolean
}

export function useWorldChat({
  userId,
  username,
  currentCinemaRoom,
  enableChat,
}: UseWorldChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [playerChatBubbles, setPlayerChatBubbles] = useState<Record<string, ChatBubble>>({})

  // Load world messages and subscribe to new ones
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("interactive_chat_messages")
        .select("*")
        .eq("room", "world")
        .order("created_at", { ascending: false })
        .limit(50)

      if (data) setMessages(data.reverse())
    }

    loadMessages()

    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interactive_chat_messages",
          filter: "room=eq.world",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
          setPlayerChatBubbles((prev) => ({
            ...prev,
            [payload.new.user_id]: {
              message: payload.new.message,
              timestamp: Date.now(),
            },
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Load room messages for cinema
  const loadRoomMessages = useCallback(async () => {
    if (!currentCinemaRoom) return
    const { data } = await supabase
      .from("interactive_chat_messages")
      .select("*")
      .eq("room", `cinema_${currentCinemaRoom.id}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) setRoomMessages(data.reverse())
  }, [currentCinemaRoom])

  const handleNewMessage = useCallback((payload: any) => {
    setRoomMessages((prev) => [...prev, payload.new])
    setPlayerChatBubbles((prev) => ({
      ...prev,
      [payload.new.user_id]: {
        message: payload.new.message,
        timestamp: Date.now(),
      },
    }))
  }, [])

  // Subscribe to cinema room messages
  useEffect(() => {
    if (!currentCinemaRoom) return

    loadRoomMessages()

    const channel = supabase
      .channel(`chat_cinema_${currentCinemaRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interactive_chat_messages",
          filter: `room=eq.cinema_${currentCinemaRoom.id}`,
        },
        handleNewMessage,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentCinemaRoom, loadRoomMessages, handleNewMessage])

  // Cleanup expired chat bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setPlayerChatBubbles((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          if (now - updated[key].timestamp > 5000) {
            delete updated[key]
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Send a message
  const sendMessage = useCallback(async () => {
    if (!enableChat || !userId) return

    if (chatInput.trim()) {
      const message = {
        user_id: userId,
        username: username,
        message: chatInput.trim(),
        room: currentCinemaRoom ? `cinema_${currentCinemaRoom.id}` : "world",
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("interactive_chat_messages").insert(message)

      if (error) {
        console.error("[v0] Error sending message:", error)
      } else {
        setPlayerChatBubbles((prev) => ({
          ...prev,
          [userId]: {
            message: chatInput.trim(),
            timestamp: Date.now(),
          },
        }))
      }

      setChatInput("")
    }
  }, [userId, username, chatInput, currentCinemaRoom, enableChat])

  return {
    messages,
    roomMessages,
    chatInput,
    setChatInput,
    playerChatBubbles,
    setPlayerChatBubbles,
    sendMessage,
  }
}
