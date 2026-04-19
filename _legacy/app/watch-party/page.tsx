"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Users,
  Play,
  Clock,
  Search,
  Film,
  Tv,
  Crown,
  Shield,
  DoorOpen,
  Copy,
  PartyPopper,
  Popcorn,
  Clapperboard,
} from "lucide-react"

const API = process.env.REACT_APP_BACKEND_URL || ""

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
  guest_count: number
  created_at: string
  scheduled_at: string | null
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "A l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    waiting: { label: "En attente", className: "bg-amber-600/80 text-amber-100" },
    playing: { label: "En lecture", className: "bg-emerald-600/80 text-emerald-100 animate-pulse" },
    paused: { label: "En pause", className: "bg-sky-600/80 text-sky-100" },
    ended: { label: "Terminee", className: "bg-zinc-600/80 text-zinc-300" },
  }
  const c = config[status] || config.waiting
  return <Badge className={c.className} data-testid={`status-badge-${status}`}>{c.label}</Badge>
}

export default function WatchPartyPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [parties, setParties] = useState<WatchParty[]>([])
  const [myHosted, setMyHosted] = useState<WatchParty[]>([])
  const [myJoined, setMyJoined] = useState<WatchParty[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState("")

  // Create party state
  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [maxGuests, setMaxGuests] = useState(10)
  const [creating, setCreating] = useState(false)

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const fetchParties = async () => {
    try {
      const res = await fetch(`${API}/api/watch-party`, { credentials: "include", headers })
      const data = await res.json()
      setParties(data.parties || [])
    } catch {}
  }

  const fetchMyParties = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/watch-party/my`, { credentials: "include", headers })
      const data = await res.json()
      setMyHosted(data.hosted || [])
      setMyJoined(data.joined || [])
    } catch {}
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchParties()
      if (user) await fetchMyParties()
      setLoading(false)
    }
    load()
    const interval = setInterval(() => {
      fetchParties()
      if (user) fetchMyParties()
    }, 15000)
    return () => clearInterval(interval)
  }, [user])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await fetch(`${API}/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" })
      const data = await res.json()
      const items = (data.results || []).filter((r: any) => r.media_type === "movie" || r.media_type === "tv").slice(0, 8)
      setSearchResults(items)
    } catch {}
  }

  const handleCreate = async () => {
    if (!selectedContent || !createTitle.trim()) {
      toast({ title: "Erreur", description: "Choisissez un contenu et donnez un titre", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/watch-party`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          title: createTitle,
          content_id: selectedContent.id,
          content_type: selectedContent.media_type,
          content_title: selectedContent.title || selectedContent.name,
          poster_path: selectedContent.poster_path,
          max_guests: maxGuests,
          is_public: isPublic,
        }),
      })
      const data = await res.json()
      if (data.party) {
        toast({ title: "Soiree creee !", description: `Code: ${data.party.room_code}` })
        setShowCreate(false)
        setCreateTitle("")
        setSelectedContent(null)
        setSearchQuery("")
        setSearchResults([])
        router.push(`/watch-party/${data.party._id}`)
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de creer la soiree", variant: "destructive" })
    }
    setCreating(false)
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    try {
      const res = await fetch(`${API}/api/watch-party/${joinCode.trim().toUpperCase()}`, { credentials: "include", headers })
      const data = await res.json()
      if (data.party) {
        // Join the party
        await fetch(`${API}/api/watch-party/${data.party._id}/join`, {
          method: "POST",
          credentials: "include",
          headers,
        })
        router.push(`/watch-party/${data.party._id}`)
      } else {
        toast({ title: "Introuvable", description: "Aucune soiree trouvee avec ce code", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur", description: "Code invalide", variant: "destructive" })
    }
  }

  const handleJoinParty = async (partyId: string) => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      await fetch(`${API}/api/watch-party/${partyId}/join`, { method: "POST", credentials: "include", headers })
      router.push(`/watch-party/${partyId}`)
    } catch {}
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Code copie !", description: code })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl mb-10 p-8 md:p-12" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--card) / 0.8))" }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E\")" }} />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clapperboard className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Soiree Cine</h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">NEW</Badge>
              </div>
              <p className="text-lg max-w-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
                Regardez des films et series ensemble en temps reel avec vos amis !
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Join by code */}
              <div className="flex gap-2">
                <Input
                  placeholder="Code ex: A1B2C3D4"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-40 uppercase font-mono"
                  style={{ backgroundColor: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  data-testid="join-code-input"
                />
                <Button onClick={handleJoinByCode} disabled={!user || !joinCode.trim()} style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }} data-testid="join-by-code-btn">
                  <DoorOpen className="w-4 h-4 mr-1" />
                  Rejoindre
                </Button>
              </div>
              {user && (
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" data-testid="create-party-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Creer une Soiree
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                    <DialogHeader>
                      <DialogTitle style={{ color: "hsl(var(--foreground))" }}>Nouvelle Soiree Cine</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label style={{ color: "hsl(var(--foreground))" }}>Titre de la soiree</Label>
                        <Input
                          value={createTitle}
                          onChange={(e) => setCreateTitle(e.target.value)}
                          placeholder="ex: Soiree Marvel avec les potes"
                          style={{ backgroundColor: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                          data-testid="party-title-input"
                        />
                      </div>
                      <div>
                        <Label style={{ color: "hsl(var(--foreground))" }}>Choisir un film ou une serie</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Rechercher..."
                            style={{ backgroundColor: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                            data-testid="search-content-input"
                          />
                          <Button onClick={handleSearch} variant="outline" data-testid="search-content-btn">
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                            {searchResults.map((r: any) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setSelectedContent(r)
                                  setSearchResults([])
                                  if (!createTitle) setCreateTitle(`Soiree ${r.title || r.name}`)
                                }}
                                className="flex items-center gap-3 w-full p-2 hover:opacity-80 transition-opacity text-left"
                                style={{ backgroundColor: selectedContent?.id === r.id ? "hsl(var(--primary) / 0.2)" : "transparent" }}
                                data-testid={`search-result-${r.id}`}
                              >
                                {r.poster_path ? (
                                  <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" />
                                ) : (
                                  <div className="w-10 h-14 rounded flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                                    {r.media_type === "movie" ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{r.title || r.name}</p>
                                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    {r.media_type === "movie" ? "Film" : "Serie"} {r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4) || ""}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedContent && (
                          <div className="mt-2 flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
                            {selectedContent.poster_path && (
                              <img src={`https://image.tmdb.org/t/p/w92${selectedContent.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" />
                            )}
                            <div>
                              <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{selectedContent.title || selectedContent.name}</p>
                              <p className="text-xs" style={{ color: "hsl(var(--primary))" }}>Selectionne</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label style={{ color: "hsl(var(--foreground))" }}>Soiree publique</Label>
                          <Switch checked={isPublic} onCheckedChange={setIsPublic} data-testid="public-switch" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label style={{ color: "hsl(var(--foreground))" }}>Max invites</Label>
                          <Input
                            type="number"
                            min={2}
                            max={50}
                            value={maxGuests}
                            onChange={(e) => setMaxGuests(parseInt(e.target.value) || 10)}
                            className="w-16"
                            style={{ backgroundColor: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                            data-testid="max-guests-input"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreate} disabled={creating || !selectedContent || !createTitle.trim()} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" data-testid="confirm-create-btn">
                        {creating ? "Creation..." : "Lancer la Soiree"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* My Parties */}
        {user && (myHosted.length > 0 || myJoined.length > 0) && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
              <Popcorn className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              Mes Soirees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...myHosted, ...myJoined].map((party) => (
                <PartyCard key={party._id} party={party} userId={user._id} onJoin={() => router.push(`/watch-party/${party._id}`)} onCopy={copyCode} />
              ))}
            </div>
          </div>
        )}

        {/* Public Parties */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <PartyPopper className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            Soirees Publiques
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                  <CardContent className="p-6">
                    <div className="h-40 rounded animate-pulse" style={{ backgroundColor: "hsl(var(--muted))" }} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : parties.length === 0 ? (
            <Card style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <CardContent className="py-12 text-center">
                <Clapperboard className="w-16 h-16 mx-auto mb-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                <p className="text-lg font-medium mb-2" style={{ color: "hsl(var(--foreground))" }}>Aucune soiree en cours</p>
                <p style={{ color: "hsl(var(--muted-foreground))" }}>Soyez le premier a en creer une !</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parties.map((party) => (
                <PartyCard key={party._id} party={party} userId={user?._id} onJoin={() => handleJoinParty(party._id)} onCopy={copyCode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PartyCard({
  party,
  userId,
  onJoin,
  onCopy,
}: {
  party: WatchParty
  userId?: string
  onJoin: () => void
  onCopy: (code: string) => void
}) {
  const isHost = userId === party.host_id

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
      style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      onClick={onJoin}
      data-testid={`party-card-${party._id}`}
    >
      <div className="relative h-32 overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
        {party.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${party.poster_path}`}
            alt={party.content_title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ filter: "brightness(0.6)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1">
          <StatusBadge status={party.status} />
          {isHost && <Badge className="bg-amber-600/80 text-amber-100">Hote</Badge>}
        </div>
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy(party.room_code)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
            data-testid={`copy-code-${party.room_code}`}
          >
            <Copy className="w-3 h-3" />
            {party.room_code}
          </button>
        </div>
        <div className="absolute bottom-2 left-3">
          <p className="text-white text-sm font-medium truncate max-w-[200px]">{party.content_title}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-2 truncate" style={{ color: "hsl(var(--foreground))" }}>{party.title}</h3>
        <div className="flex items-center justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {party.guest_count}/{party.max_guests}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(party.created_at)}
            </span>
          </div>
          <span className="flex items-center gap-1">
            {party.host_username}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
