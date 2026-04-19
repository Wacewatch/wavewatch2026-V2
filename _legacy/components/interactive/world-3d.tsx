"use client"

import type React from "react"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html, PerspectiveCamera, Stats } from "@react-three/drei"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Minimize, Crown, Shield, Menu, Play, Maximize2, Star } from "lucide-react"
import { useRouter } from "next/navigation"

// Import refactored components from world/
import {
  // Constants (used by collision debug visualization)
  getCollisionZonesForQuality,
  getGraphicsConfig,
  // Types
  type GraphicsQuality,
  // Components
  LocalPlayerAvatar,
  InterpolatedPlayer,
  CameraFollower,
  FirstPersonCamera,
  WorldEnvironment,
  WorldGround,
  WorldDecorations,
  CentralPlaza,
  PathNetwork,
  AmbientLamppostCollection,
  CitySkyline,
  MobileJoystick,
  CameraJoystick,
  CenterTouchZone,
  JoystickBlockZones,
  // UI Components
  ChatInput,
  SettingsModal,
  MapModal,
  AvatarCustomizer,
  CinemaModal,
  ClosedModal,
  ArcadeModal,
  ArcadeGameView,
  ExternalGameModal,
  StadiumModal,
  StadiumInfoBar,
  QuickActionsPanel,
  RoomActionButtons,
  ActionButtons,
  MenuDropdown,
  ChatModal,
  MovieFullscreenModal,
  WorldLoadingScreen,
  VoiceChatPanel,
  QuestsModal, // Added QuestsModal import
  // Building Components
  DiscoBuilding,
  CinemaBuilding,
  ArcadeBuilding,
  StadiumBuilding,
  DecorativeBuildings,
  InfoPanel,
  // Scene Components
  StadiumInterior,
  DiscoInterior,
  ArcadeInterior,
  // CinemaInterior removed from named imports as it's a default export
  // Hooks
  useRoomNavigation,
  useStadiumSeating,
  useCinemaSeats,
  usePlayerMovement,
  useDataLoaders,
  useWorldChat,
  useWorldPreloader,
  useVoiceChat,
  // Debug components
  CollisionDebugVisualization,
  CinemaInterior,
} from "./world"

// import CinemaInterior from "./world/scenes/CinemaInterior"

// Initialize Supabase client
const supabase = createClient()

interface InteractiveWorldProps {
  userId: string
  userProfile: any
  visitId?: string | null
  onExit?: () => void | Promise<void>
}
export default function InteractiveWorld({ userId, userProfile, visitId, onExit }: InteractiveWorldProps) {
  const router = useRouter() // Initialize router
  const [myProfile, setMyProfile] = useState<any>(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [myPosition, setMyPosition] = useState({ x: 4.5, y: -0.35, z: -27 })
  const [myRotation, setMyRotation] = useState(0) // State for player rotation (default: facing buildings)
  const [savedMapPosition, setSavedMapPosition] = useState({ x: 4.5, y: -0.35, z: -27 }) // Save position before entering rooms
  const [myAvatarStyle, setMyAvatarStyle] = useState({
    bodyColor: "#3b82f6",
    headColor: "#fbbf24",
    hairStyle: "short",
    hairColor: "#1f2937",
    skinTone: "#fbbf24",
    accessory: "none",
    faceSmiley: "😊", // Added default face smiley
  })
  const [customizationOptions, setCustomizationOptions] = useState<any[]>([])
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null)
  const [isJumping, setIsJumping] = useState(false)
  const [isDancing, setIsDancing] = useState(false)

  const [movement, setMovement] = useState({ x: 0, z: 0 })
  const [showChat, setShowChat] = useState(false)
  const [showChatInput, setShowChatInput] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showBadgesPreference, setShowBadgesPreference] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("interactive_show_badges")
      return saved !== null ? saved === "true" : true
    }
    return true
  })
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false)
  const [showQuests, setShowQuests] = useState(false) // Added showQuests state
  const [showCinema, setShowCinema] = useState(false) // State for cinema modal
  const [currentCinemaRoom, setCurrentCinemaRoom] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cinemaSeats, setCinemaSeats] = useState<any[]>([])
  const [mySeat, setMySeat] = useState<number | null>(null)
  const [isSeatsLocked, setIsSeatsLocked] = useState(false)

  // Map state
  const [showMap, setShowMap] = useState(false)

  // Arcade state (arcadeMachines provided by useDataLoaders)
  const [showArcade, setShowArcade] = useState(false)
  const [currentArcadeMachine, setCurrentArcadeMachine] = useState<any>(null)
  const [pendingExternalMachine, setPendingExternalMachine] = useState<any>(null) // Pour la modal pub avant ouverture externe
  const [externalCountdown, setExternalCountdown] = useState(5) // Compte à rebours 5 secondes
  const [showStadium, setShowStadium] = useState(false)
  const [, setShowDisco] = useState(false) // setShowDisco used in enterRoom
  const [showDiscoClosedModal, setShowDiscoClosedModal] = useState(false)
  const [showArcadeClosedModal, setShowArcadeClosedModal] = useState(false)
  const [showStadiumClosedModal, setShowStadiumClosedModal] = useState(false)
  const [showCinemaClosedModal, setShowCinemaClosedModal] = useState(false)
  const [isDiscoMuted, setIsDiscoMuted] = useState(false) // Son activé par défaut dans la disco
  const [isStadiumMuted, setIsStadiumMuted] = useState(false) // Son activé par défaut dans le stade
  const [showMovieFullscreen, setShowMovieFullscreen] = useState(false)
  const [isCinemaMuted, setIsCinemaMuted] = useState(true) // Muted par défaut pour éviter le son automatique
  const [stadiumSeat, setStadiumSeat] = useState<{ row: number; side: string } | null>(null) // Siège dans le stade
  const [showMenu, setShowMenu] = useState(false) // Added this state
  const [cinemaSessions, setCinemaSessions] = useState<any[]>([])
  const [isCinemaInteriorActive, setIsCinemaInteriorActive] = useState(false) // State to control CinemaInterior rendering
  const [showVoiceChat, setShowVoiceChat] = useState(true) // Added this state

  const [myLevel, setMyLevel] = useState<number>(1)

  const [currentRoom, setCurrentRoom] = useState<string | null>("main_world")
  const [nearbyBuilding, setNearbyBuilding] = useState<{ name: string; type: string; emoji: string } | null>(null)
  const [nearbyInfoPanel, setNearbyInfoPanel] = useState(false) // Panneau info près du spawn

  // World Settings state
  const [worldSettings, setWorldSettings] = useState({
    maxCapacity: 100,
    worldMode: "day" as "day" | "night" | "sunset" | "christmas",
    voiceChatEnabled: true, // Enable voice chat by default in interactive world
    playerInteractionsEnabled: true,
    showStatusBadges: true,
    enableChat: true,
    enableEmojis: true,
    enableJumping: true,
  })

  const [graphicsQuality, setGraphicsQuality] = useState("medium")
  const [isMobileMode, setIsMobileMode] = useState(false)
  const [controlMode, setControlMode] = useState<"auto" | "pc" | "mobile">("auto")
  const [povMode, setPovMode] = useState(false)
  const [fpsRotation, setFpsRotation] = useState({ yaw: 0, pitch: 0 })

  const [countdown, setCountdown] = useState<string>("")

  // Synchronized actions state
  const [playerActions, setPlayerActions] = useState<
    Record<string, { action: string; timestamp: number; emoji?: string }>
  >({})
  const actionsChannelRef = useRef<any>(null)
  const fpsStatsContainerRef = useRef<HTMLDivElement>(null)
  const [quickAction, setQuickAction] = useState<string | null>(null) // State for current quick action animation
  const cameraAngleRef = useRef<number>(0) // Ref for tracking camera azimuth angle
  const orbitControlsRef = useRef<any>(null) // Ref for OrbitControls
  const handleJumpRef = useRef<() => void>(() => {}) // Ref for jump function (updated after handleJump is defined)

  const isMoving = movement.x !== 0 || movement.z !== 0

  // World preloader hook - shows loading screen while assets are loading
  const {
    isLoading: isWorldLoading,
    progress: loadingProgress,
    currentStep: loadingStep,
    completedSteps: loadingCompletedSteps,
    forceComplete: skipLoading,
  } = useWorldPreloader({ enabled: true, minLoadingTime: 2500 })

  // Voice Chat State - moved after currentRoom declaration
  const {
    isVoiceConnected,
    isMicMuted,
    isSpeaking,
    voicePeers,
    micPermissionDenied,
    micErrorMessage,
    requestMicAccess,
    toggleMic,
    disconnect,
    resetMicPermission,
    setPeerVolume,
    togglePeerMute,
  } = useVoiceChat({
    userId: userProfile?.id || userId,
    currentRoom,
    voiceChatEnabled: worldSettings.voiceChatEnabled,
  })

  // Room visit tracking
  const currentRoomVisitIdRef = useRef<string | null>(null)
  const currentRoomStartTimeRef = useRef<Date | null>(null)

  // Track room entry
  const handleRoomEnter = useCallback(
    async (roomName: string) => {
      if (!visitId) return

      try {
        const { data, error } = await supabase
          .from("interactive_room_visits")
          .insert({
            visit_id: visitId,
            user_id: userId,
            room_name: roomName,
          })
          .select("id")
          .single()

        if (data) {
          currentRoomVisitIdRef.current = data.id
          currentRoomStartTimeRef.current = new Date()
        }
      } catch (err) {
        console.error("Error tracking room entry:", err)
      }
    },
    [visitId, userId],
  )

  // Track room exit
  const handleRoomLeave = useCallback(async (roomName: string) => {
    if (!currentRoomVisitIdRef.current || !currentRoomStartTimeRef.current) return

    const exitTime = new Date()
    const durationSeconds = Math.floor((exitTime.getTime() - currentRoomStartTimeRef.current.getTime()) / 1000)

    try {
      await supabase
        .from("interactive_room_visits")
        .update({
          exited_at: exitTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq("id", currentRoomVisitIdRef.current)

      currentRoomVisitIdRef.current = null
      currentRoomStartTimeRef.current = null
    } catch (err) {
      console.error("Error tracking room exit:", err)
    }
  }, [])

  // États d'ouverture des lieux - fourni par useDataLoaders
  // isArcadeOpen, isStadiumOpen, isDiscoOpen, setIsArcadeOpen, setIsStadiumOpen, setIsDiscoOpen

  // Arrêter la danse quand le joueur bouge et mettre à jour la BDD
  useEffect(() => {
    if (isMoving && isDancing) {
      setIsDancing(false)
      // Update database to stop dancing
      supabase
        .from("interactive_profiles")
        .update({ is_dancing: false })
        .eq("user_id", userId)
        .then(() => {})
    }
  }, [isMoving, isDancing, userId])

  // Data loaders hook - provides otherPlayers, arcadeMachines, stadium, cinemaRooms, and open states
  const {
    otherPlayers,
    arcadeMachines,
    isArcadeOpen,
    setIsArcadeOpen,
    stadium,
    isStadiumOpen,
    setIsStadiumOpen,
    isDiscoOpen,
    setIsDiscoOpen,
    cinemaRooms,
  } = useDataLoaders({ userId })

  // Chat hook - provides messages, chat input, chat bubbles and send functionality
  const { messages, roomMessages, chatInput, setChatInput, playerChatBubbles, sendMessage } = useWorldChat({
    userId: userProfile?.id || userId,
    username: myProfile?.username || userProfile?.username || "Joueur",
    currentCinemaRoom,
    enableChat: worldSettings.enableChat,
  })

  // Player movement hook - handles keyboard, joystick, collisions
  const { handleCameraRotate: hookHandleCameraRotate, handleJoystickMove } = usePlayerMovement({
    userId,
    currentRoom,
    povMode,
    fpsRotation,
    stadiumSeat,
    mySeat,
    graphicsQuality,
    isJumping,
    setMyPosition,
    setMyRotation,
    setMovement,
    onJump: () => handleJumpRef.current?.(),
    cameraAngleRef,
    orbitControlsRef,
  })

  // Wrapper for camera rotation that provides setFpsRotation
  const handleCameraRotate = useCallback(
    (deltaYaw: number, deltaPitch: number) => {
      hookHandleCameraRotate(deltaYaw, deltaPitch, setFpsRotation)
    },
    [hookHandleCameraRotate],
  )

  // Custom hooks for room navigation and seating
  const {
    handleEnterArcade,
    handleLeaveArcade,
    handleEnterCinemaRoom,
    handleLeaveRoom,
    handleEnterStadium,
    handleLeaveStadium,
    handleEnterDisco,
    handleLeaveDisco,
  } = useRoomNavigation({
    userId,
    myPosition,
    mySeat,
    stadiumSeat,
    currentRoom,
    currentCinemaRoom,
    savedMapPosition,
    orbitControlsRef,
    // Current open states (from useDataLoaders, updated via realtime)
    isStadiumOpen,
    isArcadeOpen,
    isDiscoOpen,
    // Room tracking callbacks
    onEnterRoom: handleRoomEnter,
    onLeaveRoom: handleRoomLeave,
    setMyPosition,
    setMyRotation,
    setMySeat,
    setStadiumSeat,
    setCurrentRoom,
    setCurrentCinemaRoom,
    setSavedMapPosition,
    setCinemaSeats,
    setShowCinema,
    setShowStadium,
    setShowArcade,
    setShowDisco,
    setShowCinemaClosedModal,
    setShowStadiumClosedModal,
    setShowArcadeClosedModal,
    setShowDiscoClosedModal,
    setIsSeatsLocked,
    setCountdown,
    setIsDiscoOpen,
    setIsArcadeOpen,
    setIsStadiumOpen,
  })

  const { handleSitInStadium, handleStandUpFromStadium } = useStadiumSeating({
    userId,
    myPosition,
    stadiumSeat,
    orbitControlsRef,
    setMyPosition,
    setMyRotation,
    setStadiumSeat,
  })

  const { handleSitInAnySeat, handleSitInSeat } = useCinemaSeats({
    userId,
    currentCinemaRoom,
    mySeat,
    cinemaSeats,
    setMyPosition,
    setMySeat,
    setCinemaSeats,
  })

  // Recalculate online count based on actually displayed players (with same filters as rendering)
  useEffect(() => {
    const actualPlayersInWorld = otherPlayers.filter((p) => {
      const playerIsInSameRoom = currentRoom === p.current_room || (currentRoom === null && p.current_room === null)
      const hasValidProfile = p.user_profiles?.username || p.username ? true : false
      const isAtDefaultPosition =
        p.position_x === 0 && p.position_z === 0 && (p.position_y === 0 || p.position_y === 0.5)
      return playerIsInSameRoom && hasValidProfile && !isAtDefaultPosition
    })
    setOnlineCount(actualPlayersInWorld.length + 1) // +1 for current user
  }, [otherPlayers, currentRoom])

  useEffect(() => {
    if (controlMode === "pc") {
      setIsMobileMode(false)
    } else if (controlMode === "mobile") {
      setIsMobileMode(true)
    } else {
      // Mode auto : détecter automatiquement
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 1024
      setIsMobileMode(isTouchDevice || isSmallScreen)
    }
  }, [controlMode])

  // Désactiver le scroll quand un jeu arcade est ouvert
  useEffect(() => {
    if (currentArcadeMachine) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [currentArcadeMachine])

  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showAFKWarning, setShowAFKWarning] = useState(false)
  const [showCollisionDebug, setShowCollisionDebug] = useState(false)

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
      setShowAFKWarning(false)
    }

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "touchmove", "wheel"]
    events.forEach((event) => window.addEventListener(event, updateActivity))

    const checkAFK = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity
      const threeHours = 3 * 60 * 60 * 1000 // 3 hours in milliseconds

      if (inactiveTime > threeHours) {
        setShowAFKWarning(true)
        // Disconnect user
        supabase
          .from("interactive_profiles")
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq("user_id", userId)
          .then(() => {
            window.location.href = "/"
          })
      }
    }, 60000) // Check every minute

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity))
      clearInterval(checkAFK)
    }
  }, [lastActivity, userId])

  // Collision zones for debug visualization - imported from constants.ts
  const collisionZonesData = useMemo(
    () => getCollisionZonesForQuality(graphicsQuality as GraphicsQuality),
    [graphicsQuality],
  )

  // checkCollision is now provided by usePlayerMovement hook

  useEffect(() => {
    const loadWorldSettings = async () => {
      const { data, error } = await supabase
        .from("interactive_world_settings")
        .select("setting_value")
        .eq("setting_key", "world_config")
        .maybeSingle()

      console.log("[WorldSettings] Loaded:", data, "Error:", error)

      if (error) {
        console.error("[WorldSettings] Error loading settings:", error)
        return
      }

      if (data && data.setting_value) {
        console.log("[WorldSettings] Applying worldMode:", data.setting_value.worldMode)
        setWorldSettings(data.setting_value as any)
      }
    }

    loadWorldSettings()

    // Realtime listener pour les changements de paramètres admin
    const settingsChannel = supabase
      .channel("world-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_world_settings",
          filter: "setting_key=eq.world_config",
        },
        (payload: any) => {
          console.log("[WorldSettings] Realtime update received:", payload)
          if (payload.new && payload.new.setting_value) {
            setWorldSettings(payload.new.setting_value as any)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(settingsChannel)
    }
  }, [])

  // Players, arcade games, stadium loading now handled by useDataLoaders hook

  useEffect(() => {
    // Seats are never locked anymore
    setIsSeatsLocked(false)
  }, [currentCinemaRoom])

  useEffect(() => {
    if (!supabase) return

    const loadCinemaSessions = async () => {
      const { data, error } = await supabase
        .from("interactive_cinema_sessions")
        .select("*")
        .order("schedule_start", { ascending: true })

      if (error) {
        console.error("[v0] Error loading cinema sessions:", error)
        return
      }

      setCinemaSessions(data || [])
    }

    loadCinemaSessions()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("cinema_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_cinema_sessions",
        },
        () => {
          loadCinemaSessions()
        },
      )
      .subscribe()

    return () => {
      // Unsubscribe from the channel when the component unmounts
      supabase.removeChannel(channel)
    }
  }, [supabase]) // Added supabase as dependency

  useEffect(() => {
    console.log("[v0] [World3D] Voice chat config:", {
      voiceChatEnabled: worldSettings.voiceChatEnabled,
      currentRoom,
      userId: userProfile?.id || userId,
    })
  }, [worldSettings.voiceChatEnabled, currentRoom, userProfile?.id, userId])

  useEffect(() => {
    console.log("[v0] [World3D] Cinema interior check:", {
      currentCinemaRoom: currentCinemaRoom?.id,
      currentRoom,
      roomsCount: cinemaRooms.length,
    })

    if (!currentCinemaRoom || currentRoom === "stadium" || currentRoom === "arcade" || currentRoom === "disco") {
      setIsCinemaInteriorActive(false)
      return
    }

    const room = cinemaRooms.find((r) => r.id === currentCinemaRoom.id) // Use currentCinemaRoom directly

    console.log("[v0] [World3D] Found room for cinema interior:", {
      found: !!room,
      roomId: room?.id,
      roomNumber: room?.room_number,
      hasScheduleStart: !!room?.schedule_start,
    })

    if (!room || !room.schedule_start) {
      setIsCinemaInteriorActive(false)
      return
    }

    // Set active state only when we are sure we want to render CinemaInterior
    setIsCinemaInteriorActive(true)

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const start = new Date(room.schedule_start!).getTime()
      const distance = start - now

      if (distance < 0) {
        setCountdown("Film en cours")
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setCountdown(`${hours}h ${minutes}m ${seconds}s`)
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      // Optionally reset countdown or other state when leaving the effect
      // setCountdown("")
    }
  }, [currentCinemaRoom, cinemaRooms, currentRoom]) // Added currentCinemaRoom and currentRoom to dependencies

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const loadAvatarStyle = async () => {
      const { data } = await supabase.from("interactive_profiles").select("avatar_style").eq("user_id", userId).single()

      if (data?.avatar_style) {
        setMyAvatarStyle(data.avatar_style)
      }
    }

    loadAvatarStyle()
  }, [userId])

  const saveAvatarStyle = async (newStyle: any) => {
    setMyAvatarStyle(newStyle)
    await supabase.from("interactive_profiles").update({ avatar_style: newStyle }).eq("user_id", userId)
  }

  useEffect(() => {
    const loadCustomizationOptions = async () => {
      const { data } = await supabase.from("avatar_customization_options").select("*").order("category")

      if (data) {
        setCustomizationOptions(data)
      }
    }

    loadCustomizationOptions()
  }, [])

  // Keyboard/joystick movement and collision detection now handled by usePlayerMovement hook
  // Chat messages and bubbles now handled by useWorldChat hook

  // Fonction pour basculer le mode POV en conservant la direction de vue
  const togglePovMode = useCallback(() => {
    if (!povMode && orbitControlsRef.current) {
      // Passage en mode première personne - calculer la direction actuelle de la caméra
      const controls = orbitControlsRef.current
      const azimuth = controls.getAzimuthalAngle() // Angle horizontal
      const polar = controls.getPolarAngle() // Angle vertical (0 = haut, PI = bas)

      // Convertir l'angle polaire en pitch (0 = horizontal, négatif = vers le bas)
      const pitch = Math.PI / 2 - polar

      // Le yaw de OrbitControls est l'opposé de ce qu'on veut pour FPS
      // En OrbitControls, la caméra regarde VERS le joueur depuis l'angle azimuth
      // En FPS, on veut regarder DEPUIS le joueur vers l'extérieur
      const yaw = azimuth + Math.PI

      setFpsRotation({ yaw, pitch })
    }
    setPovMode(!povMode)
  }, [povMode])

  const handleEmoji = (emoji: string) => {
    if (!userProfile) {
      return
    }

    setCurrentEmoji(emoji)
    setShowQuickActions(false)

    // Broadcast emoji action to other players via world-actions channel
    if (actionsChannelRef.current) {
      actionsChannelRef.current.send({
        type: "broadcast",
        event: "player-action",
        payload: {
          userId: userId,
          action: "emoji",
          emoji: emoji,
          timestamp: Date.now(),
        },
      })
    }

    setTimeout(() => setCurrentEmoji(null), 3000)
  }

  const handleJump = () => {
    if (!userProfile) {
      return
    }

    if (!worldSettings.enableJumping) {
      return
    }

    setIsJumping(true)

    // Broadcast jump action to other players
    if (actionsChannelRef.current) {
      actionsChannelRef.current.send({
        type: "broadcast",
        event: "player-action",
        payload: {
          userId: userId, // Use userId prop for consistency
          action: "jump",
          timestamp: Date.now(),
        },
      })
    }

    setTimeout(() => setIsJumping(false), 500)
  }

  // Mettre à jour la ref pour que le useEffect puisse appeler handleJump
  handleJumpRef.current = handleJump

  // Fonction pour gérer la danse et la synchroniser via la BDD
  const handleDance = useCallback(async () => {
    if (!userProfile) {
      return
    }

    const newDancingState = !isDancing
    setIsDancing(newDancingState)
    setShowQuickActions(false)

    // Update dance state in database (synced via realtime subscription)
    await supabase.from("interactive_profiles").update({ is_dancing: newDancingState }).eq("user_id", userId)
  }, [isDancing, userProfile, userId])

  // sendMessage is now provided by useWorldChat hook
  // handleJoystickMove and handleCameraRotate are now provided by usePlayerMovement hook

  const handleSelectArcadeMachine = (machine: any) => {
    if (machine.openInNewTab) {
      // Afficher la modal avec compte à rebours avant d'ouvrir dans un nouvel onglet
      setPendingExternalMachine(machine)
      setExternalCountdown(5)
      setShowArcade(false)
    } else {
      setCurrentArcadeMachine(machine)
      setShowArcade(false) // Close the list of machines
    }
  }

  // Effet pour le compte à rebours
  useEffect(() => {
    if (pendingExternalMachine && externalCountdown > 0) {
      const timer = setTimeout(() => {
        setExternalCountdown(externalCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pendingExternalMachine, externalCountdown])

  const handleOpenExternalMachine = () => {
    if (pendingExternalMachine && externalCountdown === 0) {
      window.open(pendingExternalMachine.url, "_blank")
      setPendingExternalMachine(null)
    }
  }

  const handleCloseExternalModal = () => {
    setPendingExternalMachine(null)
    setExternalCountdown(5)
  }

  const handleCloseArcadeMachine = () => {
    setCurrentArcadeMachine(null)
  }

  function handleEnterBuilding() {
    if (!nearbyBuilding) return

    switch (nearbyBuilding.type) {
      case "arcade":
        handleEnterArcade()
        break
      case "cinema":
        setShowCinema(true)
        break
      case "stadium":
        handleEnterStadium()
        break
      case "disco":
        handleEnterDisco()
        break
    }
  }

  // Gestion des touches F ou Enter pour entrer dans les bâtiments ou ouvrir la map
  useEffect(() => {
    const handleInteractKey = (e: KeyboardEvent) => {
      // Handling interact key (E or Enter) for entering buildings
      if ((e.key === "e" || e.key === "E") && currentRoom === "cinema" && !showChatInput) {
        if (mySeat !== null) {
          // Se lever
          handleSitInSeat()
        } else {
          // S'asseoir
          handleSitInAnySeat()
        }
        return
      }

      if ((e.key === "f" || e.key === "F" || e.key === "Enter") && currentRoom === null && !showChatInput) {
        // Si près d'un bâtiment interactif, entrer dedans
        if (nearbyBuilding) {
          handleEnterBuilding()
        }
        // Si près du panneau info (près du spawn), ouvrir la map
        else if (nearbyInfoPanel && !showMap) {
          setShowMap(true)
        }
      }
    }

    window.addEventListener("keydown", handleInteractKey)

    return () => {
      window.removeEventListener("keydown", handleInteractKey)
    }
  }, [
    nearbyBuilding,
    nearbyInfoPanel,
    currentRoom,
    showMap,
    showChatInput,
    mySeat,
    handleSitInAnySeat,
    handleSitInSeat,
  ])

  // Détecter la proximité des bâtiments et du panneau info
  useEffect(() => {
    if (currentRoom !== null) {
      setNearbyBuilding(null)
      setNearbyInfoPanel(false)
      return
    }

    const distanceToArcade = Math.sqrt(Math.pow(myPosition.x - 0, 2) + Math.pow(myPosition.z - 15, 2))
    const distanceToCinema = Math.sqrt(Math.pow(myPosition.x - 15, 2) + Math.pow(myPosition.z - 0, 2))
    const distanceToStadium = Math.sqrt(Math.pow(myPosition.x - 25, 2) + Math.pow(myPosition.z - -15, 2))
    const distanceToDisco = Math.sqrt(Math.pow(myPosition.x - -15, 2) + Math.pow(myPosition.z - -20, 2))
    // Panneau info près de la plaza (position: 6.3, -17.1)
    const distanceToInfoPanel = Math.sqrt(Math.pow(myPosition.x - 6.3, 2) + Math.pow(myPosition.z - -17.1, 2))

    const proximityThreshold = 8
    const infoPanelThreshold = 5

    if (distanceToArcade < proximityThreshold) {
      setNearbyBuilding({ name: "Arcade", type: "arcade", emoji: "🕹️" })
      setNearbyInfoPanel(false)
    } else if (distanceToCinema < proximityThreshold) {
      setNearbyBuilding({ name: "Cinéma", type: "cinema", emoji: "🎬" })
      setNearbyInfoPanel(false)
    } else if (distanceToStadium < proximityThreshold) {
      setNearbyBuilding({ name: "Stade", type: "stadium", emoji: "⚽" })
      setNearbyInfoPanel(false)
    } else if (distanceToDisco < proximityThreshold) {
      setNearbyBuilding({ name: "Discothèque", type: "disco", emoji: "🪩" })
      setNearbyInfoPanel(false)
    } else {
      setNearbyBuilding(null)
      // Vérifier si près du panneau info
      setNearbyInfoPanel(distanceToInfoPanel < infoPanelThreshold)
    }
  }, [myPosition, currentRoom])

  useEffect(() => {
    const checkCapacity = async () => {
      const { count } = await supabase
        .from("interactive_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_online", true)

      if (count && count >= worldSettings.maxCapacity) {
        // Could show a message to user here
      }
    }

    checkCapacity()
  }, [worldSettings.maxCapacity])

  useEffect(() => {
    const channel = supabase
      .channel("world-actions")
      .on("broadcast", { event: "player-action" }, ({ payload }: any) => {
        if (payload && payload.userId && payload.userId !== userId) {
          // Handle actions like jump and emoji
          setPlayerActions((prev) => ({
            ...prev,
            [payload.userId]: {
              action: payload.action,
              timestamp: Date.now(),
              ...(payload.action === "emoji" && { emoji: payload.emoji }),
            },
          }))

          // Clear the action after a duration
          setTimeout(
            () => {
              setPlayerActions((prev) => {
                const newActions = { ...prev }
                delete newActions[payload.userId]
                return newActions
              })
            },
            payload.action === "emoji" ? 3000 : 2000,
          )
        }
      })
      .subscribe()

    // Store channel ref for sending actions
    actionsChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      actionsChannelRef.current = null
    }
  }, [userId])

  // Handle quick actions (emotes, jumps)
  const handleQuickAction = (action: string) => {
    if (!userProfile) {
      return
    }

    setQuickAction(action)
    setShowQuickActions(false)

    // Broadcast quick action to other players
    if (actionsChannelRef.current) {
      actionsChannelRef.current.send({
        type: "broadcast",
        event: "player-action",
        payload: {
          userId: userId, // Use userId prop for consistency
          action,
          timestamp: Date.now(),
        },
      })
    }

    setTimeout(() => setQuickAction(null), 3000)
  }

  useEffect(() => {
    const loadMyLevel = async () => {
      const { data } = await supabase.from("interactive_user_xp").select("level").eq("user_id", userId).single()

      if (data?.level) {
        setMyLevel(data.level)
      }
    }

    loadMyLevel()

    // Subscribe to XP updates
    const channel = supabase
      .channel("my_xp")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "interactive_user_xp",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.level) {
            setMyLevel(payload.new.level)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const loadMyProfile = async () => {
      const { data, error } = await supabase.from("interactive_profiles").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("[v0] Error loading my profile:", error)
        return
      }

      setMyProfile(data)

      if (data) {
        const isInSpecialRoom =
          data.current_room === "stadium" ||
          data.current_room === "arcade" ||
          data.current_room === "disco" ||
          (data.current_room && data.current_room.startsWith("cinema_"))

        // Si l'utilisateur était dans une salle spéciale (cinéma, stade, arcade),
        // on le remet au spawn et on libère son siège car c'est un nouveau chargement de page
        if (isInSpecialRoom) {
          const spawnPosition = { x: 4.5, y: -0.35, z: -27 }
          setMyPosition(spawnPosition)
          setMyRotation(0) // Face buildings
          setCurrentRoom(null)
          setSavedMapPosition(spawnPosition)

          // Libérer le siège dans le cinéma si c'était une salle de cinéma
          if (data.current_room && data.current_room.startsWith("cinema_")) {
            supabase
              .from("interactive_cinema_seats")
              .update({ is_occupied: false, user_id: null, occupied_at: null })
              .eq("user_id", data.user_id)
              .then(() => {
                console.log("[Cinema] Released seat on page reload")
              })
          }

          // Mettre à jour la BDD pour refléter la nouvelle position
          supabase
            .from("interactive_profiles")
            .update({
              current_room: null,
              position_x: spawnPosition.x,
              position_y: spawnPosition.y,
              position_z: spawnPosition.z,
            })
            .eq("user_id", userId)
            .then(() => {
              console.log("[Profile] Reset to spawn on page reload")
            })
        } else {
          // Comportement normal pour les joueurs sur la map
          const loadedPosition = { x: data.position_x, y: data.position_y, z: data.position_z }
          setMyPosition(loadedPosition)
          setMyRotation(data.rotation ?? 0) // Default: face buildings
          setCurrentRoom(data.current_room)
          setSavedMapPosition(loadedPosition)
        }
      }
    }

    loadMyProfile()
  }, [userId])

  const handleQuitWorld = async () => {
    console.log("[World] handleQuitWorld called, onExit:", !!onExit)

    // If user is in a special room (cinema, stadium, arcade), reset to spawn
    // Otherwise, save current position to restore it next time
    const isInSpecialRoom =
      currentRoom === "stadium" ||
      currentRoom === "arcade" ||
      currentRoom === "disco" ||
      (typeof currentRoom === "object" && currentRoom !== null)

    const positionToSave = isInSpecialRoom
      ? { x: 4.5, y: -0.35, z: -27 }
      : { x: myPosition.x, y: myPosition.y, z: myPosition.z }

    // Save position in database FIRST (this doesn't affect session tracking)
    console.log("[World] Saving position...")
    await supabase
      .from("interactive_profiles")
      .update({
        position_x: positionToSave.x,
        position_y: positionToSave.y,
        position_z: positionToSave.z,
        is_online: false,
        last_seen: new Date().toISOString(),
      })
      .eq("user_id", userId)

    // Call onExit to end session tracking - this MUST complete before navigation
    if (onExit) {
      console.log("[World] Calling onExit to end session...")
      try {
        await onExit()
        console.log("[World] onExit completed successfully")
      } catch (err) {
        console.error("[World] Error in onExit:", err)
      }
    } else {
      console.warn("[World] onExit is not defined!")
    }

    // Longer delay to ensure all updates are committed before navigation
    console.log("[World] Waiting before navigation...")
    await new Promise((resolve) => setTimeout(resolve, 300))

    console.log("[World] Navigating to home...")
    router.push("/")
  }

  return (
    <div className="relative w-full h-screen">
      {/* Loading Screen - shown while world is loading */}
      {isWorldLoading && (
        <WorldLoadingScreen
          progress={loadingProgress}
          currentStep={loadingStep}
          completedSteps={loadingCompletedSteps}
          onSkip={skipLoading}
        />
      )}

      {/* FPS Stats container - centered left */}
      {process.env.NODE_ENV === "development" && (
        <div ref={fpsStatsContainerRef} className="absolute left-4 top-1/2 -translate-y-1/2 z-50" />
      )}
      <Canvas
        // Pass povMode to camera
        camera={povMode ? undefined : { position: [0, 8, -12], fov: 60 }}
        style={{ width: "100vw", height: "100vh" }}
        shadows={getGraphicsConfig(graphicsQuality as GraphicsQuality).shadows}
        gl={{
          antialias: getGraphicsConfig(graphicsQuality as GraphicsQuality).antialias,
          alpha: false,
          powerPreference: getGraphicsConfig(graphicsQuality as GraphicsQuality).powerPreference,
        }}
      >
        {/* FPS Stats - only in development mode */}
        {process.env.NODE_ENV === "development" && fpsStatsContainerRef.current && (
          <Stats showPanel={0} parent={fpsStatsContainerRef as React.RefObject<HTMLElement>} />
        )}

        {povMode && (
          <>
            <PerspectiveCamera makeDefault fov={75} />
            <FirstPersonCamera
              position={myPosition}
              rotation={fpsRotation}
              onRotationChange={(yaw, pitch) => setFpsRotation({ yaw, pitch })}
            />
          </>
        )}

        {/* Environment (sky, lights) - always active, fog disabled indoors */}
        <WorldEnvironment
          worldMode={worldSettings.worldMode}
          graphicsQuality={graphicsQuality as GraphicsQuality}
          isIndoors={
            !!(currentCinemaRoom || currentRoom === "stadium" || currentRoom === "arcade" || currentRoom === "disco")
          }
        />

        {/* Update rendering logic to use currentRoom state instead of userProfile */}
        {!currentCinemaRoom && currentRoom !== "stadium" && currentRoom !== "arcade" && currentRoom !== "disco" ? (
          <>
            {/* City Skyline - immersive background buildings around the map */}
            <CitySkyline worldMode={worldSettings.worldMode} graphicsQuality={graphicsQuality as GraphicsQuality} />

            {/* Ground - extracted component */}
            <WorldGround worldMode={worldSettings.worldMode} />

            {/* Collision Debug Visualization - extracted component */}
            {showCollisionDebug && <CollisionDebugVisualization collisionZones={collisionZonesData} />}

            {/* Arcade building */}
            <ArcadeBuilding position={[0, 0, 15]} playerPosition={myPosition} onEnter={handleEnterArcade} />

            {/* Stadium building */}
            <StadiumBuilding position={[25, 0, -15]} playerPosition={myPosition} onEnter={handleEnterStadium} />

            {/* Decorative buildings (non-interactive) */}
            <DecorativeBuildings />

            {/* Panneau info près de la plaza pour ouvrir la map */}
            <InfoPanel
              position={[6.3, 0, -17.1]}
              isNearby={nearbyInfoPanel}
              showButton={!showMap}
              onInteract={() => setShowMap(true)}
            />

            {/* Discothèque Building */}
            <DiscoBuilding position={[-15, 0, -20]} playerPosition={myPosition} onEnter={handleEnterDisco} />

            {/* Cinema Building */}
            <CinemaBuilding position={[15, 0, 0]} playerPosition={myPosition} onEnter={() => setShowCinema(true)} />

            {/* Path Network - paved paths connecting buildings */}
            <PathNetwork worldMode={worldSettings.worldMode} graphicsQuality={graphicsQuality as GraphicsQuality} />

            {/* Central Plaza - animated fountain, benches, decorative lights */}
            <CentralPlaza worldMode={worldSettings.worldMode} graphicsQuality={graphicsQuality as GraphicsQuality} />

            {/* Ambient colored lampposts around the world */}
            <AmbientLamppostCollection
              worldMode={worldSettings.worldMode}
              graphicsQuality={graphicsQuality as GraphicsQuality}
            />

            {/* Decorations (trees, lampposts, benches, bushes) - extracted component */}
            <WorldDecorations
              worldMode={worldSettings.worldMode}
              graphicsQuality={graphicsQuality as GraphicsQuality}
            />
          </>
        ) : currentRoom === "arcade" ? (
          <ArcadeInterior
            arcadeMachines={arcadeMachines}
            currentArcadeMachine={currentArcadeMachine}
            showArcade={showArcade}
            pendingExternalMachine={pendingExternalMachine}
            showMenu={showMenu}
            onSelectMachine={handleSelectArcadeMachine}
            onShowArcade={() => setShowArcade(true)}
          />
        ) : currentRoom === "stadium" ? (
          <StadiumInterior stadium={stadium} stadiumSeat={stadiumSeat} isStadiumMuted={isStadiumMuted} />
        ) : currentRoom === "disco" ? (
          <DiscoInterior isDiscoMuted={isDiscoMuted} graphicsQuality={graphicsQuality} />
        ) : currentCinemaRoom && isCinemaInteriorActive ? (
          <CinemaInterior
            currentCinemaRoom={currentCinemaRoom}
            cinemaRooms={cinemaRooms}
            cinemaSessions={cinemaSessions}
            cinemaSeats={cinemaSeats}
            mySeat={mySeat}
            showMovieFullscreen={showMovieFullscreen}
            isCinemaMuted={isCinemaMuted}
            countdown={countdown}
          />
        ) : null}

        {/* Player avatars with badges - using InterpolatedPlayer for smooth movement */}
        {otherPlayers
          .filter((p) => {
            const playerIsInSameRoom =
              currentRoom === p.current_room || (currentRoom === null && p.current_room === null)
            // Filter out players without valid username
            const hasValidProfile = p.user_profiles?.username || p.username ? true : false

            // Filter out players at default spawn position (not really in interactive)
            const isAtDefaultPosition =
              p.position_x === 0 && p.position_z === 0 && (p.position_y === 0 || p.position_y === 0.5)

            return playerIsInSameRoom && hasValidProfile && !isAtDefaultPosition
          })
          .map((player) => (
            <InterpolatedPlayer
              key={player.user_id}
              player={player}
              avatarStyle={player.avatar_style || { bodyColor: "#ef4444", headColor: "#fbbf24", faceSmiley: "😊" }}
              playerAction={playerActions[player.user_id]}
              worldSettings={{
                ...worldSettings,
                showStatusBadges: worldSettings.showStatusBadges && showBadgesPreference,
              }}
              playerChatBubbles={playerChatBubbles}
            />
          ))}

        {!povMode && userProfile && (
          <LocalPlayerAvatar
            position={myPosition}
            rotation={myRotation}
            avatarStyle={myAvatarStyle}
            isMoving={isMoving}
            isJumping={isJumping}
            isDancing={isDancing}
          >
            {/* Cacher le nameplate pendant le saut pour éviter le décalage */}
            {!isJumping && (
              <Html position={[0, 2.6, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
                <div className="flex flex-col items-center gap-1 pointer-events-none">
                  <div className="flex items-center gap-1 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                    <span className="text-white text-xs font-medium whitespace-nowrap">
                      {myProfile?.username || userProfile.username || "Vous"}
                    </span>
                    {myLevel > 0 && (
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                        Lvl {myLevel}
                      </span>
                    )}
                    {/* Le joueur voit toujours son propre badge (indépendamment du réglage admin) */}
                    {userProfile.is_admin && <Shield className="w-3 h-3 text-red-500" />}
                    {userProfile.is_vip_plus && !userProfile.is_admin && <Crown className="w-3 h-3 text-purple-400" />}
                    {userProfile.is_vip && !userProfile.is_vip_plus && !userProfile.is_admin && (
                      <Star className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  {playerChatBubbles[userProfile.id] &&
                    Date.now() - playerChatBubbles[userProfile.id].timestamp < 5000 && (
                      <div className="bg-white text-black text-xs px-3 py-1 rounded-lg max-w-[200px] break-words shadow-lg">
                        {playerChatBubbles[userProfile.id].message}
                      </div>
                    )}
                  {currentEmoji && <div className="text-4xl animate-bounce">{currentEmoji}</div>}
                </div>
              </Html>
            )}
          </LocalPlayerAvatar>
        )}

        {!povMode && (
          <>
            <CameraFollower characterPosition={myPosition} orbitControlsRef={orbitControlsRef} />
            <OrbitControls
              ref={orbitControlsRef}
              target={[myPosition.x, myPosition.y + 1, myPosition.z]}
              maxPolarAngle={Math.PI / 2.5}
              minDistance={6}
              maxDistance={25}
              enableRotate={!isMobileMode}
              enablePan={false}
            />
          </>
        )}
      </Canvas>

      {/* Menu Button - caché quand un jeu arcade est ouvert */}
      {!currentArcadeMachine && (
        <div className={`absolute z-[100] flex flex-col ${isMobileMode ? "top-4 left-4 gap-2" : "top-6 left-6 gap-4"}`}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showMenu && (
            <MenuDropdown
              isMobileMode={isMobileMode}
              myProfile={myProfile}
              onlineCount={onlineCount}
              enableChat={worldSettings.enableChat}
              onOpenSettings={() => {
                setShowSettings(true)
                setShowMenu(false)
              }}
              onOpenAvatar={() => {
                setShowAvatarCustomizer(true)
                setShowMenu(false)
              }}
              onOpenQuests={() => {
                setShowQuests(true)
                setShowMenu(false)
              }}
              onOpenChat={() => {
                setShowChat(true)
                setShowMenu(false)
              }}
              onOpenMap={() => {
                setShowMap(true)
                setShowMenu(false)
              }}
              onQuit={handleQuitWorld}
            />
          )}
        </div>
      )}

      {/* Bouton plein écran - caché en mode mobile */}
      {(!isFullscreen || isMobileMode) && !currentArcadeMachine && !isMobileMode && (
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <button
            onClick={handleFullscreen}
            className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-lg hover:bg-white/30 transition-colors shadow-lg"
            title="Mode Immersif"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
        </div>
      )}

      {showChatInput && !isFullscreen && (
        <ChatInput
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          onClose={() => setShowChatInput(false)}
          isMobileMode={isMobileMode}
        />
      )}

      {isFullscreen && (
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 z-50 bg-red-500/80 backdrop-blur-lg text-white p-3 rounded-full hover:bg-red-600/80 transition-colors shadow-lg"
          title="Quitter le plein écran"
        >
          <Minimize className="w-6 h-6" />
        </button>
      )}

      {mySeat !== null && currentCinemaRoom?.embed_url && !showMovieFullscreen && (
        <button
          onClick={() => setShowMovieFullscreen(true)}
          className="absolute bottom-24 right-36 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Voir le Film en Plein Écran
        </button>
      )}

      {showMovieFullscreen && currentCinemaRoom?.embed_url && (
        <MovieFullscreenModal
          movieTitle={currentCinemaRoom.movie_title}
          embedUrl={currentCinemaRoom.embed_url}
          onClose={() => setShowMovieFullscreen(false)}
          scheduleStart={currentCinemaRoom.schedule_start}
        />
      )}

      {showChat && (
        <ChatModal
          currentCinemaRoom={currentCinemaRoom}
          messages={messages}
          roomMessages={roomMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {showAvatarCustomizer && (
        <AvatarCustomizer
          myAvatarStyle={myAvatarStyle}
          saveAvatarStyle={saveAvatarStyle}
          customizationOptions={customizationOptions}
          userProfile={userProfile}
          onClose={() => setShowAvatarCustomizer(false)}
        />
      )}

      {showQuests && <QuestsModal onClose={() => setShowQuests(false)} userId={userId} />}

      {/* Boutons d'actions - positionnés différemment selon le mode mobile */}
      <ActionButtons
        isMobileMode={isMobileMode}
        povMode={povMode}
        showQuickActions={showQuickActions}
        enableChat={worldSettings.enableChat}
        enableEmojis={worldSettings.enableEmojis}
        onFullscreen={handleFullscreen}
        onTogglePov={togglePovMode}
        onOpenChat={() => setShowChatInput(true)}
        onToggleQuickActions={() => setShowQuickActions(!showQuickActions)}
      />

      {/* Panel Quick Actions - positionné selon le mode */}
      {showQuickActions && (
        <QuickActionsPanel
          isMobileMode={isMobileMode}
          enableJumping={worldSettings.enableJumping}
          onJump={() => handleQuickAction("jump")}
          onEmoji={handleEmoji}
          onDance={handleDance}
          isDancing={isDancing}
        />
      )}

      {/* Boutons fixes en bas à droite - visible dans une salle */}
      <RoomActionButtons
        currentRoom={currentRoom}
        currentCinemaRoom={currentCinemaRoom}
        mySeat={mySeat}
        isCinemaMuted={isCinemaMuted}
        onSitCinema={handleSitInAnySeat}
        onStandCinema={handleSitInSeat}
        onToggleCinemaMute={() => setIsCinemaMuted(!isCinemaMuted)}
        isDiscoMuted={isDiscoMuted}
        onToggleDiscoMute={() => setIsDiscoMuted(!isDiscoMuted)}
        stadiumSeat={stadiumSeat}
        onSitStadium={handleSitInStadium}
        onStandStadium={handleStandUpFromStadium}
        onLeaveCinema={handleLeaveRoom}
        onLeaveArcade={handleLeaveArcade}
        onLeaveDisco={handleLeaveDisco}
        onLeaveStadium={handleLeaveStadium}
      />

      {/* Voice Chat Panel */}
      {showVoiceChat && (
        <VoiceChatPanel
          isVoiceConnected={isVoiceConnected}
          isMicMuted={isMicMuted}
          isSpeaking={isSpeaking}
          micPermissionDenied={micPermissionDenied}
          micErrorMessage={micErrorMessage}
          currentRoom={currentRoom}
          currentCinemaRoom={currentCinemaRoom}
          voicePeers={voicePeers}
          onRequestMicAccess={requestMicAccess}
          onToggleMic={toggleMic}
          onDisconnect={disconnect}
          onResetPermission={resetMicPermission} // Pass new functions
          onSetPeerVolume={setPeerVolume}
          onTogglePeerMute={togglePeerMute}
        />
      )}

      {!isMobileMode && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          {stadiumSeat !== null ? (
            // Assis dans le stade - uniquement indication de saut
            <>🏟️ Assis dans les gradins{worldSettings.enableJumping && " | Espace = Sauter"}</>
          ) : povMode ? (
            <>
              🎮 Cliquez pour contrôler la caméra | ESC pour libérer | ZQSD pour bouger | Shift = Sprint
              {worldSettings.enableJumping && " | Espace = Sauter"}
            </>
          ) : (
            <>
              ⌨️ Touches ZQSD ou Flèches pour se déplacer | Shift = Sprint
              {worldSettings.enableJumping && " | Espace = Sauter"}
            </>
          )}
        </div>
      )}

      {isMobileMode && <MobileJoystick onMove={handleJoystickMove} />}
      {isMobileMode && <CameraJoystick onRotate={handleCameraRotate} />}
      {isMobileMode && <CenterTouchZone onRotate={handleCameraRotate} />}
      {isMobileMode && <JoystickBlockZones />}

      {showAFKWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Déconnexion AFK</h2>
            <p className="mb-4">Vous avez été inactif pendant plus de 3 heures.</p>
            <p>Redirection en cours...</p>
          </div>
        </div>
      )}

      {showDiscoClosedModal && <ClosedModal type="disco" onClose={() => setShowDiscoClosedModal(false)} />}

      {showArcadeClosedModal && <ClosedModal type="arcade" onClose={() => setShowArcadeClosedModal(false)} />}

      {showStadiumClosedModal && <ClosedModal type="stadium" onClose={() => setShowStadiumClosedModal(false)} />}

      {showCinemaClosedModal && <ClosedModal type="cinema" onClose={() => setShowCinemaClosedModal(false)} />}

      {showSettings && (
        <SettingsModal
          controlMode={controlMode}
          setControlMode={setControlMode}
          graphicsQuality={graphicsQuality}
          setGraphicsQuality={setGraphicsQuality}
          povMode={povMode}
          togglePovMode={togglePovMode}
          showBadgesPreference={showBadgesPreference}
          setShowBadgesPreference={setShowBadgesPreference}
          showCollisionDebug={showCollisionDebug}
          setShowCollisionDebug={setShowCollisionDebug}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showMap && (
        <MapModal
          isArcadeOpen={isArcadeOpen}
          isStadiumOpen={isStadiumOpen}
          isDiscoOpen={isDiscoOpen}
          onOpenCinema={() => {
            setShowCinema(true)
            setShowMap(false)
          }}
          onEnterArcade={() => {
            handleEnterArcade()
            setShowMap(false)
          }}
          onEnterStadium={() => {
            handleEnterStadium()
            setShowMap(false)
          }}
          onEnterDisco={() => {
            handleEnterDisco()
            setShowMap(false)
          }}
          onTeleportToPlaza={() => {
            // Teleport near the info panel / map sign (6.3, -17.1)
            setMyPosition({ x: 6, y: -0.35, z: -15 })
            setMyRotation(0)
          }}
          onClose={() => setShowMap(false)}
        />
      )}

      {showArcade && (
        <ArcadeModal
          arcadeMachines={arcadeMachines}
          onSelectMachine={handleSelectArcadeMachine}
          onClose={() => setShowArcade(false)}
        />
      )}

      {currentArcadeMachine && <ArcadeGameView machine={currentArcadeMachine} onClose={handleCloseArcadeMachine} />}

      {pendingExternalMachine && (
        <ExternalGameModal
          machine={pendingExternalMachine}
          countdown={externalCountdown}
          onOpenExternal={handleOpenExternalMachine}
          onClose={handleCloseExternalModal}
        />
      )}

      {showStadium && stadium && (
        <StadiumModal stadium={stadium} onEnter={handleEnterStadium} onClose={() => setShowStadium(false)} />
      )}

      {currentRoom === "stadium" && stadiumSeat !== null && (
        <StadiumInfoBar
          matchTitle={stadium?.match_title || "Match en direct"}
          seatSide={stadiumSeat.side}
          seatRow={stadiumSeat.row}
          isMuted={isStadiumMuted}
          onToggleMute={() => setIsStadiumMuted(!isStadiumMuted)}
        />
      )}

      {showCinema && (
        <CinemaModal
          cinemaRooms={cinemaRooms}
          cinemaSeats={cinemaSeats}
          cinemaSessions={cinemaSessions}
          onEnterRoom={handleEnterCinemaRoom}
          onClose={() => setShowCinema(false)}
        />
      )}
    </div>
  )
}
