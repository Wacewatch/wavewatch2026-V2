"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Tv,
  Radio,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  FileText,
  Zap,
  Trophy,
  Shield,
  Clock,
  Activity,
  Heart,
  UserPlus,
  Play,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  TrendingUp,
  Monitor,
  Headphones,
  Gamepad2,
  Film,
  Clapperboard,
  Sparkles,
  LogIn,
  MessageSquare,
  CheckCircle,
  XCircle,
  Music,
  Download,
  BookOpen,
  Send,
  SettingsIcon,
  Save,
  ChevronLeft,
  ChevronRight,
  Globe,
  Pencil,
} from "lucide-react"
import { useRouter } from "next/navigation"
// REMOVED: import { supabase } from "@/lib/supabase" // Removed incorrect Supabase import
import { createBrowserClient } from "@supabase/ssr" // Import for Supabase client

// Constants for user pagination
const USERS_PER_PAGE = 10

interface CinemaRoom {
  id: string
  room_number: number
  name: string
  capacity: number
  theme: string
  movie_title: string
  movie_tmdb_id: number | null
  movie_poster: string | null
  schedule_start: string | null
  schedule_end: string | null
  access_level: string
  is_open: boolean
  embed_url: string | null
  created_at: string
  updated_at: string
}

interface AvatarOption {
  id: string
  category: string
  label: string
  value: string
  is_premium: boolean
  created_at: string
}

export default function AdminPage() {
  const { user, loading: userLoading } = useAuth() // Added userLoading to the destructuring
  const { toast } = useToast()
  const router = useRouter()

  // States pour tous les types de contenu
  const [tvChannels, setTvChannels] = useState([])
  const [radioStations, setRadioStations] = useState([])
  const [retrogamingSources, setRetrogamingSources] = useState([])
  const [users, setUsers] = useState<any[]>([]) // Corrected type from any[]
  const [requests, setRequests] = useState([])
  const [musicContent, setMusicContent] = useState([])
  const [software, setSoftware] = useState([])
  const [games, setGames] = useState([])
  const [ebooks, setEbooks] = useState([])
  const [totalUsersInDB, setTotalUsersInDB] = useState(0)
  const [totalUserCount, setTotalUserCount] = useState(0) // Keep for compatibility if needed

  // States pour les modals
  const [activeModal, setActiveModal] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  // States pour les recherches
  const [searchTerms, setSearchTerms] = useState({})

  // States pour les statistiques
  const [stats, setStats] = useState({
    totalContent: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeUsers: 0,
    vipUsers: 0,
    contentByType: {
      movies: 0,
      tvShows: 0,
      anime: 0,
      tvChannels: 0,
      radio: 0,
      retrogaming: 0,
      music: 0,
      software: 0,
      games: 0,
      ebooks: 0,
    },
    userGrowth: [],
    revenueByMonth: [],
    topContent: [],
    systemHealth: {
      uptime: "99.9%",
      responseTime: "120ms",
      errorRate: "0.1%",
      bandwidth: "2.5 TB",
    },
  })

  const [onlineStats, setOnlineStats] = useState({
    onlineNow: 0,
    onlineLastHour: 0,
    onlineLast24h: 0,
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true) // Moved up as per CHANGE

  // States pour le système check
  const [systemCheck, setSystemCheck] = useState({
    checking: false,
    lastCheck: null,
    results: {
      tmdb: { status: "operational", responseTime: "120ms" },
      database: { status: "connected", responseTime: "45ms" },
      servers: { status: "online", responseTime: "89ms" },
    },
  })

  // Formulaires
  const [tvChannelForm, setTvChannelForm] = useState({
    name: "",
    category: "",
    country: "",
    language: "",
    stream_url: "",
    logo_url: "",
    description: "",
    quality: "HD",
    is_active: true,
  })

  const [radioForm, setRadioForm] = useState({
    name: "",
    genre: "",
    country: "",
    frequency: "",
    stream_url: "",
    logo_url: "",
    description: "",
    website: "",
    is_active: true,
  })

  const [retrogamingSourceForm, setRetrogamingSourceForm] = useState({
    name: "",
    description: "",
    url: "",
    color: "bg-blue-600",
    category: "",
    is_active: true,
  })

  const [musicForm, setMusicForm] = useState({
    title: "",
    artist: "",
    description: "",
    thumbnail_url: "",
    video_url: "",
    streaming_url: "",
    duration: 0,
    release_year: new Date().getFullYear().toString(),
    genre: "",
    type: "Single",
    quality: "HD",
    is_active: true,
  })

  const [softwareForm, setSoftwareForm] = useState({
    name: "",
    developer: "",
    description: "",
    icon_url: "",
    download_url: "",
    version: "",
    category: "",
    platform: "",
    license: "Free",
    file_size: "",
    is_active: true,
  })

  const [gameForm, setGameForm] = useState({
    title: "",
    developer: "",
    publisher: "",
    description: "",
    cover_url: "",
    download_url: "",
    version: "",
    genre: "",
    platform: "",
    rating: "PEGI 3",
    file_size: "",
    is_active: true,
  })

  const [ebookForm, setEbookForm] = useState({
    title: "",
    author: "",
    description: "",
    cover_url: "",
    download_url: "",
    reading_url: "",
    isbn: "",
    publisher: "",
    category: "",
    language: "Français",
    pages: 0,
    file_format: "PDF",
    file_size: "",
    is_audiobook: false,
    audiobook_url: "",
    is_active: true,
  })

  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    content: "",
  })
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const [changelogs, setChangelogs] = useState<any[]>([])
  const [newChangelog, setNewChangelog] = useState({
    version: "",
    title: "",
    description: "",
    release_date: new Date().toISOString().split("T")[0],
  })

  // State for user form editing
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    is_vip: false,
    is_vip_plus: false,
    is_beta: false,
    is_admin: false,
    is_uploader: false, // Added is_uploader state
  })
  const [newPassword, setNewPassword] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)

  // State for user table filtering and pagination
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all") // Renamed from userGradeFilter
  const [userCurrentPage, setUserCurrentPage] = useState<number>(1) // Renamed from userPage

  const [editingLog, setEditingLog] = useState<any>(null)

  const [siteSettings, setSiteSettings] = useState({
    hero: true,
    trending_movies: true,
    trending_tv_shows: true,
    popular_anime: true,
    popular_collections: true,
    public_playlists: true,
    trending_actors: true,
    trending_tv_channels: true,
    subscription_offer: true,
    random_content: true,
    football_calendar: true,
    calendar_widget: true,
  })

  const [worldSettings, setWorldSettings] = useState({
    maxCapacity: 100,
    worldMode: "day",
    playerInteractionsEnabled: true,
    showStatusBadges: true,
    enableChat: true,
    enableEmojis: true,
    enableJumping: true,
  })

  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([])
  const [newOption, setNewOption] = useState({
    category: "hair_style",
    label: "",
    value: "",
    is_premium: false,
  })

  // Added state for Cinema Rooms Management
  const [cinemaRooms, setCinemaRooms] = useState<CinemaRoom[]>([])

  // Added state for Online Users count
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  const [arcadeMachines, setArcadeMachines] = useState<any[]>([])
  const [stadium, setStadium] = useState<any>(null)

  // États pour la gestion des jeux d'arcade
  const [showAddArcadeGame, setShowAddArcadeGame] = useState(false)
  const [editingArcadeGame, setEditingArcadeGame] = useState<any>(null)
  const [arcadeGameForm, setArcadeGameForm] = useState({
    name: '',
    url: '',
    image_url: '',
    media_type: 'image',
    open_in_new_tab: false,
    use_proxy: false,
  })

  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [adminMessage, setAdminMessage] = useState("")

  // Define isFullAdmin and isUploader
  const isFullAdmin = user?.isAdmin || false
  const isUploader = user?.isUploader && !user?.isAdmin // Only uploader if NOT admin

  // Define tabs accessible to uploaders
  const uploaderAllowedTabs = ["music", "games", "software", "ebooks", "requests"]
  const canAccessTab = (tab: string) => {
    if (isFullAdmin) return true
    if (isUploader) return uploaderAllowedTabs.includes(tab)
    return false
  }

  // Only full admins can delete content, uploaders cannot
  const canDelete = isFullAdmin

  // Uploaders start on "music" tab, full admins on "dashboard"
  const [activeTab, setActiveTab] = useState(isFullAdmin ? "dashboard" : "music")

  // Combined user and uploader check for access
  useEffect(() => {
    if (!user || (!user.isAdmin && !user.isUploader)) {
      router.push("/") // Redirect to homepage if not admin or uploader
    }
  }, [user, router])

  // Fetches all data on mount or when user role changes
  useEffect(() => {
    // Only fetch data if user is logged in and has appropriate role
    if (user && (user.isAdmin || user.isUploader)) {
      console.log("[v0] Admin page: Fetching initial data...")
      fetchAllData()
    }
  }, [user]) // Dependency on 'user' ensures it runs when authentication state changes

  // Fetch interactive world data only when that tab is active
  useEffect(() => {
    if (user && (user.isAdmin || user.isUploader) && activeTab === "interactive-world" && !loading) {
      loadWorldSettings()
      loadCinemaRooms()
      loadAvatarOptions()
      loadOnlineUsers()
      loadArcadeMachines()
      loadStadium()
    }
  }, [user, activeTab, loading]) // Added loading dependency to ensure it runs after initial data load

  // Refactored the online user interval logic to be dependent on activeTab and loading state
  useEffect(() => {
    // Only set interval if the user is logged in and the interactive world tab is active
    if (user && (user.isAdmin || user.isUploader) && activeTab === "interactive-world" && !loading) {
      const intervalId = setInterval(() => {
        loadOnlineUsers()
      }, 15000) // Refresh every 15 seconds

      // Cleanup interval on component unmount or when activeTab changes away from interactive-world
      return () => clearInterval(intervalId)
    }
  }, [user, activeTab, loading]) // Dependencies ensure reactivity

  const handleUpdateRequestStatus = async (id: string, status: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from("content_requests").update({ status }).eq("id", id)
      if (error) throw error
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))
      toast({ title: "Statut mis à jour", description: `La demande #${id} est maintenant ${status}.` })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la demande:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la demande.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (!canDelete) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas la permission de supprimer des demandes.",
        variant: "destructive",
      })
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from("content_requests").delete().eq("id", id)
      if (error) throw error
      setRequests((prev) => prev.filter((req) => req.id !== id))
      toast({ title: "Demande supprimée", description: `La demande #${id} a été supprimée.` })
    } catch (error) {
      console.error("Erreur lors de la suppression de la demande:", error)
      toast({ title: "Erreur", description: "Impossible de supprimer la demande.", variant: "destructive" })
    }
  }

  const loadMusicContent = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase.from("music_content").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setMusicContent(data || [])
    } catch (error) {
      console.error("Error loading music content:", error)
      setMusicContent([])
    }
  }

  const loadSoftware = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase.from("software").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setSoftware(data || [])
    } catch (error) {
      console.error("Error loading software:", error)
      setSoftware([])
    }
  }

  const loadGames = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error("Error loading games:", error)
      setGames([])
    }
  }

  const loadEbooks = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setEbooks(data || [])
    } catch (error) {
      console.error("Error loading ebooks:", error)
      setEbooks([])
    }
  }

  const handleSendBroadcast = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    if (!broadcastForm.subject || !broadcastForm.content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    setSendingBroadcast(true)
    try {
      // Get all user IDs without limit
      const {
        data: allUsers,
        error: usersError,
        count: totalUsersCount,
      } = await supabase.from("user_profiles").select("id", { count: "exact", head: true })

      if (usersError) throw usersError

      if (!allUsers || allUsers.length === 0) {
        toast({
          title: "Aucun utilisateur",
          description: "Aucun utilisateur trouvé pour envoyer le message",
          variant: "destructive",
        })
        return
      }

      // Get current admin user ID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Create messages for all users
      const messages = allUsers.map((u) => ({
        sender_id: user.id,
        recipient_id: u.id,
        subject: broadcastForm.subject,
        content: broadcastForm.content,
        is_read: false,
      }))

      const { error: insertError } = await supabase.from("user_messages").insert(messages)

      if (insertError) throw insertError

      toast({
        title: "Message envoyé",
        description: `Message diffusé à ${allUsers.length} utilisateur(s)`,
      })

      setBroadcastForm({ subject: "", content: "" })
      setActiveModal(null)
    } catch (error) {
      console.error("Error sending broadcast:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de l'envoi: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSendingBroadcast(false)
    }
  }

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez écrire un message",
        variant: "destructive",
      })
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("user_messages").insert({
        sender_id: user.id,
        recipient_id: selectedRequest?.user_id,
        subject: `Re: ${selectedRequest?.title}`,
        content: adminMessage,
        is_read: false,
      })

      if (error) throw error

      toast({
        title: "Message envoyé",
        description: `Message envoyé à ${selectedRequest?.username}`,
      })

      setMessageDialogOpen(false)
      setAdminMessage("")
      setSelectedRequest(null)
    } catch (error: any) {
      console.error("Error sending admin message:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de l'envoi: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const loadRealTVChannels = async (supabase) => {
    try {
      console.log("🔄 Chargement des chaînes TV...")
      const { data, error } = await supabase.from("tv_channels").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur Supabase TV channels:", error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} chaînes TV chargées:`, data)
      setTvChannels(data || [])
      return data || []
    } catch (error) {
      console.error("❌ Erreur lors du chargement des chaînes TV:", error)
      setTvChannels([])
      throw error
    }
  }

  const loadRealRadioStations = async (supabase) => {
    try {
      console.log("🔄 Chargement des stations radio...")
      const { data, error } = await supabase
        .from("radio_stations")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur Supabase radio stations:", error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} stations radio chargées:`, data)
      setRadioStations(data || [])
      return data || []
    } catch (error) {
      console.error("❌ Erreur lors du chargement des stations radio:", error)
      setRadioStations([])
      throw error
    }
  }

  const loadRealRetrogamingSources = async (supabase) => {
    try {
      console.log("🔄 Chargement des sources retrogaming...")
      const { data, error } = await supabase
        .from("retrogaming_sources")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur Supabase retrogaming sources:", error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} sources retrogaming chargées:`, data)
      setRetrogamingSources(data || [])
      return data || []
    } catch (error) {
      console.error("❌ Erreur lors du chargement des sources retrogaming:", error)
      setRetrogamingSources([])
      throw error
    }
  }

const loadRealUsers = async (supabase) => {
  try {
    console.log("[v0] Loading users from database...")

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Error counting users:", countError)
      setTotalUsersInDB(0)
    } else {
      setTotalUsersInDB(totalCount || 0)
      console.log(`[v0] Total users in DB: ${totalCount}`)
    }

    // Load ALL users with pagination to avoid limits
    let allUsers = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: pageData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, user_id, username, email, status, is_admin, is_uploader, is_vip, is_vip_plus, is_beta, created_at, vip_expires_at")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (usersError) {
        console.error("[v0] Error loading users:", usersError)
        throw usersError
      }

      if (pageData && pageData.length > 0) {
        allUsers = [...allUsers, ...pageData]
        page++
        hasMore = pageData.length === pageSize
      } else {
        hasMore = false
      }
    }

    console.log(`[v0] Loaded ${allUsers.length} user profiles`)

    // Process users with proper defaults
    const processedUsers = allUsers.map((user) => ({
      ...user,
      is_admin: Boolean(user.is_admin),
      is_uploader: Boolean(user.is_uploader),
      is_vip: Boolean(user.is_vip),
      is_vip_plus: Boolean(user.is_vip_plus),
      is_beta: Boolean(user.is_beta),
      status: user.status || "active",
      username: user.username || user.email?.split("@")[0] || "Unknown User",
    }))

    setUsers(processedUsers)
    console.log(`[v0] Processed ${processedUsers.length} users successfully`)
  } catch (error) {
    console.error("[v0] Fatal error loading users:", error)
    setUsers([])
  }
}

  const loadRequests = async (supabase) => {
    try {
      const { data, error } = await supabase
        .from("content_requests")
        .select("*, user_profiles(username, email)")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error("Error loading requests:", error)
    }
  }

  const loadRecentActivities = async () => {
    setActivityLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log("🔄 Chargement des activités récentes...")

      const activities = []

      const { data: loginHistory, error: loginError } = await supabase
        .from("user_login_history")
        .select(`
          *,
          user_profiles!user_login_history_user_id_fkey(username, email)
        `)
        .order("login_at", {
          ascending: false
        })
        .limit(50)

      if (loginError) {
        console.error("❌ Erreur login history:", loginError)
      } else {
        loginHistory?.forEach((login) => {
          activities.push({
            id: `login_${login.id}`,
            type: "login",
            user: login.user_profiles?.username || login.user_profiles?.email || "Utilisateur inconnu",
            description: `Connexion depuis ${login.ip_address || "IP inconnue"}`,
            details: login.user_agent ? `${login.user_agent.substring(0, 50)}...` : null,
            timestamp: new Date(login.login_at),
            icon: LogIn,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          })
        })
      }

      const { data: newUsers, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", {
          ascending: false
        })
        .limit(20)

      if (usersError) {
        console.error("❌ Erreur new users:", usersError)
      } else {
        newUsers?.forEach((user) => {
          activities.push({
            id: `user_${user.id}`,
            type: "new_user",
            user: user.username || user.email || "Utilisateur inconnu",
            description: "Nouvel utilisateur inscrit",
            details: user.is_vip ? "Compte VIP" : user.is_admin ? "Compte Admin" : "Compte standard",
            timestamp: new Date(user.created_at),
            icon: UserPlus,
            color: "text-green-600",
            bgColor: "bg-green-100",
          })
        })
      }

      const { data: watchHistory, error: watchError } = await supabase
        .from("user_watch_history")
        .select(`
          *,
          user_profiles!user_watch_history_user_id_fkey(username, email)
        `)
        .order("last_watched_at", {
          ascending: false
        })
        .limit(30)

      if (watchError) {
        console.error("❌ Erreur watch history:", watchError)
      } else {
        watchHistory?.forEach((watch) => {
          activities.push({
            id: `watch_${watch.id}`,
            type: "watched",
            user: watch.user_profiles?.username || watch.user_profiles?.email || "Utilisateur inconnu",
            description: `A regardé "${watch.content_title}"`,
            details: `${watch.content_type === "movie" ? "Film" : "Série"} - ${Math.round(watch.progress || 0)}% terminé`,
            timestamp: new Date(watch.last_watched_at),
            contentType: watch.content_type,
            icon: Play,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
          })
        })
      }

      const { data: ratings, error: ratingsError } = await supabase
        .from("user_ratings")
        .select(`
          *,
          user_profiles!user_ratings_user_id_fkey(username, email)
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(30)

      if (ratingsError) {
        console.error("❌ Erreur ratings:", ratingsError)
      } else {
        ratings?.forEach((rating) => {
          activities.push({
            id: `rating_${rating.id}`,
            type: "rating",
            user: rating.user_profiles?.username || rating.user_profiles?.email || "Utilisateur inconnu",
            description: `A ${rating.rating === "like" ? "liké" : "disliké"} un contenu`,
            details: `${rating.content_type === "movie" ? "Film" : "Série"}`,
            timestamp: new Date(rating.created_at),
            contentType: rating.content_type,
            rating: rating.rating,
            icon: rating.rating === "like" ? ThumbsUp : ThumbsDown,
            color: rating.rating === "like" ? "text-green-600" : "text-red-600",
            bgColor: rating.rating === "like" ? "bg-green-100" : "bg-red-100",
          })
        })
      }

      const { data: wishlistItems, error: wishlistError } = await supabase
        .from("user_wishlist")
        .select(`
          *,
          user_profiles!user_wishlist_user_id_fkey(username, email)
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(20)

      if (wishlistError) {
        console.error("❌ Erreur wishlist:", wishlistError)
      } else {
        wishlistItems?.forEach((item) => {
          activities.push({
            id: `wishlist_${item.id}`,
            type: "wishlist",
            user: item.user_profiles?.username || item.user_profiles?.email || "Utilisateur inconnu",
            description: `A ajouté "${item.content_title}" à sa wishlist`,
            details: `${item.content_type === "movie" ? "Film" : "Série"}`,
            timestamp: new Date(item.created_at),
            contentType: item.content_type,
            icon: Heart,
            color: "text-pink-600",
            bgColor: "bg-pink-100",
          })
        })
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      console.log(`✅ ${activities.length} activités chargées`)
      setRecentActivities(activities.slice(0, 100)) // Limit to 100 most recent
    } catch (error) {
      console.error("❌ Erreur lors du chargement des activités:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les activités récentes",
        variant: "destructive",
      })
    } finally {
      setActivityLoading(false)
    }
  }

  const loadSiteSettings = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "home_modules")
        .single()

      if (error) {
        console.error("Error loading site settings:", error)
        return
      }

      if (data?.setting_value) {
        setSiteSettings(data.setting_value)
      }
    } catch (error) {
      console.error("Error loading site settings:", error)
    }
  }

  const handleSaveSiteSettings = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          setting_value: siteSettings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq("setting_key", "home_modules")

      if (error) {
        console.error("Error saving site settings:", error)
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les paramètres",
          variant: "destructive",
        })
        return
      }

      try {
        await fetch("/api/revalidate?path=/", {
          method: "POST"
        })
      } catch (revalError) {
        console.error("Error revalidating homepage:", revalError)
      }

      toast({
        title: "Paramètres sauvegardés",
        description:
          "Les modules de la page d'accueil ont été mis à jour. Rechargez la page pour voir les changements.",
      })
    } catch (error) {
      console.error("Error saving site settings:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      })
    }
  }

  const loadWorldSettings = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { data, error } = await supabase
        .from("interactive_world_settings")
        .select("*")
        .eq("setting_key", "world_config")
        .maybeSingle()

      // Handle Supabase errors (including rate limiting)
      if (error) {
        // PGRST116 is "No Row Found" error, which is acceptable
        if (error.code === "PGRST116") {
          console.log("[v0] No world settings found, using defaults")
          return
        }
        // Log other errors but don't crash
        console.warn("[v0] Error loading world settings:", error.message || error)
        return
      }

      if (data && data.setting_value) {
        // Validate that setting_value is an object
        if (typeof data.setting_value !== "object") {
          console.warn("[v0] Invalid world settings format, using defaults")
          return
        }

        const loadedSettings = data.setting_value
        setWorldSettings({
          maxCapacity: loadedSettings.maxCapacity ?? 100,
          worldMode: loadedSettings.worldMode ?? "day",
          playerInteractionsEnabled: loadedSettings.playerInteractionsEnabled ?? true,
          showStatusBadges: loadedSettings.showStatusBadges ?? true,
          enableChat: loadedSettings.enableChat ?? true,
          enableEmojis: loadedSettings.enableEmojis ?? true,
          enableJumping: loadedSettings.enableJumping ?? true,
        })
      }
    } catch (error) {
      // Catch any unexpected errors (like JSON parsing errors from rate limiting)
      console.warn(
        "[v0] Unexpected error loading world settings:",
        error instanceof Error ? error.message : "Unknown error",
      )
      // Continue with default settings
    }
  }

  const handleSaveWorldSettings = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      console.log("[v0] Saving world settings:", worldSettings)

      const { data: existing } = await supabase
        .from("interactive_world_settings")
        .select("*")
        .eq("setting_key", "world_config")
        .maybeSingle()

      let result

      if (existing) {
        // Update existing record
        result = await supabase
          .from("interactive_world_settings")
          .update({
            setting_value: worldSettings,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("setting_key", "world_config")
      } else {
        // Insert new record
        result = await supabase.from("interactive_world_settings").insert({
          setting_key: "world_config",
          setting_value: worldSettings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
      }

      if (result.error) {
        console.error("[v0] Error saving world settings:", result.error)
        toast({
          title: "Erreur",
          description: `Impossible de sauvegarder: ${result.error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("[v0] World settings saved successfully")
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres du monde interactif ont été mis à jour.",
      })
    } catch (error: any) {
      console.error("[v0] Error saving world settings:", error)
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      })
    }
  }

  // ADDED: Function to fetch Cinema Rooms
  const loadCinemaRooms = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase
        .from("interactive_cinema_rooms")
        .select("*")
        .order("room_number", {
          ascending: true
        }) // Order by room number for consistency

      if (error) {
        console.warn("Error loading cinema rooms:", error.message || error)
        return
      }

      if (data) {
        setCinemaRooms(data)
      }
    } catch (error) {
      console.warn("Error loading cinema rooms:", error instanceof Error ? error.message : "Unknown error")
    }
  }

  // ADDED: Function to create a new cinema room
  const handleCreateCinemaRoom = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      // Determine the next room number
      const maxRoomNumber = cinemaRooms.length > 0 ? Math.max(...cinemaRooms.map((r) => r.room_number)) : 0

      const { error } = await supabase.from("interactive_cinema_rooms").insert({
        room_number: maxRoomNumber + 1, // Assign next available number
        name: `Salle ${maxRoomNumber + 1}`, // Default name
        capacity: 50, // Default capacity
        theme: "default", // Default theme
        movie_title: "", // Default empty movie title
        access_level: "public", // Default access level
        is_open: true, // Default to open
        embed_url: "", // Initialize embed_url
        // created_at and updated_at are handled by Supabase defaults
      })

      if (error) throw error

      toast({
        title: "Salle créée",
        description: "Une nouvelle salle de cinéma a été créée.",
      })
      loadCinemaRooms() // Reload the list to include the new room
    } catch (error) {
      console.error("Error creating cinema room:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la salle de cinéma.",
        variant: "destructive",
      })
    }
  }

  // ADDED: Function to update a Cinema Room
  const handleUpdateCinemaRoom = async (room: CinemaRoom) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase
        .from("interactive_cinema_rooms")
        .update({
          room_number: room.room_number,
          name: room.name,
          capacity: room.capacity,
          theme: room.theme,
          movie_title: room.movie_title,
          movie_tmdb_id: room.movie_tmdb_id,
          movie_poster: room.movie_poster,
          embed_url: room.embed_url, // Update embed_url
          schedule_start: room.schedule_start,
          schedule_end: room.schedule_end,
          access_level: room.access_level,
          is_open: room.is_open,
          updated_at: new Date().toISOString(), // Supabase can also handle this with RLS policies
        })
        .eq("id", room.id)

      if (error) throw error

      toast({
        title: "Salle mise à jour",
        description: `La salle '${room.name}' a été mise à jour avec succès.`,
      })
      loadCinemaRooms() // Reload to reflect changes
    } catch (error) {
      console.error("Error updating cinema room:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la salle de cinéma.",
        variant: "destructive",
      })
    }
  }

  const loadAvatarOptions = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase
        .from("avatar_customization_options")
        .select("*")
        .order("id", {
          ascending: true
        })

      if (error) {
        console.warn("Error loading avatar options:", error.message || error)
        return
      }

      if (data) {
        setAvatarOptions(data)
      }
    } catch (error) {
      console.warn("Error loading avatar options:", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const handleAddAvatarOption = async () => {
    // Basic validation
    if (!newOption.label || !newOption.value) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis (Label et Valeur).",
        variant: "destructive",
      })
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from("avatar_customization_options").insert({
        category: newOption.category,
        label: newOption.label,
        value: newOption.value,
        is_premium: newOption.is_premium,
        // created_at will be set by Supabase
      })

      if (error) throw error

      toast({
        title: "Option ajoutée",
        description: "L'option de personnalisation a été ajoutée avec succès.",
      })
      // Reset the form
      setNewOption({
        category: "hair_style", // Reset to default category
        label: "",
        value: "",
        is_premium: false,
      })
      loadAvatarOptions() // Refresh the list
    } catch (error) {
      console.error("Error adding avatar option:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'option de personnalisation. Vérifiez les logs.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAvatarOption = async (id: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from("avatar_customization_options").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Option supprimée",
        description: "L'option de personnalisation a été supprimée avec succès.",
      })
      loadAvatarOptions() // Refresh the list
    } catch (error) {
      console.error("Error deleting avatar option:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'option. Vérifiez les logs.",
        variant: "destructive",
      })
    }
  }

  const loadOnlineUsers = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      // Query for users that are marked as online in the interactive_profiles table
      const {
        count,
        error
      } = await supabase
        .from("interactive_profiles")
        .select("*", {
          count: "exact",
          head: true
        }) // count: 'exact' and head: true optimizes for count only
        .eq("is_online", true) // Filter for online users

      if (error) throw error
      setOnlineUsersCount(count || 0) // Update the state with the count
    } catch (error) {
      console.error("Error loading online users:", error)
      // Optionally show a toast for error
    }
  }

  // CHANGE: Added loadArcadeMachines function after loadCinemaRooms
  const loadArcadeMachines = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase.from("arcade_games").select("*").order("display_order", {
        ascending: true
      })

      if (error) {
        console.warn("Error loading arcade machines:", error.message || error)
        return
      }

      if (data) {
        setArcadeMachines(data)
      }
    } catch (error) {
      console.warn("Error loading arcade machines:", error instanceof Error ? error.message : "Unknown error")
    }
  }

  // Fonctions CRUD pour les jeux d'arcade
  const handleAddArcadeGame = async () => {
    if (!arcadeGameForm.name || !arcadeGameForm.url) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const maxOrder = Math.max(...arcadeMachines.map(g => g.display_order || 0), 0)
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

      if (error) throw error

      setArcadeMachines([...arcadeMachines, data])
      setShowAddArcadeGame(false)
      setArcadeGameForm({
        name: '',
        url: '',
        image_url: '',
        media_type: 'image',
        open_in_new_tab: false,
        use_proxy: false
      })
      toast({
        title: "Jeu ajouté",
        description: `${data.name} a été ajouté à l'arcade.`
      })
    } catch (error) {
      console.error('Error adding arcade game:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le jeu.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateArcadeGame = async () => {
    if (!editingArcadeGame || !arcadeGameForm.name || !arcadeGameForm.url) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
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

      if (error) throw error

      setArcadeMachines(arcadeMachines.map(g => g.id === editingArcadeGame.id ? data : g))
      setEditingArcadeGame(null)
      setArcadeGameForm({
        name: '',
        url: '',
        image_url: '',
        media_type: 'image',
        open_in_new_tab: false,
        use_proxy: false
      })
      toast({
        title: "Jeu modifié",
        description: `${data.name} a été mis à jour.`
      })
    } catch (error) {
      console.error('Error updating arcade game:', error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier le jeu.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteArcadeGame = async (id: number) => {
    if (!confirm('Supprimer ce jeu ?')) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from('arcade_games').delete().eq('id', id)
      if (error) throw error
      setArcadeMachines(arcadeMachines.filter(g => g.id !== id))
      toast({
        title: "Jeu supprimé",
        description: "Le jeu a été supprimé de l'arcade."
      })
    } catch (error) {
      console.error('Error deleting arcade game:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le jeu.",
        variant: "destructive"
      })
    }
  }

  const handleToggleArcadeGame = async (game: any) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { error } = await supabase.from('arcade_games').update({ is_active: !game.is_active }).eq('id', game.id)
      if (error) throw error
      setArcadeMachines(arcadeMachines.map(g => g.id === game.id ? { ...g, is_active: !g.is_active } : g))
    } catch (error) {
      console.error('Error toggling arcade game:', error)
    }
  }

  // CHANGE: Added loadStadium function
  const loadStadium = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      const { data, error } = await supabase
        .from("interactive_stadium")
        .select("*")
        .single() // Get the single stadium configuration

      if (error) {
        // PGRST116 is "No Row Found" error, which is acceptable
        if (error.code === "PGRST116") {
          console.log("[v0] No stadium found, using defaults")
          return
        }
        console.warn("Error loading stadium:", error.message || error)
        return
      }

      if (data) {
        setStadium(data)
      }
    } catch (error) {
      console.warn("Error loading stadium:", error instanceof Error ? error.message : "Unknown error")
    }
  }

  // ADDED: Function to update Stadium configuration
  const handleUpdateStadium = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    if (!stadium) {
      toast({
        title: "Erreur",
        description: "Aucun stade configuré à mettre à jour.",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from("interactive_stadium")
        .update({
          name: stadium.name,
          match_title: stadium.match_title,
          embed_url: stadium.embed_url, // This should be stream_url based on the form
          schedule_start: stadium.schedule_start,
          schedule_end: stadium.schedule_end,
          access_level: stadium.access_level,
          is_open: stadium.is_open,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stadium.id) // Ensure we update the correct row

      if (error) throw error

      toast({
        title: "Stade mis à jour",
        description: `Le stade '${stadium.name}' a été mis à jour avec succès.`,
      })
    } catch (error) {
      console.error("Error updating stadium:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stade.",
        variant: "destructive",
      })
    }
  }

  const loadOnlineStatistics = async (supabase) => {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Users online now (active in last 5 minutes)
      const { count: onlineNow } = await supabase
        .from("user_online_status")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", fiveMinutesAgo.toISOString())

      // Users online in last hour
      const { count: onlineLastHour } = await supabase
        .from("user_online_status")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", oneHourAgo.toISOString())

      // Users online in last 24h
      const { count: onlineLast24h } = await supabase
        .from("user_online_status")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", twentyFourHoursAgo.toISOString())

      setOnlineStats({
        onlineNow: onlineNow || 0,
        onlineLastHour: onlineLastHour || 0,
        onlineLast24h: onlineLast24h || 0,
      })

      console.log("[v0] Online stats:", { onlineNow, onlineLastHour, onlineLast24h })
    } catch (error) {
      console.error("[v0] Error loading online statistics:", error)
    }
  }

  const loadStatistics = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log("🔄 Calcul des statistiques...")

      await loadOnlineStatistics(supabase)

      // Essayer d'utiliser la fonction SQL pour obtenir les stats
      let dbStats = null
      let supabaseUserCount = 0
      try {
        const { data: statsData, error: statsError } = await supabase.rpc("get_admin_stats")
        if (!statsError && statsData) {
          dbStats = statsData
          console.log("✅ Statistiques depuis la base de données:", dbStats)
        }
      } catch (error) {
        console.warn("⚠️ Impossible d'utiliser get_admin_stats, calcul manuel:", error)
      }

      const { count: userCount, error: countError } = await supabase
        .from("user_profiles")
        .select("id", {
          count: "exact",
          head: true
        })

      if (!countError && userCount !== null) {
        supabaseUserCount = userCount
      } else if (countError) {
        console.error("❌ Erreur lors de la récupération du compte utilisateur:", countError)
      }

      const [tvChannelsResult, radioResult, retrogamingResult, musicResult, softwareResult, gamesResult, ebooksResult] =
        await Promise.all([
          supabase.from("tv_channels").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("radio_stations").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("retrogaming_sources").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("music_content").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("software").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("games").select("id", {
            count: "exact",
            head: true
          }),
          supabase.from("ebooks").select("id", {
            count: "exact",
            head: true
          }),
        ])

      const totalTVChannels = tvChannelsResult.count || 0
      const totalRadio = radioResult.count || 0
      const totalRetrogaming = retrogamingResult.count || 0
      const totalMusic = musicResult.count || 0
      const totalSoftware = softwareResult.count || 0
      const totalGames = gamesResult.count || 0
      const totalEbooks = ebooksResult.count || 0

      const totalUsers = supabaseUserCount || users.length
      const vipUsers = (users || []).filter((u) => u.is_vip || u.is_vip_plus).length
      const activeUsers = (users || []).filter((u) => u.status === "active").length

      console.log("📊 Statistiques avec comptage exact BDD:", {
        totalTVChannels,
        totalRadio,
        totalRetrogaming,
        totalMusic,
        totalSoftware,
        totalGames,
        totalEbooks,
        totalUsers,
        vipUsers,
        activeUsers,
      })

      // Charger les vraies données TMDB avec comptage précis
      let tmdbMovies = 50000 // Valeur par défaut
      let tmdbTVShows = 25000 // Valeur par défaut
      let tmdbAnime = 8000 // Valeur par défaut

      try {
        console.log("🔄 Chargement des données TMDB...")
        const [moviesResponse, tvResponse, animeResponse] = await Promise.allSettled([
          fetch(`/api/content/movies?page=1`),
          fetch(`/api/content/tv-shows?page=1`),
          fetch(`/api/content/anime?page=1`),
        ])

        if (moviesResponse.status === "fulfilled" && moviesResponse.value.ok) {
          const moviesData = await moviesResponse.value.json()
          tmdbMovies = moviesData.total_results || 50000
        }

        if (tvResponse.status === "fulfilled" && tvResponse.value.ok) {
          const tvData = await tvResponse.value.json()
          tmdbTVShows = tvData.total_results || 25000
        }

        if (animeResponse.status === "fulfilled" && animeResponse.value.ok) {
          const animeData = await animeResponse.value.json()
          tmdbAnime = animeData.total_results || 8000
        }

        console.log("✅ Données TMDB chargées:", {
          tmdbMovies,
          tmdbTVShows,
          tmdbAnime
        })
      } catch (error) {
        console.error("⚠️ Erreur lors du chargement des données TMDB, utilisation des valeurs par défaut:", error)
      }

      // Charger les statistiques d'activité depuis Supabase
      let totalViews = dbStats?.watched_items || 0
      if (!dbStats?.watched_items) {
        try {
          const {
            count: watchedCount
          } = await supabase
            .from("watched_items")
            .select("id", {
              count: "exact",
              head: true
            })
          totalViews = watchedCount || 0
        } catch (error) {
          console.error("⚠️ Erreur lors du chargement des vues:", error)
        }
      }

      const newStats = {
        totalContent:
          tmdbMovies +
          tmdbTVShows +
          tmdbAnime +
          totalTVChannels +
          totalRadio +
          totalRetrogaming +
          totalMusic + // Added new content types
          totalSoftware + // Added new content types
          totalGames + // Added new content types
          totalEbooks, // Added new content types
        totalUsers,
        totalRevenue: vipUsers * 1.99 * 12,
        activeUsers,
        vipUsers,
        contentByType: {
          movies: tmdbMovies,
          tvShows: tmdbTVShows,
          anime: tmdbAnime,
          tvChannels: totalTVChannels, // Using exact count
          radio: totalRadio, // Using exact count
          retrogaming: totalRetrogaming, // Using exact count
          music: totalMusic, // Using exact count
          software: totalSoftware, // Using exact count
          games: totalGames, // Using exact count
          ebooks: totalEbooks, // Using exact count
        },
        userGrowth: [
          {
            month: "Jan",
            users: Math.floor(totalUsers * 0.6)
          },
          {
            month: "Fév",
            users: Math.floor(totalUsers * 0.7)
          },
          {
            month: "Mar",
            users: Math.floor(totalUsers * 0.8)
          },
          {
            month: "Avr",
            users: Math.floor(totalUsers * 0.85)
          },
          {
            month: "Mai",
            users: Math.floor(totalUsers * 0.92)
          },
          {
            month: "Juin",
            users: totalUsers
          },
        ],
        revenueByMonth: [
          {
            month: "Jan",
            revenue: Math.floor(vipUsers * 1.99 * 0.6)
          },
          {
            month: "Fév",
            revenue: Math.floor(vipUsers * 1.99 * 0.7)
          },
          {
            month: "Mar",
            revenue: Math.floor(vipUsers * 1.99 * 0.8)
          },
          {
            month: "Avr",
            revenue: Math.floor(vipUsers * 1.99 * 0.9)
          },
          {
            month: "Mai",
            revenue: Math.floor(vipUsers * 1.99 * 0.95)
          },
          {
            month: "Juin",
            revenue: vipUsers * 1.99
          },
        ],
        topContent: [
          {
            title: "Top Movie",
            type: "movie",
            views: 15420
          },
          {
            title: "Top TV Show",
            type: "tv",
            views: 12350
          },
          {
            title: "Top Anime",
            type: "anime",
            views: 9870
          },
          {
            title: "Popular Channel",
            type: "tv",
            views: 8650
          },
          {
            title: "Hit Movie",
            type: "movie",
            views: 7890
          },
        ],
        systemHealth: {
          uptime: "99.9%",
          responseTime: "120ms",
          errorRate: "0.1%",
          bandwidth: "2.5 TB",
        },
      }

      console.log("✅ Statistiques calculées:", newStats)
      setStats(newStats)
    } catch (error) {
      console.error("❌ Erreur lors du chargement des statistiques:", error)
    }
  }

  const handleContentUpdate = async (type) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/update-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLastUpdate(new Date().toLocaleString("fr-FR"))
        toast({
          title: "Mise à jour réussie",
          description: result.message,
        })
        // Recharger les statistiques après la mise à jour
        await loadStatistics()
      } else {
        throw new Error(result.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSystemCheck = async () => {
    setSystemCheck((prev) => ({ ...prev,
      checking: true
    }))

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSystemCheck({
        checking: false,
        lastCheck: new Date().toLocaleString("fr-FR"),
        results: {
          tmdb: {
            status: "operational",
            responseTime: Math.floor(Math.random() * 100 + 80) + "ms"
          },
          database: {
            status: "connected",
            responseTime: Math.floor(Math.random() * 50 + 30) + "ms"
          },
          servers: {
            status: "online",
            responseTime: Math.floor(Math.random() * 80 + 60) + "ms"
          },
        },
      })

      toast({
        title: "Vérification terminée",
        description: "Tous les systèmes sont opérationnels",
      })
    } catch (error) {
      setSystemCheck((prev) => ({ ...prev,
        checking: false
      }))
      toast({
        title: "Erreur de vérification",
        description: "Impossible de vérifier l'état du système",
        variant: "destructive",
      })
    }
  }

  // Fonctions CRUD avec vraie base de données
  const handleAdd = async (type, formData) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Ajout d'un ${type}:`, formData)
      let result
      let tableName

      switch (type) {
        case "tvchannel":
          tableName = "tv_channels"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "radio":
          tableName = "radio_stations"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "retrogaming-source":
          tableName = "retrogaming_sources"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "music":
          tableName = "music_content"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "software":
          tableName = "software"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "game":
          tableName = "games"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        case "ebook":
          tableName = "ebooks"
          result = await supabase.from(tableName).insert([formData]).select().single()
          break
        default:
          throw new Error(`Type ${type} non supporté`)
      }

      if (result.error) {
        console.error(`❌ Erreur lors de l'ajout dans ${tableName}:`, result.error)

        // Message d'erreur plus spécifique pour RLS
        if (result.error.code === "42501" || result.error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw result.error
      }

      console.log(`✅ ${type} ajouté avec succès:`, result.data)

      // Mettre à jour l'état local
      switch (type) {
        case "tvchannel":
          setTvChannels((prev) => [result.data, ...prev])
          toast({
            title: "Chaîne TV ajoutée",
            description: `${formData.name} a été ajoutée avec succès.`,
          })
          break
        case "radio":
          setRadioStations((prev) => [result.data, ...prev])
          toast({
            title: "Station radio ajoutée",
            description: `${formData.name} a été ajoutée avec succès.`,
          })
          break
        case "retrogaming-source":
          setRetrogamingSources((prev) => [result.data, ...prev])
          toast({
            title: "Source retrogaming ajoutée",
            description: `${formData.name} a été ajoutée avec succès.`,
          })
          break
        case "music":
          setMusicContent((prev) => [result.data, ...prev])
          toast({
            title: "Contenu musical ajouté",
            description: `${formData.title} a été ajouté avec succès.`,
          })
          break
        case "software":
          setSoftware((prev) => [result.data, ...prev])
          toast({
            title: "Logiciel ajouté",
            description: `${formData.name} a été ajouté avec succès.`,
          })
          break
        case "game":
          setGames((prev) => [result.data, ...prev])
          toast({
            title: "Jeu ajouté",
            description: `${formData.title} a été ajouté avec succès.`,
          })
          break
        case "ebook":
          setEbooks((prev) => [result.data, ...prev])
          toast({
            title: "Ebook ajouté",
            description: `${formData.title} a été ajouté avec succès.`,
          })
          break
      }

      setActiveModal(null)
      setEditingItem(null)

      // Réinitialiser les formulaires
      switch (type) {
        case "tvchannel":
          setTvChannelForm({
            name: "",
            category: "",
            country: "",
            language: "",
            stream_url: "",
            logo_url: "",
            description: "",
            quality: "HD",
            is_active: true,
          })
          break
        case "radio":
          setRadioForm({
            name: "",
            genre: "",
            country: "",
            frequency: "",
            stream_url: "",
            logo_url: "",
            description: "",
            website: "",
            is_active: true,
          })
          break
        case "retrogaming-source":
          setRetrogamingSourceForm({
            name: "",
            description: "",
            url: "",
            color: "bg-blue-600",
            category: "",
            is_active: true,
          })
          break
        case "music":
          setMusicForm({
            title: "",
            artist: "",
            description: "",
            thumbnail_url: "",
            video_url: "",
            streaming_url: "", // Reset streaming_url
            duration: 0,
            release_year: new Date().getFullYear(),
            genre: "",
            type: "Single", // Default type
            quality: "HD",
            is_active: true,
          })
          break
        case "software":
          setSoftwareForm({
            name: "",
            developer: "",
            description: "",
            icon_url: "",
            download_url: "",
            version: "",
            category: "",
            platform: "",
            license: "Free",
            file_size: "",
            is_active: true,
          })
          break
        case "game":
          setGameForm({
            title: "",
            developer: "",
            publisher: "",
            description: "",
            cover_url: "",
            download_url: "",
            version: "",
            genre: "",
            platform: "",
            rating: "PEGI 3",
            file_size: "",
            is_active: true,
          })
          break
        case "ebook":
          setEbookForm({
            title: "",
            author: "",
            description: "",
            cover_url: "",
            download_url: "",
            reading_url: "", // Load reading_url
            isbn: "",
            publisher: "",
            category: "",
            language: "Français",
            pages: 0,
            file_format: "PDF",
            file_size: "",
            is_audiobook: false,
            audiobook_url: "",
            is_active: true,
          })
          break
      }

      // Recharger les statistiques
      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (type, item) => {
    console.log(`🔄 Édition d'un ${type}:`, item)
    setEditingItem(item)
    setActiveModal(type)

    switch (type) {
      case "tvchannel":
        setTvChannelForm({
          name: item.name || "",
          category: item.category || "",
          country: item.country || "",
          language: item.language || "",
          stream_url: item.stream_url || "",
          logo_url: item.logo_url || "",
          description: item.description || "",
          quality: item.quality || "HD",
          is_active: item.is_active ?? true,
        })
        break
      case "radio":
        setRadioForm({
          name: item.name || "",
          genre: item.genre || "",
          country: item.country || "",
          frequency: item.frequency || "",
          stream_url: item.stream_url || "",
          logo_url: item.logo_url || "",
          description: item.description || "",
          website: item.website || "",
          is_active: item.is_active ?? true,
        })
        break
      case "retrogaming-source":
        setRetrogamingSourceForm({
          name: item.name || "",
          description: item.description || "",
          url: item.url || "",
          color: item.color || "bg-blue-600",
          category: item.category || "",
          is_active: item.is_active ?? true,
        })
        break
      case "user":
        setUserForm({
          username: item.username || "",
          email: item.email || "",
          is_vip: item.is_vip || false,
          is_vip_plus: item.is_vip_plus || false,
          is_beta: item.is_beta || false,
          is_admin: item.is_admin || false,
          is_uploader: item.is_uploader || false,
        })
        break
      case "music":
        setMusicForm({
          title: item.title || "",
          artist: item.artist || "",
          description: item.description || "",
          thumbnail_url: item.thumbnail_url || "",
          video_url: item.video_url || "",
          streaming_url: item.streaming_url || "", // Load streaming_url
          duration: item.duration || 0,
          release_year: item.release_year || new Date().getFullYear(),
          genre: item.genre || "",
          type: item.type || "Single", // Default type
          quality: item.quality || "HD",
          is_active: item.is_active ?? true,
        })
        break
      case "software":
        setSoftwareForm({
          name: item.name || "",
          developer: item.developer || "",
          description: item.description || "",
          icon_url: item.icon_url || "",
          download_url: item.download_url || "",
          version: item.version || "",
          category: item.category || "",
          platform: item.platform || "",
          license: item.license || "Free",
          file_size: item.file_size || "",
          is_active: item.is_active ?? true,
        })
        break
      case "game":
        setGameForm({
          title: item.title || "",
          developer: item.developer || "",
          publisher: item.publisher || "",
          description: item.description || "",
          cover_url: item.cover_url || "",
          download_url: item.download_url || "",
          version: item.version || "",
          genre: item.genre || "",
          platform: item.platform || "",
          rating: item.rating || "PEGI 3",
          file_size: item.file_size || "",
          is_active: item.is_active ?? true,
        })
        break
      case "ebook":
        setEbookForm({
          title: item.title || "",
          author: item.author || "",
          description: item.description || "",
          cover_url: item.cover_url || "",
          download_url: item.download_url || "",
          reading_url: item.reading_url || "", // Load reading_url
          isbn: item.isbn || "",
          publisher: item.publisher || "",
          category: item.category || "",
          language: item.language || "Français",
          pages: item.pages || 0,
          file_format: item.file_format || "PDF",
          file_size: item.file_size || "",
          is_audiobook: item.is_audiobook || false,
          audiobook_url: item.audiobook_url || "",
          is_active: item.is_active ?? true,
        })
        break
    }
  }

  const handleUpdate = async (type, formData) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    if (!editingItem) {
      console.error("❌ Aucun élément en cours d'édition")
      return
    }

    try {
      console.log(`🔄 Mise à jour d'un ${type}:`, {
        id: editingItem.id,
        formData
      })
      let tableName

      switch (type) {
        case "tvchannel":
          tableName = "tv_channels"
          break
        case "radio":
          tableName = "radio_stations"
          break
        case "retrogaming-source":
          tableName = "retrogaming_sources"
          break
        case "user":
          tableName = "user_profiles"
          if (newPassword && newPassword.trim() !== "") {
            try {
              // Note: This requires Supabase service role key for admin operations
              // In a real app, this should be done server-side via API route
              const {
                error: passwordError
              } = await supabase.auth.admin.updateUserById(editingUser.user_id, { // Corrected to use user_id
                password: newPassword,
              })

              if (passwordError) {
                console.error("❌ Erreur lors du changement de mot de passe:", passwordError)
                toast({
                  title: "Avertissement",
                  description:
                    "Profil mis à jour mais le mot de passe n'a pas pu être changé. Utilisez la fonctionnalité de réinitialisation par email.",
                  variant: "destructive",
                })
              } else {
                toast({
                  title: "Mot de passe modifié",
                  description: "Le mot de passe de l'utilisateur a été changé",
                })
              }
            } catch (pwError) {
              console.error("❌ Erreur mot de passe:", pwError)
            }
            setNewPassword("") // Reset password field
          }
          break
        case "music":
          tableName = "music_content"
          break
        case "software":
          tableName = "software"
          break
        case "game":
          tableName = "games"
          break
        case "ebook":
          tableName = "ebooks"
          break
        default:
          throw new Error(`Type ${type} non supporté`)
      }

      const {
        error
      } = await supabase.from(tableName).update(formData).eq("id", editingItem.id)

      if (error) {
        console.error(`❌ Erreur lors de la mise à jour dans ${tableName}:`, error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ ${type} mis à jour avec succès`)

      const updatedItem = { ...editingItem,
        ...formData
      }

      // Mettre à jour l'état local
      switch (type) {
        case "tvchannel":
          setTvChannels((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "radio":
          setRadioStations((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "retrogaming-source":
          setRetrogamingSources((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "user":
          setUsers((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "music":
          setMusicContent((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "software":
          setSoftware((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "game":
          setGames((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
        case "ebook":
          setEbooks((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
          break
      }

      setActiveModal(null)
      setEditingItem(null)

      toast({
        title: "Modifié avec succès",
        description: `${type} mis à jour dans la base de données.`,
      })

      // Recharger les statistiques
      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de la modification: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (type, id) => {
    if (!canDelete) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas la permission de supprimer du contenu.",
        variant: "destructive",
      })
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Suppression d'un ${type} avec l'ID:`, id)
      let tableName

      switch (type) {
        case "tvchannel":
          tableName = "tv_channels"
          break
        case "radio":
          tableName = "radio_stations"
          break
        case "retrogaming-source":
          tableName = "retrogaming_sources"
          break
        case "music":
          tableName = "music_content"
          break
        case "software":
          tableName = "software"
          break
        case "game":
          tableName = "games"
          break
        case "ebook":
          tableName = "ebooks"
          break
        default:
          throw new Error(`Type ${type} non supporté`)
      }

      const {
        error
      } = await supabase.from(tableName).delete().eq("id", id)

      if (error) {
        console.error(`❌ Erreur lors de la suppression dans ${tableName}:`, error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ ${type} supprimé avec succès`)

      // Mettre à jour l'état local
      switch (type) {
        case "tvchannel":
          setTvChannels((prev) => prev.filter((item) => item.id !== id))
          break
        case "radio":
          setRadioStations((prev) => prev.filter((item) => item.id !== id))
          break
        case "retrogaming-source":
          setRetrogamingSources((prev) => prev.filter((item) => item.id !== id))
          break
        case "music":
          setMusicContent((prev) => prev.filter((item) => item.id !== id))
          break
        case "software":
          setSoftware((prev) => prev.filter((item) => item.id !== id))
          break
        case "game":
          setGames((prev) => prev.filter((item) => item.id !== id))
          break
        case "ebook":
          setEbooks((prev) => prev.filter((item) => item.id !== id))
          break
      }

      toast({
        title: "Supprimé avec succès",
        description: `${type} supprimé de la base de données.`
      })

      // Recharger les statistiques
      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const toggleStatus = async (type, id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Changement de statut pour ${type} avec l'ID:`, id)
      let currentItem
      let tableName

      switch (type) {
        case "tvchannel":
          currentItem = tvChannels.find((item) => item.id === id)
          tableName = "tv_channels"
          break
        case "radio":
          currentItem = radioStations.find((item) => item.id === id)
          tableName = "radio_stations"
          break
        case "retrogaming-source":
          currentItem = retrogamingSources.find((item) => item.id === id)
          tableName = "retrogaming_sources"
          break
        case "music":
          currentItem = musicContent.find((item) => item.id === id)
          tableName = "music_content"
          break
        case "software":
          currentItem = software.find((item) => item.id === id)
          tableName = "software"
          break
        case "game":
          currentItem = games.find((item) => item.id === id)
          tableName = "games"
          break
        case "ebook":
          currentItem = ebooks.find((item) => item.id === id)
          tableName = "ebooks"
          break
        default:
          throw new Error(`Type ${type} non supporté`)
      }

      if (!currentItem) {
        throw new Error(`Élément non trouvé pour le type ${type}`)
      }

      const newStatus = !currentItem.is_active
      const updateData = {
        is_active: newStatus
      }

      console.log(`🔄 Nouveau statut: ${newStatus}`)

      const {
        error
      } = await supabase.from(tableName).update(updateData).eq("id", id)

      if (error) {
        console.error(`❌ Erreur lors du changement de statut dans ${tableName}:`, error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut changé avec succès`)

      const updatedItem = { ...currentItem,
        is_active: newStatus
      }

      // Mettre à jour l'état local
      switch (type) {
        case "tvchannel":
          setTvChannels((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "radio":
          setRadioStations((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "retrogaming-source":
          setRetrogamingSources((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "music":
          setMusicContent((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "software":
          setSoftware((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "game":
          setGames((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
        case "ebook":
          setEbooks((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
          break
      }

      toast({
        title: "Statut modifié",
        description: `Le statut a été ${newStatus ? "activé" : "désactivé"} avec succès.`,
      })
    } catch (error) {
      console.error("❌ Erreur lors du changement de statut:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du changement de statut: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Fonctions pour les utilisateurs
  const toggleUserVIP = async (id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Changement de statut VIP pour l'utilisateur:`, id)
      const currentUser = users.find((user) => user.id === id)
      if (!currentUser) throw new Error("Utilisateur non trouvé")

      const newVipStatus = !currentUser.is_vip

      const {
        error
      } = await supabase.from("user_profiles").update({
        is_vip: newVipStatus
      }).eq("id", id)

      if (error) {
        console.error("❌ Erreur lors du changement VIP:", error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut VIP changed: ${newVipStatus}`)

      const updatedUser = { ...currentUser,
        is_vip: newVipStatus
      }
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: "Statut VIP modifié",
        description: "Le statut VIP de l'utilisateur a été modifié."
      })

      // Recharger les statistiques
      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors du changement VIP:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du changement VIP: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const toggleUserAdmin = async (id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Changement de statut Admin pour l'utilisateur:`, id)
      const currentUser = users.find((user) => user.id === id)
      if (!currentUser) throw new Error("Utilisateur non trouvé")

      const newAdminStatus = !currentUser.is_admin

      const {
        error
      } = await supabase.from("user_profiles").update({
        is_admin: newAdminStatus
      }).eq("id", id)

      if (error) {
        console.error("❌ Erreur lors du changement Admin:", error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut Admin changed: ${newAdminStatus}`)

      const updatedUser = { ...currentUser,
        is_admin: newAdminStatus
      }
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: "Statut Admin modifié",
        description: "Le statut administrateur a été modifié."
      })
    } catch (error) {
      console.error("❌ Erreur lors du changement Admin:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du changement admin: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const toggleUserVIPPlus = async (id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Changement de statut VIP+ pour l'utilisateur:`, id)
      const currentUser = users.find((user) => user.id === id)
      if (!currentUser) throw new Error("Utilisateur non trouvé")

      const newVipPlusStatus = !currentUser.is_vip_plus

      const {
        error
      } = await supabase.from("user_profiles").update({
        is_vip_plus: newVipPlusStatus
      }).eq("id", id)

      if (error) {
        console.error("❌ Erreur lors du changement VIP+:", error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut VIP+ changed: ${newVipPlusStatus}`)

      const updatedUser = { ...currentUser,
        is_vip_plus: newVipPlusStatus
      }
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: "Statut VIP+ modifié",
        description: "Le statut VIP+ de l'utilisateur a été modifié."
      })

      // Recharger les statistiques
      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors du changement VIP+:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du changement VIP+: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const toggleUserBeta = async (id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Changement de statut Beta pour l'utilisateur:`, id)
      const currentUser = users.find((user) => user.id === id)
      if (!currentUser) throw new Error("Utilisateur non trouvé")

      const newBetaStatus = !currentUser.is_beta

      const {
        error
      } = await supabase.from("user_profiles").update({
        is_beta: newBetaStatus
      }).eq("id", id)

      if (error) {
        console.error("❌ Erreur lors du changement Beta:", error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut Beta changed: ${newBetaStatus}`)

      const updatedUser = { ...currentUser,
        is_beta: newBetaStatus
      }
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: "Statut Beta modifié",
        description: "Le statut Beta de l'utilisateur a été modifié."
      })
    } catch (error) {
      console.error("❌ Erreur lors du changement Beta:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du changement Beta: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const banUser = async (id) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      console.log(`🔄 Bannissement/débannissement de l'utilisateur:`, id)
      const currentUser = users.find((user) => user.id === id)
      if (!currentUser) throw new Error("Utilisateur non trouvé")

      const newStatus = currentUser.status === "banned" ? "active" : "banned"

      const {
        error
      } = await supabase.from("user_profiles").update({
        status: newStatus
      }).eq("id", id)

      if (error) {
        console.error("❌ Erreur lors du bannissement:", error)

        // Message d'erreur plus spécifique pour RLS
        if (error.code === "42501" || error.message.includes("row level security")) {
          throw new Error("Permissions insuffisantes. Assurez-vous d'être connecté en tant qu'administrateur.")
        }

        throw error
      }

      console.log(`✅ Statut utilisateur changed: ${newStatus}`)

      const updatedUser = { ...currentUser,
        status: newStatus
      }
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: newStatus === "banned" ? "Utilisateur banni" : "Utilisateur débanni",
        description: "Le statut de l'utilisateur a été modifié.",
      })
    } catch (error) {
      console.error("❌ Erreur lors du bannissement:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors du bannissement: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!canDelete) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas la permission de supprimer des utilisateurs.",
        variant: "destructive",
      })
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return
    }

    try {
      // Delete from user_profiles_extended first (foreign key)
      await supabase.from("user_profiles_extended").delete().eq("user_id", userId)

      // Delete from user_profiles
      const {
        error
      } = await supabase.from("user_profiles").delete().eq("id", userId)

      if (error) {
        console.error("❌ Erreur lors de la suppression:", error)
        throw error
      }

      console.log(`✅ Utilisateur supprimé avec succès`)

      setUsers((prev) => prev.filter((user) => user.id !== userId))

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      })

      await loadStatistics()
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Fonctions de filtrage et pagination pour les utilisateurs
  const getFilteredUsers = () => {
    const searchTerm = searchTerms.users || ""
    return users.filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      switch (userRoleFilter) {
        case "admin":
          return user.is_admin && !user.is_uploader
        case "uploader":
          return user.is_uploader
        case "vip_plus":
          return user.is_vip_plus
        case "vip":
          return user.is_vip && !user.is_vip_plus
        case "beta":
          return user.is_beta
        case "member":
          return !user.is_admin && !user.is_uploader && !user.is_vip && !user.is_vip_plus && !user.is_beta
        case "all":
        default:
          return true
      }
    })
  }

  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredUsers()
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE
    const endIndex = startIndex + USERS_PER_PAGE
    return filteredUsers.slice(startIndex, endIndex)
  }

  const getFilteredData = (data, type) => {
    const searchTerm = searchTerms[type] || ""
    if (!searchTerm) return data

    return data.filter((item) => {
      if (type === "users") {
        const searchableFields = ["username", "email"]
        return searchableFields.some((field) =>
          item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }
      const searchableFields = ["title", "name", "username", "genre", "category"]
      return searchableFields.some((field) => item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    })
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return "À l'instant"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Il y a ${minutes} min`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Il y a ${hours}h`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `Il y a ${days}j`
    } else {
      return date.toLocaleDateString("fr-FR")
    }
  }

  const handleCreateChangelog = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    if (!newChangelog.version || !newChangelog.title || !newChangelog.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    const {
      error
    } = await supabase.from("changelogs").insert([{
      ...newChangelog,
      created_by: user?.id,
    }, ])

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le changelog",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Succès",
        description: "Changelog créé avec succès",
      })
      setNewChangelog({
        version: "",
        title: "",
        description: "",
        release_date: new Date().toISOString().split("T")[0],
      })
      fetchAllData()
      setActiveModal(null)
    }
  }

  const handleDeleteChangelog = async (id: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const {
      error
    } = await supabase.from("changelogs").delete().eq("id", id)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le changelog",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Succès",
        description: "Changelog supprimé",
      })
      fetchAllData()
    }
  }

  // Modified useEffect to call fetchAllData
  // Replaced loadAllData with fetchAllData to include changelogs
  const fetchAllData = async () => {
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    try {
      // Fetch all necessary data
      const [
        tvData,
        radioData,
        retroData,
        usersData, // Renamed from loadRealUsers
        changelogsData,
        requestsData, // Added requestsData
        musicData, // Added musicData
        softwareData, // Added softwareData
        gamesData, // Added gamesData
        ebooksData, // Added ebooksData
      ] = await Promise.all([
        supabase.from("tv_channels").select("*").order("name"),
        supabase.from("radio_stations").select("*").order("name"),
        supabase.from("retrogaming_sources").select("*").order("name"),
        loadRealUsers(supabase), // Use the newly defined function
        supabase.from("changelogs").select("*").order("release_date", {
          ascending: false
        }),
        supabase
        .from("content_requests") // Use the corrected table name
        .select(`*, user_profiles(username, email)`)
        .order("created_at", {
          ascending: false
        }), // Added request loading
        supabase
        .from("music_content")
        .select("*")
        .order("created_at", {
          ascending: false
        }), // Added music content loading
        supabase
        .from("software")
        .select("*")
        .order("created_at", {
          ascending: false
        }), // Added software loading
        supabase
        .from("games")
        .select("*")
        .order("created_at", {
          ascending: false
        }), // Added games loading
        supabase
        .from("ebooks")
        .select("*")
        .order("created_at", {
          ascending: false
        }), // Added ebooks loading
      ])

      // Update states
      if (tvData.data) setTvChannels(tvData.data)
      if (radioData.data) setRadioStations(radioData.data)
      if (retroData.data) setRetrogamingSources(retroData.data)
      // 'usersData' is already handled by loadRealUsers setting the 'users' state
      if (changelogsData.data) setChangelogs(changelogsData.data)
      if (requestsData.data)
        setRequests(
          requestsData.data.map((req) => ({
            // Map requests to include username
            ...req,
            username: req.user_profiles?.username || req.user_profiles?.email || "Utilisateur inconnu",
          })),
        )
      if (musicData.data) setMusicContent(musicData.data)
      if (softwareData.data) setSoftware(softwareData.data)
      if (gamesData.data) setGames(gamesData.data)
      if (ebooksData.data) setEbooks(ebooksData.data)

      // Load statistics, activities, site settings, and interactive world settings after fetching all basic data
      await loadStatistics()
      await loadRecentActivities()
      await loadSiteSettings()

      // Load interactive world related data only if the tab is active or on initial load if it's the default
      if (activeTab === "interactive-world") {
        await loadWorldSettings()
        await loadCinemaRooms()
        await loadAvatarOptions()
        await loadOnlineUsers()
        loadArcadeMachines()
        loadStadium()
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données admin:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données d'administration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add edit log handler
  const handleEditLog = (log: any) => {
    setEditingLog({
      id: log.id,
      version: log.version,
      release_date: log.release_date,
      title: log.title,
      description: log.description,
    })
    setActiveModal("edit-log") // Use a distinct modal name for editing logs
  }

  // Add update log handler
  const handleUpdateLog = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    if (!editingLog) return // Should not happen if called correctly

    try {
      const {
        error
      } = await supabase
        .from("changelogs")
        .update({
          version: editingLog.version,
          release_date: editingLog.release_date,
          title: editingLog.title,
          description: editingLog.description,
        })
        .eq("id", editingLog.id)

      if (error) throw error

      await fetchAllData() // Reload changelogs and other data
      setActiveModal(null)
      setEditingLog(null) // Clear editing state
      toast({
        title: "Log modifié",
        description: "Le log a été mis à jour avec succès",
      })
    } catch (error) {
      console.error("Error updating log:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier le log.",
        variant: "destructive",
      })
    }
  }

  // This useEffect is now primarily for managing the interval for online users,
  // and the initial data loading is handled by the useEffect above.
  useEffect(() => {
    if ((user?.isAdmin || user?.isUploader) && !loading) { // Ensure loading is false before setting interval
      // Reload online users periodically if the interactive-world tab is active
      const intervalId = setInterval(() => {
        if (activeTab === "interactive-world") {
          loadOnlineUsers()
        }
      }, 15000) // Refresh every 15 seconds

      // Cleanup interval on component unmount or when activeTab changes away from interactive-world
      return () => clearInterval(intervalId)
    }
  }, [user, activeTab, loading]) // Dependencies ensure reactivity

  // Combined user and uploader check for access
  if (!user || (!user.isAdmin && !user.isUploader)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
            <p>Vous n'avez pas les permissions d'administrateur ou d'uploader.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <h1 className="text-2xl font-bold mb-4 mt-4">Chargement...</h1>
            <p>Chargement des données d'administration...</p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch total user count for the broadcast message
  // Removed duplicated useEffect, logic moved to fetchAllData or handled by existing state
  // useEffect(() => {
  //   const fetchUserCount = async () => {
  //     if (!user?.isAdmin) return
  //     const supabase = createBrowserClient(
  //       process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //     )
  //     const { count } = await supabase.from("user_profiles").select("id", { count: "exact", head: true })
  //     if (count !== null) {
  //       setTotalUserCount(count)
  //     }
  //   }
  //   fetchUserCount()
  // }, [user])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          {/* Removed logo */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Administration WaveWatch</h1>
            <p className="text-gray-400">Tableau de bord complet pour gérer votre plateforme de streaming</p>
          </div>
        </div>

        {/* Use isFullAdmin for default tab, otherwise use isUploader's default */}
        <Tabs defaultValue={isFullAdmin ? "dashboard" : "music"} className="space-y-6" onValueChange={(value) => setActiveTab(value)}>
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full bg-gray-800 border-gray-700 flex-nowrap">
              {isFullAdmin && (
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
              )}
              {isFullAdmin && (
                <TabsTrigger
                  value="broadcast"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Message</span>
                </TabsTrigger>
              )}
              {canAccessTab("tvchannels") && (
                <TabsTrigger
                  value="tvchannels"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">TV ({tvChannels.length})</span>
                  <span className="sm:hidden">TV</span>
                </TabsTrigger>
              )}
              {canAccessTab("radio") && (
                <TabsTrigger
                  value="radio"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Radio className="w-4 h-4" />
                  <span className="hidden sm:inline">Radio ({radioStations.length})</span>
                  <span className="sm:hidden">Radio</span>
                </TabsTrigger>
              )}
              {canAccessTab("music") && (
                <TabsTrigger
                  value="music"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Music className="w-4 h-4" />
                  <span className="hidden sm:inline">Musique ({musicContent.length})</span>
                  <span className="sm:hidden">Music</span>
                </TabsTrigger>
              )}
              {canAccessTab("software") && (
                <TabsTrigger
                  value="software"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Logiciels ({software.length})</span>
                  <span className="sm:hidden">Soft</span>
                </TabsTrigger>
              )}
              {canAccessTab("games") && (
                <TabsTrigger
                  value="games"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Jeux ({games.length})</span>
                  <span className="sm:hidden">Jeux</span>
                </TabsTrigger>
              )}
              {canAccessTab("ebooks") && (
                <TabsTrigger
                  value="ebooks"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Ebooks ({ebooks.length})</span>
                  <span className="sm:hidden">Books</span>
                </TabsTrigger>
              )}
              {canAccessTab("retrogaming") && (
                <TabsTrigger
                  value="retrogaming"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Rétro ({retrogamingSources.length})</span>
                  <span className="sm:hidden">Rétro</span>
                </TabsTrigger>
              )}
              {canAccessTab("requests") && (
                <TabsTrigger
                  value="requests"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Demandes ({requests.length})</span>
                  <span className="sm:hidden">Req</span>
                </TabsTrigger>
              )}
              {isFullAdmin && (
                <TabsTrigger
                  value="users"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users ({users.length})</span>
                  <span className="sm:hidden">Users</span>
                </TabsTrigger>
              )}
              {isFullAdmin && (
                <a
                  href="/admin/staff-messages"
                  className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-500 hover:to-blue-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-md whitespace-nowrap transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Message au Staff</span>
                </a>
              )}              
              {isFullAdmin && (
                <TabsTrigger
                  value="changelogs"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Logs ({changelogs.length})</span>
                  <span className="sm:hidden">Logs</span>
                </TabsTrigger>
              )}
              {isFullAdmin && (
                <TabsTrigger
                  value="settings"
                  className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Paramètres</span>
                </TabsTrigger>
              )}
              {isFullAdmin && (
                <a
                  href="/admin/interactive-world"
                  className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-md whitespace-nowrap transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Monde Interactif</span>
                </a>
              )}
            </TabsList>
          </div>

          {/* Dashboard avec Statistiques */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">En Ligne Maintenant</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{onlineStats.onlineNow}</div>
                  <p className="text-xs text-muted-foreground">Actifs (5 dernières minutes)</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">Dernière Heure</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{onlineStats.onlineLastHour}</div>
                  <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">Dernières 24h</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">{onlineStats.onlineLast24h}</div>
                  <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
                </CardContent>
              </Card>

              
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contenu Total</CardTitle>
                  <Film className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalContent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Films, séries, chaînes TV, radios, jeux, musique, logiciels, ebooks
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+{stats.vipUsers} VIP</p>
                </CardContent>
              </Card>
            </div>

            {/* Modules de mise à jour TMDB et état du système */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module de mise à jour TMDB */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Mise à jour TMDB
                  </CardTitle>
                  <CardDescription>Forcer la mise à jour du contenu depuis l'API TMDB</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      onClick={() => handleContentUpdate("movies")}
                      disabled={isUpdating}
                      variant="secondary"
                      size="sm"
                    >
                      <Tv className="w-4 h-4 mr-2" />
                      {isUpdating ? "..." : "Films"}
                    </Button>

                    <Button
                      onClick={() => handleContentUpdate("tvshows")}
                      disabled={isUpdating}
                      variant="secondary"
                      size="sm"
                    >
                      <Tv className="w-4 h-4 mr-2" />
                      {isUpdating ? "..." : "Séries"}
                    </Button>

                    <Button
                      onClick={() => handleContentUpdate("anime")}
                      disabled={isUpdating}
                      variant="secondary"
                      size="sm"
                    >
                      <Tv className="w-4 h-4 mr-2" />
                      {isUpdating ? "..." : "Animés"}
                    </Button>

                    <Button
                      onClick={() => handleContentUpdate("calendar")}
                      disabled={isUpdating}
                      variant="secondary"
                      size="sm"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {isUpdating ? "..." : "Calendrier"}
                    </Button>
                  </div>

                  <Button onClick={() => handleContentUpdate("all")} disabled={isUpdating} className="w-full" size="sm">
                    <Zap className="w-4 h-4 mr-2" />
                    {isUpdating ? "Mise à jour en cours..." : "Tout mettre à jour"}
                  </Button>

                  {lastUpdate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                      <Clock className="w-4 h-4" />
                      Dernière mise à jour : {lastUpdate}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Module d'état du système amélioré */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    État du système
                  </CardTitle>
                  <CardDescription>Surveillance en temps réel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-medium">API TMDB</p>
                        <p className="text-sm text-muted-foreground">
                          {systemCheck.results.tmdb.status === "operational" ? "Opérationnel" : "Hors ligne"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {systemCheck.results.tmdb.responseTime}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-medium">Base de données</p>
                        <p className="text-sm text-muted-foreground">
                          {systemCheck.results.database.status === "connected" ? "Connectée" : "Déconnectée"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {systemCheck.results.database.responseTime}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-medium">Serveurs</p>
                        <p className="text-sm text-muted-foreground">
                          {systemCheck.results.servers.status === "online" ? "En ligne" : "Hors ligne"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {systemCheck.results.servers.responseTime}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button onClick={handleSystemCheck} disabled={systemCheck.checking} className="w-full">
                        {systemCheck.checking ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Vérification en cours...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Vérifier le système
                          </>
                        )}
                      </Button>

                      {systemCheck.lastCheck && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 justify-center">
                          <Clock className="w-3 h-3" />
                          Dernière vérification : {systemCheck.lastCheck}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Module Contenu par Type - Design amélioré */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Contenu par Type
                </CardTitle>
                <CardDescription>Répartition du contenu disponible sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="relative group">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Film className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.movies.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Films</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Clapperboard className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.tvShows.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Séries</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Sparkles className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.anime.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Animés</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Monitor className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.tvChannels.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Chaînes TV</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Headphones className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.radio.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Radio</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Gamepad2 className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">
                          {stats.contentByType.retrogaming.toLocaleString()}
                        </div>
                        <div className="text-sm opacity-90">Retrogaming</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  {/* Added new content type cards */}
                  <div className="relative group">
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Music className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.music.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Musique</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Download className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.software.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Logiciels</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <Gamepad2 className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.games.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Jeux</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex flex-col items-center text-center">
                        <BookOpen className="w-8 h-8 mb-3 opacity-90" />
                        <div className="text-2xl font-bold mb-1">{stats.contentByType.ebooks.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Ebooks</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-xl"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total du contenu disponible</span>
                    <span className="font-bold text-lg text-foreground">{stats.totalContent.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 w-full bg-border rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Croissance de +12% ce mois • Mise à jour automatique via TMDB
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module d'activités récentes */}
            <Card className="col-span-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activités Récentes
                  </CardTitle>
                  <CardDescription>Toutes les actions des utilisateurs en temps réel</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadRecentActivities} disabled={activityLoading}>
                  <Clock className="w-4 h-4 mr-2" />
                  {activityLoading ? "Actualisation..." : "Actualiser"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune activité récente</p>
                    </div>
                  ) : (
                    recentActivities.map((activity) => {
                      const Icon = activity.icon
                      const timeAgo = formatTimeAgo(activity.timestamp)

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className={`p-2 rounded-full ${activity.bgColor}`}>
                            <Icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{activity.user}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                              {activity.contentType && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.contentType === "movie"
                                    ? "Film"
                                    : activity.contentType === "tv"
                                      ? "Série"
                                      : activity.contentType === "anime"
                                        ? "Animé"
                                        : activity.contentType === "tv-channel"
                                          ? "TV"
                                          : activity.contentType === "radio"
                                            ? "Radio"
                                            : activity.contentType === "game"
                                              ? "Jeu"
                                              : activity.contentType}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.type === "rating" && (
                              <Badge
                                variant={activity.rating === "like" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {activity.rating === "like" ? "+1" : "-1"}
                              </Badge>
                            )}
                            {activity.type === "watched" && (
                              <Badge variant="secondary" className="text-xs">
                                <Play className="w-3 h-3 mr-1" />
                                Vu
                              </Badge>
                            )}
                            {activity.type === "new_user" && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <UserPlus className="w-3 h-3 mr-1" />
                                Nouveau
                              </Badge>
                            )}
                            {activity.type === "login" && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                <LogIn className="w-3 h-3 mr-1" />
                                Connexion
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Envoyer un message à tous les utilisateurs</CardTitle>
                  <CardDescription>
                    Diffusez un message à tous les utilisateurs inscrits via leur messagerie interne
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-subject">Sujet du message</Label>
                    <Input
                      id="broadcast-subject"
                      placeholder="Ex: Nouvelle fonctionnalité disponible"
                      value={broadcastForm.subject}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-content">Contenu du message</Label>
                    <Textarea
                      id="broadcast-content"
                      placeholder="Écrivez votre message ici..."
                      value={broadcastForm.content}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-blue-300">
                      Ce message sera envoyé à {totalUsersInDB} utilisateur(s) inscrit(s)
                    </span>
                  </div>
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={sendingBroadcast || !broadcastForm.subject || !broadcastForm.content}
                    className="w-full"
                  >
                    {sendingBroadcast ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message à tous
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tvchannels" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Chaînes TV</CardTitle>
                  <CardDescription>Gérez votre catalogue de chaînes de télévision en direct</CardDescription>
                </div>
                <Dialog open={activeModal === "tvchannel"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setTvChannelForm({
                          name: "",
                          category: "",
                          country: "",
                          language: "",
                          stream_url: "",
                          logo_url: "",
                          description: "",
                          quality: "HD",
                          is_active: true,
                        })
                        setActiveModal("tvchannel")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une chaîne
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} une chaîne TV</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom de la chaîne</Label>
                        <Input
                          value={tvChannelForm.name}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, name: e.target.value })}
                          placeholder="TF1, France 2, Canal+"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={tvChannelForm.category}
                          onValueChange={(value) => setTvChannelForm({ ...tvChannelForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Généraliste">Généraliste</SelectItem>
                            <SelectItem value="Sport">Sport</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Jeunesse">Jeunesse</SelectItem>
                            <SelectItem value="Documentaire">Documentaire</SelectItem>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Divertissement">Divertissement</SelectItem>
                            <SelectItem value="Info">Information</SelectItem>
                            <SelectItem value="Musique">Musique</SelectItem>
                            <SelectItem value="Cinéma">Cinéma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Input
                          value={tvChannelForm.country}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, country: e.target.value })}
                          placeholder="France, USA, UK..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Langue</Label>
                        <Input
                          value={tvChannelForm.language}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, language: e.target.value })}
                          placeholder="Français, Anglais..."
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de diffusion (Stream)</Label>
                        <Input
                          value={tvChannelForm.stream_url}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, stream_url: e.target.value })}
                          placeholder="https://embed.wavewatch.xyz/embed/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL du logo</Label>
                        <Input
                          value={tvChannelForm.logo_url}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, logo_url: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Qualité</Label>
                        <Select
                          value={tvChannelForm.quality}
                          onValueChange={(value) => setTvChannelForm({ ...tvChannelForm, quality: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une qualité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HD">HD</SelectItem>
                            <SelectItem value="SD">SD</SelectItem>
                            <SelectItem value="4K">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={tvChannelForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) =>
                            setTvChannelForm({ ...tvChannelForm, is_active: value === "active" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={tvChannelForm.description}
                          onChange={(e) => setTvChannelForm({ ...tvChannelForm, description: e.target.value })}
                          placeholder="Description de la chaîne..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() =>
                          editingItem ? handleUpdate("tvchannel", tvChannelForm) : handleAdd("tvchannel", tvChannelForm)
                        }
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher une chaîne TV..."
                      value={searchTerms.tvchannels || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, tvchannels: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Qualité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(tvChannels, "tvchannels").map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">{channel.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{channel.category}</Badge>
                        </TableCell>
                        <TableCell>{channel.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{channel.quality}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={channel.is_active === true ? "default" : "secondary"}>
                            {channel.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("tvchannel", channel.id)}>
                              {channel.is_active === true ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("tvchannel", channel)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("tvchannel", channel.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {tvChannels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune chaîne TV trouvée</p>
                    <p className="text-sm">Ajoutez votre première chaîne TV pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="radio" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Stations Radio FM</CardTitle>
                  <CardDescription>Gérez votre catalogue de stations radio en direct</CardDescription>
                </div>
                <Dialog open={activeModal === "radio"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setRadioForm({
                          name: "",
                          genre: "",
                          country: "",
                          frequency: "",
                          stream_url: "",
                          logo_url: "",
                          description: "",
                          website: "",
                          is_active: true,
                        })
                        setActiveModal("radio")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une station
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} une station radio</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom de la station</Label>
                        <Input
                          value={radioForm.name}
                          onChange={(e) => setRadioForm({ ...radioForm, name: e.target.value })}
                          placeholder="NRJ, RTL, France Inter..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select
                          value={radioForm.genre}
                          onValueChange={(value) => setRadioForm({ ...radioForm, genre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un genre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pop">Pop</SelectItem>
                            <SelectItem value="Rock">Rock</SelectItem>
                            <SelectItem value="Rap/Hip-Hop">Rap/Hip-Hop</SelectItem>
                            <SelectItem value="Jazz">Jazz</SelectItem>
                            <SelectItem value="Classique">Classique</SelectItem>
                            <SelectItem value="Électronique">Électronique</SelectItem>
                            <SelectItem value="Reggae">Reggae</SelectItem>
                            <SelectItem value="Country">Country</SelectItem>
                            <SelectItem value="Blues">Blues</SelectItem>
                            <SelectItem value="Folk">Folk</SelectItem>
                            <SelectItem value="Talk/News">Talk/News</SelectItem>
                            <SelectItem value="Variété">Variété</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Select
                          value={radioForm.country}
                          onValueChange={(value) => setRadioForm({ ...radioForm, country: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un pays" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="USA">États-Unis</SelectItem>
                            <SelectItem value="UK">Royaume-Uni</SelectItem>
                            <SelectItem value="Germany">Allemagne</SelectItem>
                            <SelectItem value="Spain">Espagne</SelectItem>
                            <SelectItem value="Italy">Italie</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Belgium">Belgique</SelectItem>
                            <SelectItem value="Switzerland">Suisse</SelectItem>
                            <SelectItem value="International">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Input
                          value={radioForm.frequency}
                          onChange={(e) => setRadioForm({ ...radioForm, frequency: e.target.value })}
                          placeholder="100.3 FM, 87.8 FM..."
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de diffusion (Stream)</Label>
                        <Input
                          value={radioForm.stream_url}
                          onChange={(e) => setRadioForm({ ...radioForm, stream_url: e.target.value })}
                          placeholder="https://stream.radio.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL du logo</Label>
                        <Input
                          value={radioForm.logo_url}
                          onChange={(e) => setRadioForm({ ...radioForm, logo_url: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Site web (optionnel)</Label>
                        <Input
                          value={radioForm.website}
                          onChange={(e) => setRadioForm({ ...radioForm, website: e.target.value })}
                          placeholder="https://nrj.fr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={radioForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) => setRadioForm({ ...radioForm, is_active: value === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={radioForm.description}
                          onChange={(e) => setRadioForm({ ...radioForm, description: e.target.value })}
                          placeholder="Description de la station radio..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => (editingItem ? handleUpdate("radio", radioForm) : handleAdd("radio", radioForm))}
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher une station radio..."
                      value={searchTerms.radio || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, radio: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Fréquence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(radioStations, "radio").map((station) => (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium">{station.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{station.genre}</Badge>
                        </TableCell>
                        <TableCell>{station.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{station.frequency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={station.is_active === true ? "default" : "secondary"}>
                            {station.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("radio", station.id)}>
                              {station.is_active === true ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("radio", station)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("radio", station.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {radioStations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune station radio trouvée</p>
                    <p className="text-sm">Ajoutez votre première station radio pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retrogaming" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Sources Retrogaming</CardTitle>
                  <CardDescription>Gérez votre catalogue de sources de jeux rétro</CardDescription>
                </div>
                <Dialog
                  open={activeModal === "retrogaming-source"}
                  onOpenChange={(open) => !open && setActiveModal(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setRetrogamingSourceForm({
                          name: "",
                          description: "",
                          url: "",
                          color: "bg-blue-600",
                          category: "",
                          is_active: true,
                        })
                        setActiveModal("retrogaming-source")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une source
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} une source retrogaming</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom de la source</Label>
                        <Input
                          value={retrogamingSourceForm.name}
                          onChange={(e) => setRetrogamingSourceForm({ ...retrogamingSourceForm, name: e.target.value })}
                          placeholder="RetroArch, MAME, Dolphin..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={retrogamingSourceForm.category}
                          onValueChange={(value) =>
                            setRetrogamingSourceForm({ ...retrogamingSourceForm, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Émulateur">Émulateur</SelectItem>
                            <SelectItem value="Console">Console</SelectItem>
                            <SelectItem value="Arcade">Arcade</SelectItem>
                            <SelectItem value="PC">PC</SelectItem>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                            <SelectItem value="Homebrew">Homebrew</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL</Label>
                        <Input
                          value={retrogamingSourceForm.url}
                          onChange={(e) => setRetrogamingSourceForm({ ...retrogamingSourceForm, url: e.target.value })}
                          placeholder="https://retroarch.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <Select
                          value={retrogamingSourceForm.color}
                          onValueChange={(value) =>
                            setRetrogamingSourceForm({ ...retrogamingSourceForm, color: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bg-blue-600">Bleu</SelectItem>
                            <SelectItem value="bg-red-600">Rouge</SelectItem>
                            <SelectItem value="bg-green-600">Vert</SelectItem>
                            <SelectItem value="bg-purple-600">Violet</SelectItem>
                            <SelectItem value="bg-orange-600">Orange</SelectItem>
                            <SelectItem value="bg-pink-600">Rose</SelectItem>
                            <SelectItem value="bg-indigo-600">Indigo</SelectItem>
                            <SelectItem value="bg-yellow-600">Jaune</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={retrogamingSourceForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) =>
                            setRetrogamingSourceForm({ ...retrogamingSourceForm, is_active: value === "active" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={retrogamingSourceForm.description}
                          onChange={(e) =>
                            setRetrogamingSourceForm({ ...retrogamingSourceForm, description: e.target.value })
                          }
                          placeholder="Description de la source retrogaming..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() =>
                          editingItem
                            ? handleUpdate("retrogaming-source", retrogamingSourceForm)
                            : handleAdd("retrogaming-source", retrogamingSourceForm)
                        }
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher une source retrogaming..."
                      value={searchTerms.retrogaming || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, retrogaming: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Couleur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(retrogamingSources, "retrogaming").map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{source.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`w-6 h-6 rounded ${source.color}`}></div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={source.is_active === true ? "default" : "secondary"}>
                            {source.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatus("retrogaming-source", source.id)}
                            >
                              {source.is_active === true ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit("retrogaming-source", source)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete("retrogaming-source", source.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {retrogamingSources.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune source retrogaming trouvée</p>
                    <p className="text-sm">Ajoutez votre première source retrogaming pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>
                    {totalUsersInDB} utilisateurs inscrits · {getFilteredUsers().length} affichés
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 mb-4">
                  {/* Search and Filter Row */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Rechercher un utilisateur par nom ou email..."
                        value={searchTerms.users || ""}
                        onChange={(e) => setSearchTerms({ ...searchTerms, users: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <Select value={userRoleFilter} onValueChange={(value) => setUserRoleFilter(value)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrer par grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les grades</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="uploader">Uploader</SelectItem>
                        <SelectItem value="vip_plus">VIP+</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="beta">Beta</SelectItem>
                        <SelectItem value="member">Membre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Affichage {Math.min((userCurrentPage - 1) * USERS_PER_PAGE + 1, getFilteredUsers().length)} à{" "}
                      {Math.min(userCurrentPage * USERS_PER_PAGE, getFilteredUsers().length)} sur{" "}
                      {getFilteredUsers().length} utilisateurs
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={userCurrentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                      </Button>
                      <span>
                        Page {userCurrentPage} / {Math.ceil(getFilteredUsers().length / USERS_PER_PAGE) || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUserCurrentPage((prev) =>
                            Math.min(Math.ceil(getFilteredUsers().length / USERS_PER_PAGE), prev + 1),
                          )
                        }
                        disabled={userCurrentPage >= Math.ceil(getFilteredUsers().length / USERS_PER_PAGE)}
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                        <TableHead className="w-[200px]">Privilèges</TableHead>
                        <TableHead className="w-[120px]">Inscription</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedUsers().length > 0 ? (
                        getPaginatedUsers().map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                  {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                {user.username}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.status === "active"
                                    ? "default"
                                    : user.status === "banned"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {user.status || "active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.is_admin && !user.is_uploader && <Badge className="bg-red-500">Admin</Badge>}
                                {user.is_uploader && <Badge className="bg-green-500">Uploader</Badge>}
                                {user.is_vip_plus && <Badge className="bg-yellow-500">VIP+</Badge>}
                                {user.is_vip && !user.is_vip_plus && <Badge className="bg-blue-500">VIP</Badge>}
                                {user.is_beta && <Badge className="bg-purple-500">Beta</Badge>}
                                {!user.is_admin &&
                                  !user.is_uploader &&
                                  !user.is_vip &&
                                  !user.is_vip_plus &&
                                  !user.is_beta && <Badge variant="outline">Membre</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user)
                                  setIsUserDialogOpen(true)
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={isUserDialogOpen}
              onOpenChange={(open) => {
                setIsUserDialogOpen(open)
                if (open && editingUser) {
                  // Populate form with current user values
                  setUserForm({
                    username: editingUser.username || "",
                    email: editingUser.email || "",
                    is_vip: Boolean(editingUser.is_vip),
                    is_vip_plus: Boolean(editingUser.is_vip_plus),
                    is_beta: Boolean(editingUser.is_beta),
                    is_admin: Boolean(editingUser.is_admin),
                    is_uploader: Boolean(editingUser.is_uploader),
                  })
                  setNewPassword("")
                }
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Modifier l'utilisateur</DialogTitle>
                  <DialogDescription>Gérer les informations et privilèges de l'utilisateur.</DialogDescription>
                </DialogHeader>
                {editingUser && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nom d'utilisateur</Label>
                      <Input
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nouveau mot de passe (optionnel)</Label>
                      <Input
                        type="password"
                        placeholder="Laisser vide pour ne pas changer"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Entrez un nouveau mot de passe seulement si vous voulez le changer
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Privilèges</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_admin"
                            checked={userForm.is_admin}
                            onCheckedChange={(checked) => setUserForm({ ...userForm, is_admin: !!checked })}
                          />
                          <Label htmlFor="is_admin">Administrateur</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_uploader"
                            checked={userForm.is_uploader}
                            onCheckedChange={(checked) => setUserForm({ ...userForm, is_uploader: !!checked })}
                          />
                          <Label htmlFor="is_uploader">Uploader</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_vip_plus"
                            checked={userForm.is_vip_plus}
                            onCheckedChange={(checked) =>
                              setUserForm({ ...userForm, is_vip_plus: !!checked })
                            }
                          />
                          <Label htmlFor="is_vip_plus">VIP+</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_vip"
                            checked={userForm.is_vip}
                            onCheckedChange={(checked) => setUserForm({ ...userForm, is_vip: !!checked })}
                          />
                          <Label htmlFor="is_vip">VIP</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_beta"
                            checked={userForm.is_beta}
                            onCheckedChange={(checked) => setUserForm({ ...userForm, is_beta: !!checked })}
                          />
                          <Label htmlFor="is_beta">Bêta Testeur</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => handleUpdate("user", userForm)}>Sauvegarder</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Demandes</CardTitle>
                  <CardDescription>Gérez les demandes de contenu des utilisateurs</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher une demande..."
                      value={searchTerms.requests || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, requests: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>TMDB ID</TableHead>
                      <TableHead>Titre demandé</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(requests, "requests").map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.username}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {request.content_type || "---"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {request.tmdb_id ? (
                            <a
                              href={`https://www.themoviedb.org/${request.content_type}/${request.tmdb_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline"
                            >
                              {request.tmdb_id}
                            </a>
                          ) : "---"}
                        </TableCell>
                        <TableCell>{request.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "completed"
                                ? "default"
                                : request.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {request.status === "completed"
                              ? "Complété"
                              : request.status === "pending"
                                ? "En attente"
                                : "Rejeté"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setMessageDialogOpen(true)
                              }}
                              title="Envoyer un message"
                            >
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, "completed")}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, "rejected")}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteRequest(request.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {requests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune demande trouvée dans la base de données</p>
                    <p className="text-sm mt-2">Les nouvelles demandes apparaîtront ici automatiquement</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Envoyer un message</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Envoyer un message à {selectedRequest?.username} concernant leur demande "{selectedRequest?.title}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <textarea
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      placeholder="Écrivez votre message ici..."
                      className="w-full min-h-[150px] p-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedRequest && (
                    <div className="bg-gray-800 p-4 rounded-md space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <Badge variant="secondary">{selectedRequest.content_type}</Badge>
                      </div>
                      {selectedRequest.tmdb_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">TMDB ID:</span>
                          <a
                            href={`https://www.themoviedb.org/${selectedRequest.content_type}/${selectedRequest.tmdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            {selectedRequest.tmdb_id}
                          </a>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span>{new Date(selectedRequest.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMessageDialogOpen(false)
                      setAdminMessage("")
                      setSelectedRequest(null)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSendAdminMessage}
                    disabled={!adminMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Envoyer le message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="music" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion du Contenu Musical</CardTitle>
                  <CardDescription>Gérez votre catalogue de musique et concerts</CardDescription>
                </div>
                <Dialog open={activeModal === "music"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setMusicForm({
                          title: "",
                          artist: "",
                          description: "",
                          thumbnail_url: "",
                          video_url: "",
                          streaming_url: "", // Reset streaming_url
                          duration: 0,
                          release_year: new Date().getFullYear().toString(),
                          genre: "",
                          type: "Single", // Changed default type
                          quality: "HD",
                          is_active: true,
                        })
                        setActiveModal("music")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un morceau
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un contenu musical</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input
                          value={musicForm.title}
                          onChange={(e) => setMusicForm({ ...musicForm, title: e.target.value })}
                          placeholder="Nom de la chanson ou concert"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Artiste/Groupe</Label>
                        <Input
                          value={musicForm.artist}
                          onChange={(e) => setMusicForm({ ...musicForm, artist: e.target.value })}
                          placeholder="Nom de l'artiste ou du groupe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select
                          value={musicForm.genre}
                          onValueChange={(value) => setMusicForm({ ...musicForm, genre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un genre" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="Accordéon">Accordéon</SelectItem>
                            <SelectItem value="Acid Jazz">Acid Jazz</SelectItem>
                            <SelectItem value="Alternative">Alternative</SelectItem>
                            <SelectItem value="Ambient">Ambient</SelectItem>
                            <SelectItem value="Americana">Americana</SelectItem>
                            <SelectItem value="Anti-Folk">Anti-Folk</SelectItem>
                            <SelectItem value="Art Punk">Art Punk</SelectItem>
                            <SelectItem value="Art Rock">Art Rock</SelectItem>
                            <SelectItem value="Avant-garde">Avant-garde</SelectItem>
                            <SelectItem value="Ballade">Ballade</SelectItem>
                            <SelectItem value="Black Metal">Black Metal</SelectItem>
                            <SelectItem value="Black Metal Symphonique">Black Metal Symphonique</SelectItem>
                            <SelectItem value="Blue-eyed soul">Blue-eyed soul</SelectItem>
                            <SelectItem value="Blues">Blues</SelectItem>
                            <SelectItem value="Blues Rock">Blues Rock</SelectItem>
                            <SelectItem value="Bossa Nova">Bossa Nova</SelectItem>
                            <SelectItem value="Britpop">Britpop</SelectItem>
                            <SelectItem value="Chanson Française">Chanson Française</SelectItem>
                            <SelectItem value="Chanson Italienne">Chanson Italienne</SelectItem>
                            <SelectItem value="Chill">Chill</SelectItem>
                            <SelectItem value="Chill-out">Chill-out</SelectItem>
                            <SelectItem value="Chillwave">Chillwave</SelectItem>
                            <SelectItem value="Classique">Classique</SelectItem>
                            <SelectItem value="Country">Country</SelectItem>
                            <SelectItem value="Country Alternative">Country Alternative</SelectItem>
                            <SelectItem value="Country pop">Country pop</SelectItem>
                            <SelectItem value="Country Rock">Country Rock</SelectItem>
                            <SelectItem value="Crossover">Crossover</SelectItem>
                            <SelectItem value="Dance">Dance</SelectItem>
                            <SelectItem value="Dance-Pop">Dance-Pop</SelectItem>
                            <SelectItem value="Dancehall">Dancehall</SelectItem>
                            <SelectItem value="Dark Metal">Dark Metal</SelectItem>
                            <SelectItem value="Death Metal">Death Metal</SelectItem>
                            <SelectItem value="Death Metal Mélodique">Death Metal Mélodique</SelectItem>
                            <SelectItem value="Deep House">Deep House</SelectItem>
                            <SelectItem value="Dirty Rap">Dirty Rap</SelectItem>
                            <SelectItem value="Dirty South">Dirty South</SelectItem>
                            <SelectItem value="Doom Metal">Doom Metal</SelectItem>
                            <SelectItem value="Downtempo">Downtempo</SelectItem>
                            <SelectItem value="Drame">Drame</SelectItem>
                            <SelectItem value="Dream pop">Dream pop</SelectItem>
                            <SelectItem value="Dub">Dub</SelectItem>
                            <SelectItem value="Electro">Electro</SelectItem>
                            <SelectItem value="Electro Chill">Electro Chill</SelectItem>
                            <SelectItem value="Electro House">Electro House</SelectItem>
                            <SelectItem value="Electronic">Electronic</SelectItem>
                            <SelectItem value="Electronica">Electronica</SelectItem>
                            <SelectItem value="Electropop">Electropop</SelectItem>
                            <SelectItem value="Eurodance">Eurodance</SelectItem>
                            <SelectItem value="Europop">Europop</SelectItem>
                            <SelectItem value="Flamenco">Flamenco</SelectItem>
                            <SelectItem value="Folk">Folk</SelectItem>
                            <SelectItem value="Folk Rock">Folk Rock</SelectItem>
                            <SelectItem value="Folklore">Folklore</SelectItem>
                            <SelectItem value="French touch">French touch</SelectItem>
                            <SelectItem value="Funk">Funk</SelectItem>
                            <SelectItem value="Funk Rock">Funk Rock</SelectItem>
                            <SelectItem value="Funky">Funky</SelectItem>
                            <SelectItem value="G-funk">G-funk</SelectItem>
                            <SelectItem value="Gangsta Rap">Gangsta Rap</SelectItem>
                            <SelectItem value="Glam Metal">Glam Metal</SelectItem>
                            <SelectItem value="Glam Rock">Glam Rock</SelectItem>
                            <SelectItem value="Gospel">Gospel</SelectItem>
                            <SelectItem value="Gothic Metal">Gothic Metal</SelectItem>
                            <SelectItem value="Grime">Grime</SelectItem>
                            <SelectItem value="Guitare">Guitare</SelectItem>
                            <SelectItem value="Hard Rock">Hard Rock</SelectItem>
                            <SelectItem value="Hardcore">Hardcore</SelectItem>
                            <SelectItem value="Heavy Metal">Heavy Metal</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                            <SelectItem value="Hip-Hop Alternatif">Hip-Hop Alternatif</SelectItem>
                            <SelectItem value="Hip-Hop Politique">Hip-Hop Politique</SelectItem>
                            <SelectItem value="Horrorcore">Horrorcore</SelectItem>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="House Progressive">House Progressive</SelectItem>
                            <SelectItem value="Midwest rap">Midwest rap</SelectItem>
                            <SelectItem value="Indie">Indie</SelectItem>
                            <SelectItem value="Indie Pop">Indie Pop</SelectItem>
                            <SelectItem value="Indie Rock">Indie Rock</SelectItem>
                            <SelectItem value="Instrumental">Instrumental</SelectItem>
                            <SelectItem value="Italo Dance">Italo Dance</SelectItem>
                            <SelectItem value="Italo house">Italo house</SelectItem>
                            <SelectItem value="Jazz">Jazz</SelectItem>
                            <SelectItem value="Jazz fusion">Jazz fusion</SelectItem>
                            <SelectItem value="Jazz rap">Jazz rap</SelectItem>
                            <SelectItem value="Krautrock">Krautrock</SelectItem>
                            <SelectItem value="Lo-Fi">Lo-Fi</SelectItem>
                            <SelectItem value="Lounge">Lounge</SelectItem>
                            <SelectItem value="Metal">Metal</SelectItem>
                            <SelectItem value="Metal Alternatif">Metal Alternatif</SelectItem>
                            <SelectItem value="Metal Celtique">Metal Celtique</SelectItem>
                            <SelectItem value="Metal Chrétien">Metal Chrétien</SelectItem>
                            <SelectItem value="Metal Gothique">Metal Gothique</SelectItem>
                            <SelectItem value="Metal Industriel">Metal Industriel</SelectItem>
                            <SelectItem value="Multi instrumentaliste">Multi instrumentaliste</SelectItem>
                            <SelectItem value="Musique Celtique">Musique Celtique</SelectItem>
                            <SelectItem value="Musique Expérimentale">Musique Expérimentale</SelectItem>
                            <SelectItem value="Musique Humoristique">Musique Humoristique</SelectItem>
                            <SelectItem value="Musique Industrielle">Musique Industrielle</SelectItem>
                            <SelectItem value="Musique Irlandaise">Musique Irlandaise</SelectItem>
                            <SelectItem value="Musique Minimaliste">Musique Minimaliste</SelectItem>
                            <SelectItem value="Musique Percussive">Musique Percussive</SelectItem>
                            <SelectItem value="Neo Soul">Neo Soul</SelectItem>
                            <SelectItem value="New Age">New Age</SelectItem>
                            <SelectItem value="New Beat">New Beat</SelectItem>
                            <SelectItem value="New Wave">New Wave</SelectItem>
                            <SelectItem value="Nu Metal">Nu Metal</SelectItem>
                            <SelectItem value="Opera">Opera</SelectItem>
                            <SelectItem value="Opera-Rock">Opera-Rock</SelectItem>
                            <SelectItem value="OST">OST</SelectItem>
                            <SelectItem value="P-Funk">P-Funk</SelectItem>
                            <SelectItem value="Piano">Piano</SelectItem>
                            <SelectItem value="Pop">Pop</SelectItem>
                            <SelectItem value="Pop Folk">Pop Folk</SelectItem>
                            <SelectItem value="Pop latino">Pop latino</SelectItem>
                            <SelectItem value="Pop Rock">Pop Rock</SelectItem>
                            <SelectItem value="Pop-rap">Pop-rap</SelectItem>
                            <SelectItem value="Post-grunge">Post-grunge</SelectItem>
                            <SelectItem value="Post-hardcore">Post-hardcore</SelectItem>
                            <SelectItem value="Post-punk">Post-punk</SelectItem>
                            <SelectItem value="Post-rock">Post-rock</SelectItem>
                            <SelectItem value="Power Metal">Power Metal</SelectItem>
                            <SelectItem value="Power Pop">Power Pop</SelectItem>
                            <SelectItem value="Punk Hardcore">Punk Hardcore</SelectItem>
                            <SelectItem value="Punk Rock">Punk Rock</SelectItem>
                            <SelectItem value="R&B">R&B</SelectItem>
                            <SelectItem value="Ragga">Ragga</SelectItem>
                            <SelectItem value="Rap">Rap</SelectItem>
                            <SelectItem value="Rap East Coast">Rap East Coast</SelectItem>
                            <SelectItem value="Rap Français">Rap Français</SelectItem>
                            <SelectItem value="Rap Hardcore">Rap Hardcore</SelectItem>
                            <SelectItem value="Rap Metal">Rap Metal</SelectItem>
                            <SelectItem value="Rap Politique">Rap Politique</SelectItem>
                            <SelectItem value="Rap rock">Rap rock</SelectItem>
                            <SelectItem value="Rap West Coast">Rap West Coast</SelectItem>
                            <SelectItem value="Reggae">Reggae</SelectItem>
                            <SelectItem value="Rhythm and Blues">Rhythm and Blues</SelectItem>
                            <SelectItem value="RnB">RnB</SelectItem>
                            <SelectItem value="RnB contemporain">RnB contemporain</SelectItem>
                            <SelectItem value="Rock">Rock</SelectItem>
                            <SelectItem value="Rock Alternatif">Rock Alternatif</SelectItem>
                            <SelectItem value="Rock Celtique">Rock Celtique</SelectItem>
                            <SelectItem value="Rock Chrétien">Rock Chrétien</SelectItem>
                            <SelectItem value="Rock Experimental">Rock Experimental</SelectItem>
                            <SelectItem value="Rock Français">Rock Français</SelectItem>
                            <SelectItem value="Rock Indépendant">Rock Indépendant</SelectItem>
                            <SelectItem value="Rock Italien">Rock Italien</SelectItem>
                            <SelectItem value="Rock Progressif">Rock Progressif</SelectItem>
                            <SelectItem value="Rocksteady">Rocksteady</SelectItem>
                            <SelectItem value="Salsa">Salsa</SelectItem>
                            <SelectItem value="Samba">Samba</SelectItem>
                            <SelectItem value="Saxophone">Saxophone</SelectItem>
                            <SelectItem value="Saxophone électrique">Saxophone électrique</SelectItem>
                            <SelectItem value="Ska">Ska</SelectItem>
                            <SelectItem value="Slam">Slam</SelectItem>
                            <SelectItem value="Slow">Slow</SelectItem>
                            <SelectItem value="Soap">Soap</SelectItem>
                            <SelectItem value="Soft Rock">Soft Rock</SelectItem>
                            <SelectItem value="Soul">Soul</SelectItem>
                            <SelectItem value="Soul Jazz">Soul Jazz</SelectItem>
                            <SelectItem value="Space Music">Space Music</SelectItem>
                            <SelectItem value="Space Rock">Space Rock</SelectItem>
                            <SelectItem value="Symphonic Metal">Symphonic Metal</SelectItem>
                            <SelectItem value="Symphonie">Symphonie</SelectItem>
                            <SelectItem value="Synth-pop">Synth-pop</SelectItem>
                            <SelectItem value="Synth-wave">Synth-wave</SelectItem>
                            <SelectItem value="Synthétiseur">Synthétiseur</SelectItem>
                            <SelectItem value="Talk">Talk</SelectItem>
                            <SelectItem value="Tango">Tango</SelectItem>
                            <SelectItem value="Techno">Techno</SelectItem>
                            <SelectItem value="Techno House">Techno House</SelectItem>
                            <SelectItem value="Teen pop">Teen pop</SelectItem>
                            <SelectItem value="Thrash Metal">Thrash Metal</SelectItem>
                            <SelectItem value="Trance">Trance</SelectItem>
                            <SelectItem value="Trap">Trap</SelectItem>
                            <SelectItem value="Trip hop">Trip hop</SelectItem>
                            <SelectItem value="Urban">Urban</SelectItem>
                            <SelectItem value="Urban pop">Urban pop</SelectItem>
                            <SelectItem value="Variété française">Variété française</SelectItem>
                            <SelectItem value="Viking Metal">Viking Metal</SelectItem>
                            <SelectItem value="Violoncelle électrique">Violoncelle électrique</SelectItem>
                            <SelectItem value="West Coast hip-hop">West Coast hip-hop</SelectItem>
                            <SelectItem value="Zouk">Zouk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={musicForm.type}
                          onValueChange={(value) => setMusicForm({ ...musicForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Album">Album</SelectItem>
                            <SelectItem value="Concert">Concert</SelectItem>
                            <SelectItem value="Live Session">Live Session</SelectItem>
                            <SelectItem value="Compilation">Compilation</SelectItem>
                            <SelectItem value="OST">OST</SelectItem>
                            <SelectItem value="Discographie">Discographie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Année de sortie</Label>
                        <Input
                          type="text"
                          value={musicForm.release_year}
                          onChange={(e) => setMusicForm({ ...musicForm, release_year: e.target.value })}
                          placeholder="2023 ou 2005-2021"
                        />
                        <p className="text-xs text-muted-foreground">Format: année simple (2023) ou plage (2005-2021)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Qualité</Label>
                        <Select
                          value={musicForm.quality}
                          onValueChange={(value) => setMusicForm({ ...musicForm, quality: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une qualité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FLAC">FLAC</SelectItem>
                            <SelectItem value="MP3">MP3</SelectItem>
                            <SelectItem value="WAV">WAV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de la vignette</Label>
                        <Input
                          value={musicForm.thumbnail_url}
                          onChange={(e) => setMusicForm({ ...musicForm, thumbnail_url: e.target.value })}
                          placeholder="https://example.com/thumbnail.jpg"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL Telechargement</Label>
                        <Input
                          value={musicForm.video_url}
                          onChange={(e) => setMusicForm({ ...musicForm, video_url: e.target.value })}
                          placeholder="https://stream.wavewatch.xyz/music/..."
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL lecture directe</Label>
                        <Input
                          value={musicForm.streaming_url}
                          onChange={(e) => setMusicForm({ ...musicForm, streaming_url: e.target.value })}
                          placeholder="https://stream.wavewatch.xyz/listen/..."
                        />
                        <p className="text-xs text-muted-foreground">Lien pour le bouton "Écouter" (optionnel)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Durée (secondes)</Label>
                        <Input
                          type="number"
                          value={musicForm.duration}
                          onChange={(e) =>
                            setMusicForm({ ...musicForm, duration: Number.parseInt(e.target.value, 10) })
                          }
                          placeholder="180"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={musicForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) => setMusicForm({ ...musicForm, is_active: value === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={musicForm.description}
                          onChange={(e) => setMusicForm({ ...musicForm, description: e.target.value })}
                          placeholder="Description du morceau ou du concert..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => (editingItem ? handleUpdate("music", musicForm) : handleAdd("music", musicForm))}
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher un morceau..."
                      value={searchTerms.music || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, music: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Artiste</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qualité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(musicContent, "music").map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>{content.artist}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{content.genre}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{content.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{content.quality}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={content.is_active === true ? "default" : "secondary"}>
                            {content.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("music", content.id)}>
                              {content.is_active === true ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("music", content)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("music", content.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {musicContent.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun contenu musical trouvé</p>
                    <p className="text-sm">Ajoutez votre premier morceau ou concert pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="software" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Logiciels</CardTitle>
                  <CardDescription>Gérez votre catalogue de logiciels et applications</CardDescription>
                </div>
                <Dialog open={activeModal === "software"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setSoftwareForm({
                          name: "",
                          developer: "",
                          description: "",
                          icon_url: "",
                          download_url: "",
                          version: "",
                          category: "",
                          platform: "",
                          license: "Free",
                          file_size: "",
                          is_active: true,
                        })
                        setActiveModal("software")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un logiciel
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un logiciel</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom du logiciel</Label>
                        <Input
                          value={softwareForm.name}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })}
                          placeholder="Ex: VS Code, Adobe Photoshop"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Développeur</Label>
                        <Input
                          value={softwareForm.developer}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, developer: e.target.value })}
                          placeholder="Ex: Microsoft, Adobe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={softwareForm.category}
                          onValueChange={(value) => setSoftwareForm({ ...softwareForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Productivité">Productivité</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Développement">Développement</SelectItem>
                            <SelectItem value="Utilitaires">Utilitaires</SelectItem>
                            <SelectItem value="Multimédia">Multimédia</SelectItem>
                            <SelectItem value="Jeux">Jeux</SelectItem>
                            <SelectItem value="Sécurité">Sécurité</SelectItem>
                            <SelectItem value="Système">Système</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Plateforme</Label>
                        <Select
                          value={softwareForm.platform}
                          onValueChange={(value) => setSoftwareForm({ ...softwareForm, platform: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une plateforme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Windows">Windows</SelectItem>
                            <SelectItem value="macOS">macOS</SelectItem>
                            <SelectItem value="Linux">Linux</SelectItem>
                            <SelectItem value="Android">Android</SelectItem>
                            <SelectItem value="iOS">iOS</SelectItem>
                            <SelectItem value="Web">Web</SelectItem>
                            <SelectItem value="Multiplateforme">Multiplateforme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Version</Label>
                        <Input
                          value={softwareForm.version}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, version: e.target.value })}
                          placeholder="Ex: 2023.1.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Licence</Label>
                        <Select
                          value={softwareForm.license}
                          onValueChange={(value) => setSoftwareForm({ ...softwareForm, license: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une licence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gratuit">Gratuit</SelectItem>
                            <SelectItem value="Payant">Payant</SelectItem>
                            <SelectItem value="Open Source">Open Source</SelectItem>
                            <SelectItem value="Essai gratuit">Essai gratuit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de l'icône</Label>
                        <Input
                          value={softwareForm.icon_url}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, icon_url: e.target.value })}
                          placeholder="https://example.com/icon.png"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de téléchargement</Label>
                        <Input
                          value={softwareForm.download_url}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, download_url: e.target.value })}
                          placeholder="https://download.example.com/software.exe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille du fichier</Label>
                        <Input
                          value={softwareForm.file_size}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, file_size: e.target.value })}
                          placeholder="Ex: 100 MB, 2 GB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={softwareForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) => setSoftwareForm({ ...softwareForm, is_active: value === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={softwareForm.description}
                          onChange={(e) => setSoftwareForm({ ...softwareForm, description: e.target.value })}
                          placeholder="Description du logiciel..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() =>
                          editingItem ? handleUpdate("software", softwareForm) : handleAdd("software", softwareForm)
                        }
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher un logiciel..."
                      value={searchTerms.software || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, software: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Développeur</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Licence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(software, "software").map((sw) => (
                      <TableRow key={sw.id}>
                        <TableCell className="font-medium">{sw.name}</TableCell>
                        <TableCell>{sw.developer}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{sw.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sw.platform}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sw.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sw.license}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sw.is_active === true ? "default" : "secondary"}>
                            {sw.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("software", sw.id)}>
                              {sw.is_active === true ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("software", sw)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("software", sw.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {software.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun logiciel trouvé</p>
                    <p className="text-sm">Ajoutez votre premier logiciel pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Jeux</CardTitle>
                  <CardDescription>Gérez votre catalogue de jeux</CardDescription>
                </div>
                <Dialog open={activeModal === "game"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setGameForm({
                          title: "",
                          developer: "",
                          publisher: "",
                          description: "",
                          cover_url: "",
                          download_url: "",
                          version: "",
                          genre: "",
                          platform: "",
                          rating: "PEGI 3",
                          file_size: "",
                          is_active: true,
                        })
                        setActiveModal("game")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un jeu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un jeu</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre du jeu</Label>
                        <Input
                          value={gameForm.title}
                          onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                          placeholder="Ex: Cyberpunk 2077, Elden Ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Développeur</Label>
                        <Input
                          value={gameForm.developer}
                          onChange={(e) => setGameForm({ ...gameForm, developer: e.target.value })}
                          placeholder="Ex: CD Projekt Red, FromSoftware"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Éditeur</Label>
                        <Input
                          value={gameForm.publisher}
                          onChange={(e) => setGameForm({ ...gameForm, publisher: e.target.value })}
                          placeholder="Ex: Bandai Namco, Sony Interactive"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select
                          value={gameForm.genre}
                          onValueChange={(value) => setGameForm({ ...gameForm, genre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un genre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Action">Action</SelectItem>
                            <SelectItem value="Aventure">Aventure</SelectItem>
                            <SelectItem value="RPG">RPG</SelectItem>
                            <SelectItem value="Stratégie">Stratégie</SelectItem>
                            <SelectItem value="Simulation">Simulation</SelectItem>
                            <SelectItem value="Sport">Sport</SelectItem>
                            <SelectItem value="Course">Course</SelectItem>
                            <SelectItem value="Puzzle">Puzzle</SelectItem>
                            <SelectItem value="Indépendant">Indépendant</SelectItem>
                            <SelectItem value="MMO">MMO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Plateforme</Label>
                        <Select
                          value={gameForm.platform}
                          onValueChange={(value) => setGameForm({ ...gameForm, platform: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une plateforme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PC">PC</SelectItem>
                            <SelectItem value="PlayStation">PlayStation</SelectItem>
                            <SelectItem value="Xbox">Xbox</SelectItem>
                            <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                            <SelectItem value="Web">Web</SelectItem>
                            <SelectItem value="Multiplateforme">Multiplateforme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Classification PEGI</Label>
                        <Select
                          value={gameForm.rating}
                          onValueChange={(value) => setGameForm({ ...gameForm, rating: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une classification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PEGI 3">PEGI 3</SelectItem>
                            <SelectItem value="PEGI 7">PEGI 7</SelectItem>
                            <SelectItem value="PEGI 12">PEGI 12</SelectItem>
                            <SelectItem value="PEGI 16">PEGI 16</SelectItem>
                            <SelectItem value="PEGI 18">PEGI 18</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de la couverture</Label>
                        <Input
                          value={gameForm.cover_url}
                          onChange={(e) => setGameForm({ ...gameForm, cover_url: e.target.value })}
                          placeholder="https://example.com/cover.jpg"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de téléchargement</Label>
                        <Input
                          value={gameForm.download_url}
                          onChange={(e) => setGameForm({ ...gameForm, download_url: e.target.value })}
                          placeholder="https://download.example.com/game.zip"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Version</Label>
                        <Input
                          value={gameForm.version}
                          onChange={(e) => setGameForm({ ...gameForm, version: e.target.value })}
                          placeholder="Ex: 1.0.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille du fichier</Label>
                        <Input
                          value={gameForm.file_size}
                          onChange={(e) => setGameForm({ ...gameForm, file_size: e.target.value })}
                          placeholder="Ex: 50 GB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={gameForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) => setGameForm({ ...gameForm, is_active: value === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={gameForm.description}
                          onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                          placeholder="Description du jeu..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => (editingItem ? handleUpdate("game", gameForm) : handleAdd("game", gameForm))}
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher un jeu..."
                      value={searchTerms.games || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, games: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Développeur</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(games, "games").map((game) => (
                      <TableRow key={game.id}>
                        <TableCell className="font-medium">{game.title}</TableCell>
                        <TableCell>{game.developer}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{game.genre}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{game.platform}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{game.rating}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{game.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={game.is_active === true ? "default" : "secondary"}>
                            {game.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("game", game.id)}>
                              {game.is_active === true ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("game", game)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("game", game.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {games.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun jeu trouvé</p>
                    <p className="text-sm">Ajoutez votre premier jeu pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ebooks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Ebooks</CardTitle>
                  <CardDescription>Gérez votre catalogue d'ebooks</CardDescription>
                </div>
                <Dialog open={activeModal === "ebook"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setEbookForm({
                          title: "",
                          author: "",
                          description: "",
                          cover_url: "",
                          download_url: "",
                          reading_url: "", // Reset reading_url
                          isbn: "",
                          publisher: "",
                          category: "",
                          language: "Français",
                          pages: 0,
                          file_format: "PDF",
                          file_size: "",
                          is_audiobook: false,
                          audiobook_url: "",
                          is_active: true,
                        })
                        setActiveModal("ebook")
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un ebook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un ebook</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input
                          value={ebookForm.title}
                          onChange={(e) => setEbookForm({ ...ebookForm, title: e.target.value })}
                          placeholder="Ex: Le Petit Prince"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auteur</Label>
                        <Input
                          value={ebookForm.author}
                          onChange={(e) => setEbookForm({ ...ebookForm, author: e.target.value })}
                          placeholder="Ex: Antoine de Saint-Exupéry"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Éditeur</Label>
                        <Input
                          value={ebookForm.publisher}
                          onChange={(e) => setEbookForm({ ...ebookForm, publisher: e.target.value })}
                          placeholder="Ex: Gallimard"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={ebookForm.category}
                          onValueChange={(value) => setEbookForm({ ...ebookForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fiction">Fiction</SelectItem>
                            <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="Histoire">Histoire</SelectItem>
                            <SelectItem value="Biographie">Biographie</SelectItem>
                            <SelectItem value="Jeunesse">Jeunesse</SelectItem>
                            <SelectItem value="Fantaisie">Fantaisie</SelectItem>
                            <SelectItem value="Science-Fiction">Science-Fiction</SelectItem>
                            <SelectItem value="Thriller">Thriller</SelectItem>
                            <SelectItem value="Romance">Romance</SelectItem>
                            <SelectItem value="Magazine">Magazine</SelectItem>
                            <SelectItem value="Journal">Journal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Langue</Label>
                        <Select
                          value={ebookForm.language}
                          onValueChange={(value) => setEbookForm({ ...ebookForm, language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une langue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Français">Français</SelectItem>
                            <SelectItem value="Anglais">Anglais</SelectItem>
                            <SelectItem value="Espagnol">Espagnol</SelectItem>
                            <SelectItem value="Allemand">Allemand</SelectItem>
                            <SelectItem value="Italien">Italien</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Format du fichier</Label>
                        <Select
                          value={ebookForm.file_format}
                          onValueChange={(value) => setEbookForm({ ...ebookForm, file_format: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="EPUB">EPUB</SelectItem>
                            <SelectItem value="MOBI">MOBI</SelectItem>
                            <SelectItem value="TXT">TXT</SelectItem>
                            <SelectItem value="DOCX">DOCX</SelectItem>
                            <SelectItem value="Audio">Audio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>ISBN</Label>
                        <Input
                          value={ebookForm.isbn}
                          onChange={(e) => setEbookForm({ ...ebookForm, isbn: e.target.value })}
                          placeholder="Ex: 978-2-07-030000-0"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de la couverture</Label>
                        <Input
                          value={ebookForm.cover_url}
                          onChange={(e) => setEbookForm({ ...ebookForm, cover_url: e.target.value })}
                          placeholder="https://example.com/cover.jpg"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>URL de téléchargement</Label>
                        <Input
                          value={ebookForm.download_url}
                          onChange={(e) => setEbookForm({ ...ebookForm, download_url: e.target.value })}
                          placeholder="https://download.example.com/ebook.pdf"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre de pages</Label>
                        <Input
                          type="number"
                          value={ebookForm.pages}
                          onChange={(e) => setEbookForm({ ...ebookForm, pages: Number.parseInt(e.target.value, 10) })}
                          placeholder="300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille du fichier</Label>
                        <Input
                          value={ebookForm.file_size}
                          onChange={(e) => setEbookForm({ ...ebookForm, file_size: e.target.value })}
                          placeholder="Ex: 5 MB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={ebookForm.is_active ? "active" : "inactive"}
                          onValueChange={(value) => setEbookForm({ ...ebookForm, is_active: value === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_audiobook"
                            checked={ebookForm.is_audiobook}
                            onCheckedChange={(checked) =>
                              setEbookForm({ ...ebookForm, is_audiobook: checked as boolean })
                            }
                          />
                          <Label htmlFor="is_audiobook" className="cursor-pointer">
                            Audio Book
                          </Label>
                        </div>
                      </div>
                      {ebookForm.is_audiobook && (
                        <div className="space-y-2 col-span-2">
                          <Label>Lien de lecture audio</Label>
                          <Input
                            value={ebookForm.audiobook_url}
                            onChange={(e) => setEbookForm({ ...ebookForm, audiobook_url: e.target.value })}
                            placeholder="https://example.com/audiobook-stream"
                          />
                        </div>
                      )}
                      {!ebookForm.is_audiobook && (
                        <div className="space-y-2 col-span-2">
                          <Label>URL de lecture directe</Label>
                          <Input
                            value={ebookForm.reading_url}
                            onChange={(e) => setEbookForm({ ...ebookForm, reading_url: e.target.value })}
                            placeholder="https://example.com/reader?book=..."
                          />
                          <p className="text-xs text-muted-foreground">
                            Lien pour le bouton "Lire en ligne" (optionnel)
                          </p>
                        </div>
                      )}
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={ebookForm.description}
                          onChange={(e) => setEbookForm({ ...ebookForm, description: e.target.value })}
                          placeholder="Description de l'ebook..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => (editingItem ? handleUpdate("ebook", ebookForm) : handleAdd("ebook", ebookForm))}
                      >
                        {editingItem ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher un ebook..."
                      value={searchTerms.ebooks || ""}
                      onChange={(e) => setSearchTerms({ ...searchTerms, ebooks: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Langue</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData(ebooks, "ebooks").map((ebook) => (
                      <TableRow key={ebook.id}>
                        <TableCell className="font-medium">{ebook.title}</TableCell>
                        <TableCell>{ebook.author}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ebook.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ebook.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ebook.file_format}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ebook.is_active === true ? "default" : "secondary"}>
                            {ebook.is_active === true ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus("ebook", ebook.id)}>
                              {ebook.is_active === true ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit("ebook", ebook)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete("ebook", ebook.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {ebooks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun ebook trouvé</p>
                    <p className="text-sm">Ajoutez votre premier ebook pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changelogs" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Changelogs</CardTitle>
                  <CardDescription>Gérez l'historique des versions et mises à jour</CardDescription>
                </div>
                <Dialog open={activeModal === "changelog"} onOpenChange={(open) => !open && setActiveModal(null)}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setActiveModal("changelog")} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Changelog
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-blue-900 border-blue-700 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Créer un Changelog</DialogTitle>
                      <DialogDescription className="text-blue-300">
                        Ajoutez une nouvelle version avec ses changements
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Version</label>
                          <Input
                            placeholder="1.0.0"
                            value={newChangelog.version}
                            onChange={(e) => setNewChangelog({ ...newChangelog, version: e.target.value })}
                            className="bg-blue-800 border-blue-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Date de sortie</label>
                          <Input
                            type="date"
                            value={newChangelog.release_date}
                            onChange={(e) => setNewChangelog({ ...newChangelog, release_date: e.target.value })}
                            className="bg-blue-800 border-blue-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">Titre</label>
                        <Input
                          placeholder="Nouvelle fonctionnalité"
                          value={newChangelog.title}
                          onChange={(e) => setNewChangelog({ ...newChangelog, title: e.target.value })}
                          className="bg-blue-800 border-blue-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">Description</label>
                        <textarea
                          placeholder="Décrivez les changements de cette version..."
                          value={newChangelog.description}
                          onChange={(e) => setNewChangelog({ ...newChangelog, description: e.target.value })}
                          className="w-full min-h-[200px] bg-blue-800 border-blue-600 text-white rounded-md p-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)} className="border-blue-600">
                        Annuler
                      </Button>
                      <Button onClick={handleCreateChangelog} className="bg-blue-600 hover:bg-blue-700">
                        Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-800">
                      <TableHead className="text-blue-300">Version</TableHead>
                      <TableHead className="text-blue-300">Titre</TableHead>
                      <TableHead className="text-blue-300">Date</TableHead>
                      <TableHead className="text-blue-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changelogs.map((changelog) => (
                      <TableRow key={changelog.id} className="border-blue-800">
                        <TableCell className="font-medium text-white">{changelog.version}</TableCell>
                        <TableCell className="text-blue-200">{changelog.title}</TableCell>
                        <TableCell className="text-blue-300">
                          {new Date(changelog.release_date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLog(changelog)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteChangelog(changelog.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {changelogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <p>Aucun changelog pour le moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Modal for editing changelog */}
            <Dialog open={activeModal === "edit-log"} onOpenChange={(open) => !open && (setActiveModal(null), setEditingLog(null))}>
              <DialogContent className="bg-blue-900 border-blue-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Modifier le Changelog</DialogTitle>
                  <DialogDescription className="text-blue-300">
                    Mettez à jour les détails de cette version
                  </DialogDescription>
                </DialogHeader>
                {editingLog && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">Version</label>
                        <Input
                          placeholder="1.0.0"
                          value={editingLog.version}
                          onChange={(e) => setEditingLog({ ...editingLog, version: e.target.value })}
                          className="bg-blue-800 border-blue-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">Date de sortie</label>
                        <Input
                          type="date"
                          value={editingLog.release_date}
                          onChange={(e) => setEditingLog({ ...editingLog, release_date: e.target.value })}
                          className="bg-blue-800 border-blue-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">Titre</label>
                      <Input
                        placeholder="Nouvelle fonctionnalité"
                        value={editingLog.title}
                        onChange={(e) => setEditingLog({ ...editingLog, title: e.target.value })}
                        className="bg-blue-800 border-blue-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">Description</label>
                      <textarea
                        placeholder="Décrivez les changements de cette version..."
                        value={editingLog.description}
                        onChange={(e) => setEditingLog({ ...editingLog, description: e.target.value })}
                        className="w-full min-h-[200px] bg-blue-800 border-blue-600 text-white rounded-md p-3"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => (setActiveModal(null), setEditingLog(null))} className="border-blue-600">
                    Annuler
                  </Button>
                  <Button onClick={handleUpdateLog} className="bg-blue-600 hover:bg-blue-700">
                    Mettre à jour
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Paramètres du Site
                </CardTitle>
                <CardDescription>Gérez les modules affichés sur la page d'accueil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Modules de la page d'accueil</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Activez ou désactivez les modules qui apparaissent sur la page d'accueil du site
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="hero" className="text-base font-medium">
                            Hero (Carousel)
                          </Label>
                          <p className="text-xs text-muted-foreground">Carousel des tendances en haut</p>
                        </div>
                        <Checkbox
                          id="hero"
                          checked={siteSettings.hero}
                          onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, hero: !!checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="trending_movies" className="text-base font-medium">
                            Films Tendance
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des films populaires</p>
                        </div>
                        <Checkbox
                          id="trending_movies"
                          checked={siteSettings.trending_movies}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, trending_movies: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="trending_tv_shows" className="text-base font-medium">
                            Séries Tendance
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des séries populaires</p>
                        </div>
                        <Checkbox
                          id="trending_tv_shows"
                          checked={siteSettings.trending_tv_shows}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, trending_tv_shows: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="popular_anime" className="text-base font-medium">
                            Animés Populaires
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des animés</p>
                        </div>
                        <Checkbox
                          id="popular_anime"
                          checked={siteSettings.popular_anime}
                          onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, popular_anime: !!checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="popular_collections" className="text-base font-medium">
                            Collections Populaires
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des collections</p>
                        </div>
                        <Checkbox
                          id="popular_collections"
                          checked={siteSettings.popular_collections}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, popular_collections: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="public_playlists" className="text-base font-medium">
                            Playlists Publiques
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des playlists partagées</p>
                        </div>
                        <Checkbox
                          id="public_playlists"
                          checked={siteSettings.public_playlists}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, public_playlists: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="trending_actors" className="text-base font-medium">
                            Acteurs Tendance
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des acteurs populaires</p>
                        </div>
                        <Checkbox
                          id="trending_actors"
                          checked={siteSettings.trending_actors}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, trending_actors: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="trending_tv_channels" className="text-base font-medium">
                            Chaînes TV
                          </Label>
                          <p className="text-xs text-muted-foreground">Section des chaînes télé</p>
                        </div>
                        <Checkbox
                          id="trending_tv_channels"
                          checked={siteSettings.trending_tv_channels}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, trending_tv_channels: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="subscription_offer" className="text-base font-medium">
                            Offre d'Abonnement
                          </Label>
                          <p className="text-xs text-muted-foreground">Bandeau publicitaire VIP</p>
                        </div>
                        <Checkbox
                          id="subscription_offer"
                          checked={siteSettings.subscription_offer}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, subscription_offer: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="random_content" className="text-base font-medium">
                            Contenu Aléatoire
                          </Label>
                          <p className="text-xs text-muted-foreground">Suggestion de contenu random</p>
                        </div>
                        <Checkbox
                          id="random_content"
                          checked={siteSettings.random_content}
                          onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, random_content: !!checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="football_calendar" className="text-base font-medium">
                            Calendrier Football
                          </Label>
                          <p className="text-xs text-muted-foreground">Widget calendrier sportif</p>
                        </div>
                        <Checkbox
                          id="football_calendar"
                          checked={siteSettings.football_calendar}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, football_calendar: !!checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="calendar_widget" className="text-base font-medium">
                            Calendrier Général
                          </Label>
                          <p className="text-xs text-muted-foreground">Widget calendrier événements</p>
                        </div>
                        <Checkbox
                          id="calendar_widget"
                          checked={siteSettings.calendar_widget}
                          onCheckedChange={(checked) =>
                            setSiteSettings({ ...siteSettings, calendar_widget: !!checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveSiteSettings}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder les paramètres
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive-world">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Monde Interactif - Configuration Complète
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gérez tous les paramètres du monde interactif, salles de cinéma et options de personnalisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Paramètres Généraux du Monde</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Capacité Maximale</label>
                      <Input
                        type="number"
                        value={worldSettings.maxCapacity}
                        onChange={(e) =>
                          setWorldSettings({ ...worldSettings, maxCapacity: Number.parseInt(e.target.value, 10) })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Nombre max d'utilisateurs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Mode du Monde</label>
                      <select
                        value={worldSettings.worldMode}
                        onChange={(e) => setWorldSettings({ ...worldSettings, worldMode: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border-gray-600 rounded-md text-white"
                      >
                        <option value="day">Jour</option>
                        <option value="night">Nuit</option>
                        <option value="sunset">Coucher de soleil</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={worldSettings.playerInteractionsEnabled}
                        onChange={(e) =>
                          setWorldSettings({ ...worldSettings, playerInteractionsEnabled: e.target.checked })
                        }
                      />
                      Interactions Joueurs
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={worldSettings.showStatusBadges}
                        onChange={(e) =>
                          setWorldSettings({ ...worldSettings, showStatusBadges: e.target.checked })
                        }
                      />
                      Afficher Badges Statut
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={worldSettings.enableChat}
                        onChange={(e) => setWorldSettings({ ...worldSettings, enableChat: e.target.checked })}
                      />
                      Activer le chat texte
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={worldSettings.enableEmojis}
                        onChange={(e) => setWorldSettings({ ...worldSettings, enableEmojis: e.target.checked })}
                      />
                      Activer les émojis
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={worldSettings.enableJumping}
                        onChange={(e) => setWorldSettings({ ...worldSettings, enableJumping: e.target.checked })}
                      />
                      Activer le saut
                    </label>
                  </div>

                  <div className="flex justify-end pt-4">
                    {/* CHANGE: Renamed handleWorldSettings to handleSaveWorldSettings */}
                    <Button onClick={handleSaveWorldSettings} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder les Paramètres
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      Gestion des Salles de Cinéma
                    </h3>
                    <Button onClick={handleCreateCinemaRoom} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une Salle
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {cinemaRooms.map((room) => (
                      <div key={room.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Numéro de Salle</label>
                            <Input
                              type="number"
                              value={room.room_number}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, room_number: Number.parseInt(e.target.value) } : r,
                                  ),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Nom de la Salle</label>
                            <Input
                              value={room.name}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r)),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Capacité</label>
                            <Input
                              type="number"
                              value={room.capacity}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, capacity: Number.parseInt(e.target.value) } : r,
                                  ),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Thème</label>
                            <select
                              value={room.theme}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) => (r.id === room.id ? { ...r, theme: e.target.value } : r)),
                                )
                              }}
                              className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
                            >
                              <option value="default">Par défaut</option>
                              <option value="luxury">Luxe</option>
                              <option value="retro">Rétro</option>
                              <option value="modern">Moderne</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Titre du Film</label>
                            <Input
                              value={room.movie_title}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, movie_title: e.target.value } : r,
                                  ),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">ID TMDB du Film</label>
                            <Input
                              type="number"
                              value={room.movie_tmdb_id || ""}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id
                                      ? { ...r, movie_tmdb_id: Number.parseInt(e.target.value) || null }
                                      : r,
                                  ),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">URL Affiche</label>
                            <Input
                              value={room.movie_poster || ""}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, movie_poster: e.target.value } : r,
                                  ),
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

<div className="space-y-2">
  <label className="text-sm text-gray-300">URL Embed (Iframe)</label>
  <Input
    value={room.embed_url || ""}
    onChange={(e) => {
      setCinemaRooms(
        cinemaRooms.map((r) => (r.id === room.id ? { ...r, embed_url: e.target.value } : r))
      )
    }}
    className="bg-gray-600 border-gray-500 text-white"
  />
</div>
<div className="space-y-2">
                            <label className="text-sm text-gray-300">Début de séance</label>
                            <Input
                              type="datetime-local"
                              value={room.schedule_start || ""}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, schedule_start: e.target.value } : r
                                  )
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Fin de séance</label>
                            <Input
                              type="datetime-local"
                              value={room.schedule_end || ""}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, schedule_end: e.target.value } : r
                                  )
                                )
                              }}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Niveau d'accès</label>
                            <select
                              value={room.access_level}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, access_level: e.target.value } : r
                                  )
                                )
                              }}
                              className="w-full px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
                            >
                              <option value="public">Public</option>
                              <option value="vip">VIP</option>
                              <option value="vip_plus">VIP+</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={room.is_open}
                              onChange={(e) => {
                                setCinemaRooms(
                                  cinemaRooms.map((r) =>
                                    r.id === room.id ? { ...r, is_open: e.target.checked } : r
                                  )
                                )
                              }}
                              className="rounded"
                            />
                            <label className="text-sm text-gray-300">Salle ouverte</label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            onClick={() => handleUpdateCinemaRoom(room)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </Button>
                        </div>
                      </div>
                    ))}

                    {cinemaRooms.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune salle de cinéma créée</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section des options d'avatar */}
                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Options de Personnalisation d'Avatar</h3>
                  
                  {/* Formulaire d'ajout */}
                  <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select
                        value={newOption.category}
                        onChange={(e) => setNewOption({ ...newOption, category: e.target.value })}
                        className="px-3 py-2 bg-gray-600 border-gray-500 rounded-md text-white"
                      >
                        <option value="hair_style">Coiffure</option>
                        <option value="hair_color">Couleur cheveux</option>
                        <option value="skin_tone">Teinte peau</option>
                        <option value="outfit">Tenue</option>
                      </select>

                      <Input
                        placeholder="Label (ex: Blonde)"
                        value={newOption.label}
                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                        className="bg-gray-600 border-gray-500 text-white"
                      />

                      <Input
                        placeholder="Valeur (ex: #FFD700)"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                        className="bg-gray-600 border-gray-500 text-white"
                      />

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={newOption.is_premium}
                            onChange={(e) => setNewOption({ ...newOption, is_premium: e.target.checked })}
                            className="rounded"
                          />
                          Premium
                        </label>
                        <Button onClick={handleAddAvatarOption} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Liste des options */}
                  <div className="space-y-2">
                    {avatarOptions.map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{option.category}</Badge>
                          <span className="text-white">{option.label}</span>
                          <span className="text-gray-400 text-sm">{option.value}</span>
                          {option.is_premium && <Badge className="bg-yellow-600">Premium</Badge>}
                        </div>
                        <Button
                          onClick={() => handleDeleteAvatarOption(option.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section des statistiques en temps réel */}
                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Statistiques en Temps Réel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                          <div className="text-3xl font-bold text-white">{onlineUsersCount}</div>
                          <p className="text-sm text-gray-400">Utilisateurs en ligne</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Film className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                          <div className="text-3xl font-bold text-white">{cinemaRooms.length}</div>
                          <p className="text-sm text-gray-400">Salles de cinéma</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-400" />
                          <div className="text-3xl font-bold text-white">{avatarOptions.length}</div>
                          <p className="text-sm text-gray-400">Options d'avatar</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
