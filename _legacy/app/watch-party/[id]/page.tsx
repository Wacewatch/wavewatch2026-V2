"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Users,
  Play,
  Pause,
  Copy,
  Send,
  Crown,
  Shield,
  LogOut,
  Trash2,
  Film,
  Tv,
  Clapperboard,
  Radio,
} from "lucide-react"
import Link from "next/link"

const API = process.env.REACT_APP_BACKEND_URL || ""
const TMDB_IMG = "https://image.tmdb.org/t/p"

interface WatchParty {
  _id: string
  room_code: string
  host_id: string
  host_username: string
  title: string
  content_id: number
  content_type: string
  content_title: string
  poster_path: string | null
  max_guests: number
  is_public: boolean
  status: string
  guests: Guest[]
  messages: ChatMessage[]
  current_time: number
  guest_count: number
  created_at: string
}

interface Guest {
  user_id: string
  username: string
  is_vip: boolean
  is_admin: boolean
  joined_at: string
}

interface ChatMessage {
  type: "chat" | "system"
  user_id?: string
  username?: string
  is_vip?: boolean
  is_admin?: boolean
  message: string
  timestamp: string
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "A l'instant"
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export default function WatchPartyRoom() {
  const params = useParams()
  const partyId = params.id as string
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [party, setParty] = useState<WatchParty | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [contentDetails, setContentDetails] = useState<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastTimestamp = useRef<string>("")

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const fetchParty = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/watch-party/${partyId}`, { credentials: "include", headers })
      if (!res.ok) {
        toast({ title: "Erreur", description: "Soiree introuvable", variant: "destructive" })
        router.push("/watch-party")
        return
      }
      const data = await res.json()
      setParty(data.party)
      setMessages(data.party.messages || [])
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger la soiree", variant: "destructive" })
    }
    setLoading(false)
  }, [partyId])

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!party) return
    try {
      const since = lastTimestamp.current || ""
      const url = since
        ? `${API}/api/watch-party/${partyId}/messages?since=${encodeURIComponent(since)}`
        : `${API}/api/watch-party/${partyId}/messages`
      const res = await fetch(url, { credentials: "include", headers })
      const data = await res.json()
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.timestamp + m.message))
          const newMsgs = data.messages.filter((m: ChatMessage) => !existing.has(m.timestamp + m.message))
          return [...prev, ...newMsgs]
        })
        lastTimestamp.current = data.messages[data.messages.length - 1].timestamp
      }
      // Update status
      if (party && data.status !== party.status) {
        setParty((p) => p ? { ...p, status: data.status, current_time: data.current_time } : p)
      }
    } catch {}
  }, [party, partyId])

  // Fetch content details from TMDB
  const fetchContentDetails = useCallback(async () => {
    if (!party) return
    try {
      const endpoint = party.content_type === "movie"
        ? `${API}/api/tmdb/movie/${party.content_id}`
        : `${API}/api/tmdb/tv/${party.content_id}`
      const res = await fetch(endpoint, { credentials: "include" })
      const data = await res.json()
      setContentDetails(data)
    } catch {}
  }, [party?.content_id, party?.content_type])

  useEffect(() => {
    fetchParty()
  }, [fetchParty])

  useEffect(() => {
    if (party) fetchContentDetails()
  }, [party?.content_id, fetchContentDetails])

  // Poll every 3 seconds
  useEffect(() => {
    if (!party) return
    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [party, pollMessages])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`${API}/api/watch-party/${partyId}/message`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
        lastTimestamp.current = data.message.timestamp
      }
      setNewMessage("")
    } catch {}
    setSending(false)
  }

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch(`${API}/api/watch-party/${partyId}/status`, {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify({ status: newStatus }),
      })
      setParty((p) => p ? { ...p, status: newStatus } : p)
    } catch {}
  }

  const leaveParty = async () => {
    try {
      await fetch(`${API}/api/watch-party/${partyId}/leave`, { method: "POST", credentials: "include", headers })
      router.push("/watch-party")
    } catch {}
  }

  const endParty = async () => {
    try {
      await fetch(`${API}/api/watch-party/${partyId}`, { method: "DELETE", credentials: "include", headers })
      router.push("/watch-party")
    } catch {}
  }

  const copyCode = () => {
    if (party) {
      navigator.clipboard.writeText(party.room_code)
      toast({ title: "Code copie !", description: party.room_code })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: "hsl(var(--primary))" }} />
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Chargement de la soiree...</p>
        </div>
      </div>
    )
  }

  if (!party) return null

  const isHost = user?._id === party.host_id
  const isEnded = party.status === "ended"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="container mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/watch-party">
                <ArrowLeft className="w-5 h-5" style={{ color: "hsl(var(--foreground))" }} />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: "hsl(var(--foreground))" }} data-testid="party-title">{party.title}</h1>
              <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <StatusIndicator status={party.status} />
                <span>Hote: {party.host_username}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {party.guests.length + 1}/{party.max_guests}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", backgroundColor: "hsl(var(--card))" }}
              data-testid="copy-room-code"
            >
              <Copy className="w-3.5 h-3.5" />
              {party.room_code}
            </button>
            {!isHost && !isEnded && (
              <Button variant="outline" size="sm" onClick={leaveParty} data-testid="leave-party-btn">
                <LogOut className="w-4 h-4 mr-1" />
                Quitter
              </Button>
            )}
            {isHost && !isEnded && (
              <Button variant="destructive" size="sm" onClick={endParty} data-testid="end-party-btn">
                <Trash2 className="w-4 h-4 mr-1" />
                Terminer
              </Button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Content Area (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video/Content Placeholder */}
            <Card className="overflow-hidden" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <div className="relative aspect-video" style={{ backgroundColor: "#000" }}>
                {party.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w1280${party.poster_path}`}
                    alt={party.content_title}
                    className="w-full h-full object-cover"
                    style={{ filter: party.status === "paused" ? "brightness(0.5)" : "brightness(0.7)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                    <Film className="w-24 h-24" style={{ color: "hsl(var(--muted-foreground))" }} />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {party.status === "waiting" && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <Radio className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-white text-lg font-semibold">En attente du lancement...</p>
                      <p className="text-white/60 text-sm mt-1">L'hote va bientot lancer la lecture</p>
                    </div>
                  )}
                  {party.status === "paused" && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <Pause className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                      <p className="text-white text-lg font-semibold">En pause</p>
                    </div>
                  )}
                  {party.status === "playing" && (
                    <div className="text-center px-4 py-2 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <p className="text-white/80 text-sm">Visionnage en cours</p>
                      <p className="text-white text-xl font-bold">{party.content_title}</p>
                    </div>
                  )}
                  {isEnded && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <Clapperboard className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                      <p className="text-white text-lg font-semibold">Soiree terminee</p>
                      <p className="text-white/60 text-sm mt-1">Merci d'avoir participe !</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Host Controls */}
              {isHost && !isEnded && (
                <div className="flex items-center justify-center gap-3 p-3" style={{ backgroundColor: "hsl(var(--card))" }}>
                  {party.status === "waiting" && (
                    <Button onClick={() => updateStatus("playing")} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="play-btn">
                      <Play className="w-4 h-4 mr-2" />
                      Lancer la lecture
                    </Button>
                  )}
                  {party.status === "playing" && (
                    <Button onClick={() => updateStatus("paused")} className="bg-sky-600 hover:bg-sky-700 text-white" data-testid="pause-btn">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {party.status === "paused" && (
                    <Button onClick={() => updateStatus("playing")} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="resume-btn">
                      <Play className="w-4 h-4 mr-2" />
                      Reprendre
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Content Info */}
            {contentDetails && (
              <Card style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {party.poster_path && (
                      <img
                        src={`${TMDB_IMG}/w185${party.poster_path}`}
                        alt={party.content_title}
                        className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1" style={{ color: "hsl(var(--foreground))" }}>
                        {contentDetails.title || contentDetails.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}>
                          {party.content_type === "movie" ? "Film" : "Serie"}
                        </Badge>
                        {contentDetails.vote_average && (
                          <Badge className="bg-amber-600/80 text-amber-100">
                            {contentDetails.vote_average.toFixed(1)}
                          </Badge>
                        )}
                        {contentDetails.release_date && (
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {contentDetails.release_date.slice(0, 4)}
                          </span>
                        )}
                        {contentDetails.first_air_date && (
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {contentDetails.first_air_date.slice(0, 4)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {contentDetails.overview}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Guests + Chat (1/3) */}
          <div className="space-y-4">
            {/* Guest List */}
            <Card style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
                  <Users className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  Participants ({party.guests.length + 1})
                </h3>
                <div className="space-y-2">
                  {/* Host */}
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                      {party.host_username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{party.host_username}</p>
                    </div>
                    <Badge className="bg-amber-600/80 text-amber-100 text-xs">Hote</Badge>
                  </div>
                  {/* Guests */}
                  {party.guests.map((guest) => (
                    <div key={guest.user_id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        {guest.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>{guest.username}</p>
                      </div>
                      {guest.is_admin && <Shield className="w-3.5 h-3.5 text-red-400" />}
                      {guest.is_vip && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                  ))}
                  {party.guests.length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      En attente d'invites...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", height: "calc(100vh - 380px)", minHeight: "350px" }}>
              <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--border))" }}>
                <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>Chat</h3>
                <Badge variant="outline" className="text-xs">{messages.length}</Badge>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} isMe={msg.user_id === user?._id} />
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              {user && !isEnded && (
                <div className="p-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Envoyer un message..."
                      maxLength={500}
                      className="flex-1 h-9"
                      style={{ backgroundColor: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                      data-testid="chat-input"
                    />
                    <Button type="submit" size="sm" disabled={sending || !newMessage.trim()} className="h-9" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }} data-testid="send-message-btn">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    waiting: { color: "#f59e0b", label: "En attente" },
    playing: { color: "#10b981", label: "En lecture" },
    paused: { color: "#0ea5e9", label: "En pause" },
    ended: { color: "#71717a", label: "Terminee" },
  }
  const c = config[status] || config.waiting
  return (
    <span className="flex items-center gap-1 text-xs" data-testid="party-status">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color, boxShadow: status === "playing" ? `0 0 6px ${c.color}` : "none" }} />
      {c.label}
    </span>
  )
}

function ChatBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  if (msg.type === "system") {
    return (
      <div className="text-center py-1">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))" }}>
          {msg.message}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} data-testid="chat-message">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs font-medium" style={{ color: isMe ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
          {msg.username}
        </span>
        {msg.is_admin && <Shield className="w-3 h-3 text-red-400" />}
        {msg.is_vip && <Crown className="w-3 h-3 text-yellow-400" />}
        <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          {timeAgo(msg.timestamp)}
        </span>
      </div>
      <div
        className="max-w-[85%] px-3 py-1.5 rounded-xl text-sm"
        style={{
          backgroundColor: isMe ? "hsl(var(--primary))" : "hsl(var(--muted))",
          color: isMe ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        }}
      >
        {msg.message}
      </div>
    </div>
  )
}
