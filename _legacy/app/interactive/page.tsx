"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import InteractiveWorld from "@/components/interactive/world-3d"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { User, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { AdGateModal, hasRecentAdView } from "@/components/ad-gate-modal"

export default function InteractivePage() {
  const [hasProfile, setHasProfile] = useState(false)
  const [username, setUsername] = useState("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showWorld, setShowWorld] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [showConstructionWarning, setShowConstructionWarning] = useState(false)
  const [hasAcceptedWarning, setHasAcceptedWarning] = useState(false)
  const [showAdGate, setShowAdGate] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState({
    bodyColor: '#3b82f6',
    headColor: '#fde68a',
    skinTone: '#fbbf24',
    hairStyle: 'short',
    hairColor: '#1f2937',
    accessory: 'none',
    faceSmiley: '😊'
  })

  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const supabase = createClient()

  // Session tracking - using refs to avoid stale closure issues
  const sessionStartTimeRef = React.useRef<Date | null>(null)
  const currentVisitIdRef = React.useRef<string | null>(null)
  const isTrackingRef = React.useRef<boolean>(false) // Prevent double tracking
  const hasEndedSessionRef = React.useRef<boolean>(false) // Prevent double session ending
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null)

  // Track visit when user enters the world
  const trackVisit = async () => {
    if (!user) return

    // Prevent double tracking
    if (isTrackingRef.current || currentVisitIdRef.current) {
      console.log("[Session] Already tracking, skipping duplicate")
      return
    }

    isTrackingRef.current = true

    try {
      const { data, error } = await supabase
        .from("interactive_world_visits")
        .insert({ user_id: user.id })
        .select("id")
        .single()

      if (error) {
        console.error("[Session] Error inserting visit:", error)
        isTrackingRef.current = false
        return
      }

      if (data) {
        currentVisitIdRef.current = data.id
        sessionStartTimeRef.current = new Date()
        hasEndedSessionRef.current = false // Reset for new session
        setCurrentVisitId(data.id)
        console.log("[Session] Started tracking visit:", data.id)
      }
    } catch (err) {
      console.error("Error tracking visit:", err)
      isTrackingRef.current = false
    }
  }

  // End session and record duration - uses refs for reliable access
  const endSession = useCallback(async () => {
    console.log("[Session] endSession called")

    // Prevent double session ending
    if (hasEndedSessionRef.current) {
      console.log("[Session] Session already ended, skipping")
      return
    }

    console.log("[Session] currentVisitIdRef:", currentVisitIdRef.current)
    console.log("[Session] sessionStartTimeRef:", sessionStartTimeRef.current)

    const visitId = currentVisitIdRef.current
    const startTime = sessionStartTimeRef.current

    if (!visitId || !startTime) {
      console.log("[Session] No active session to end - visitId:", visitId, "startTime:", startTime)
      return
    }

    // Mark as ended immediately to prevent double-ending
    hasEndedSessionRef.current = true

    const sessionEnd = new Date()
    const durationSeconds = Math.floor((sessionEnd.getTime() - startTime.getTime()) / 1000)

    console.log("[Session] Ending session:", visitId, "Duration:", durationSeconds, "seconds")

    // Clear refs immediately
    currentVisitIdRef.current = null
    sessionStartTimeRef.current = null
    isTrackingRef.current = false

    try {
      const { error, data } = await supabase
        .from("interactive_world_visits")
        .update({
          session_end: sessionEnd.toISOString(),
          session_duration_seconds: durationSeconds
        })
        .eq("id", visitId)
        .select()

      if (error) {
        console.error("[Session] Error updating session:", error)
      } else {
        console.log("[Session] Session ended successfully:", visitId, "Duration:", durationSeconds, "seconds", "Response:", data)
      }
    } catch (err) {
      console.error("[Session] Exception ending session:", err)
    }
  }, [supabase])

  // End session using fetch with keepalive for page unload (more reliable)
  const endSessionBeacon = () => {
    // Skip if already ended
    if (hasEndedSessionRef.current) return

    const visitId = currentVisitIdRef.current
    const startTime = sessionStartTimeRef.current

    if (!visitId || !startTime) return

    // Mark as ended
    hasEndedSessionRef.current = true

    const durationSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)

    // Clear refs immediately
    currentVisitIdRef.current = null
    sessionStartTimeRef.current = null

    // Use our API route with keepalive - this allows the request to complete even after page unload
    // The API route handles authentication via cookies which are sent automatically
    fetch('/api/interactive/end-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitId,
        durationSeconds
      }),
      keepalive: true
    }).catch(() => {
      // Silently fail - we can't do anything about it during page unload
    })

    console.log("[Session] Sent keepalive request for session:", visitId, "Duration:", durationSeconds, "s")
  }

  // Exit world handler - properly ends the session
  const exitWorld = async () => {
    await endSession()
    setCurrentVisitId(null)
    setShowWorld(false)
  }

  const enterWorld = () => {
    trackVisit()
    setShowWorld(true)
  }

  // Check if user has already accepted the construction warning
  useEffect(() => {
    const accepted = localStorage.getItem('wavewatch_construction_warning_accepted')
    if (accepted === 'true') {
      setHasAcceptedWarning(true)
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login")
      return
    }
    // Ne pas re-vérifier le profil si on est déjà sur la gate pub ou dans le monde
    if (showAdGate || showWorld) return
    checkProfile()
  }, [user, loading, showAdGate, showWorld])

  const checkProfile = async () => {
    if (!user) return

    console.log('[v0] Checking profiles for user:', user.id)
    setCheckingProfile(true)

    try {
      const [interactiveResult, userProfileResult] = await Promise.all([
        supabase
          .from("interactive_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_profiles")
          .select("id, username, is_admin, is_vip, is_vip_plus")
          .eq("id", user.id)
          .maybeSingle()
      ])

      console.log('[v0] Interactive profile:', interactiveResult.data)
      console.log('[v0] User profile from DB:', userProfileResult.data)

      const fallbackUserProfile = {
        id: user.id,
        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        is_admin: false,
        is_vip: false,
        is_vip_plus: false
      }

      const effectiveUserProfile = userProfileResult.data || fallbackUserProfile
      setUserProfile(effectiveUserProfile)

      console.log('[v0] Effective user profile:', effectiveUserProfile)

      const interactiveProfile = interactiveResult.data

      // Utiliser le username du profil utilisateur (user_profiles), sinon le début de l'email
      const profileUsername = effectiveUserProfile.username || user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`

      if (interactiveProfile && interactiveProfile.username && interactiveProfile.username.trim() !== '') {
        console.log('[v0] Found existing interactive profile')

        // Mettre à jour le username dans interactive_profiles avec celui de user_profiles si différent
        if (interactiveProfile.username !== profileUsername) {
          console.log('[v0] Updating interactive username to match user_profiles:', profileUsername)
          await supabase
            .from("interactive_profiles")
            .update({ username: profileUsername })
            .eq("user_id", user.id)
        }

        setHasProfile(true)
        // Check if user already accepted the warning
        const alreadyAccepted = localStorage.getItem('wavewatch_construction_warning_accepted') === 'true'
        if (alreadyAccepted) {
          // Vérifier si la pub a déjà été vue récemment
          if (hasRecentAdView()) {
            enterWorld()
          } else {
            setShowAdGate(true)
          }
        } else {
          setShowConstructionWarning(true)
        }
      } else {
        console.log('[v0] No interactive profile found, showing username input')
        setHasProfile(false)
        setUsername(profileUsername)
      }
    } catch (err) {
      console.error('[v0] Error checking profiles:', err)
      alert(`Erreur lors de la vérification des profils: ${err}`)
      setHasProfile(false)
    } finally {
      setCheckingProfile(false)
    }
  }

  const handleCreateProfile = async () => {
    if (!user || !username.trim()) {
      console.error('[v0] Cannot create profile: missing user or username')
      alert('Erreur: Nom d\'utilisateur manquant')
      return
    }

    console.log('[v0] Creating interactive profile with username:', username.trim())
    console.log('[v0] Avatar style:', avatarStyle)

    try {
      const { data, error } = await supabase
        .from("interactive_profiles")
        .upsert({
          user_id: user.id,
          username: username.trim(),
          position_x: 0,
          position_y: 0.5,
          position_z: 0,
          is_online: true,
          last_seen: new Date().toISOString(),
          avatar_style: avatarStyle,
          current_room: null
        }, {
          onConflict: 'user_id'
        })
        .select()

      if (error) {
        console.error('[v0] Error creating interactive profile:', error)
        alert(`Erreur lors de la création du profil: ${error.message}`)
        return
      }

      console.log('[v0] Interactive profile created successfully:', data)

      setHasProfile(true)
      setShowOnboarding(false)
      // Check if user already accepted the warning
      const alreadyAccepted = localStorage.getItem('wavewatch_construction_warning_accepted') === 'true'
      if (alreadyAccepted) {
        // Vérifier si la pub a déjà été vue récemment
        if (hasRecentAdView()) {
          enterWorld()
        } else {
          setShowAdGate(true)
        }
      } else {
        setShowConstructionWarning(true)
      }
    } catch (err) {
      console.error('[v0] Unexpected error during profile creation:', err)
      alert(`Erreur inattendue: ${err}`)
    }
  }

  const handleEnterWorld = () => {
    // Save that user accepted the warning
    localStorage.setItem('wavewatch_construction_warning_accepted', 'true')
    setHasAcceptedWarning(true)
    setShowConstructionWarning(false)

    // Vérifier si l'utilisateur a déjà vu une pub récemment (24h)
    if (hasRecentAdView()) {
      enterWorld()
    } else {
      setShowAdGate(true)
    }
  }

  const handleAdComplete = () => {
    setShowAdGate(false)
    enterWorld()
  }

  const handleAdBack = () => {
    setShowAdGate(false)
    router.push('/')
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentVisitIdRef.current && !hasEndedSessionRef.current) {
        // Use sendBeacon for reliable delivery during page unload
        endSessionBeacon()
      }
    }

    const handlePageHide = (e: PageTransitionEvent) => {
      // pagehide is more reliable than beforeunload on mobile
      if (currentVisitIdRef.current && !hasEndedSessionRef.current) {
        endSessionBeacon()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)

      // Cleanup: End session when component unmounts (e.g., SPA navigation)
      if (currentVisitIdRef.current && !hasEndedSessionRef.current) {
        console.log("[Session] Component unmounting, ending session via beacon")
        endSessionBeacon()
      }
    }
  }, [])

  if (loading || checkingProfile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    )
  }

  if (showAdGate) {
    return (
      <AdGateModal
        onAdComplete={handleAdComplete}
        onBack={handleAdBack}
      />
    )
  }

  if (showConstructionWarning) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/50 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">🚧 Page en construction</h2>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Ouverte pour tests</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Cette page est actuellement en développement, mais elle est ouverte pour effectuer des tests.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Merci d'être <span className="text-yellow-400 font-semibold">respectueux</span> et de faire preuve de <span className="text-yellow-400 font-semibold">compréhension</span> durant cette phase.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Vos <span className="text-blue-400 font-semibold">retours</span> et votre <span className="text-blue-400 font-semibold">comportement</span> aideront à améliorer l'expérience finale.
            </p>
          </div>

          <p className="text-center text-lg text-white mb-6 font-medium">
            Bonne exploration ! 🎮
          </p>

          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Retour
            </Button>
            <Button
              onClick={handleEnterWorld}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            >
              J'ai compris, entrer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-purple-900 to-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto z-50">
        <div className="bg-black/40 backdrop-blur-2xl p-3 sm:p-4 md:p-8 rounded-3xl max-w-6xl w-full my-2 sm:my-4 border-2 border-white/20 shadow-2xl max-h-[98vh] overflow-y-auto">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-1 sm:mb-2 text-center">Créez Votre Avatar</h1>
          <p className="text-white/60 text-center mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm md:text-base">Personnalisez votre apparence</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-2xl p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[400px] border-2 border-white/10">
              <div className="w-full h-48 sm:h-64 md:h-80 bg-black/30 rounded-xl mb-2 sm:mb-4 overflow-hidden">
                <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <pointLight position={[-5, 5, -5]} intensity={0.5} color="#60a5fa" />
                  
                  <group position={[0, 0, 0]} rotation={[0, Math.PI * 0.15, 0]}>
                    <mesh position={[0, 0.575, 0]}>
                      <boxGeometry args={[0.6, 0.45, 0.35]} />
                      <meshStandardMaterial color={avatarStyle.bodyColor} />
                    </mesh>
                    <mesh position={[0, 1.05, 0]}>
                      <sphereGeometry args={[0.32, 32, 32]} />
                      <meshStandardMaterial color={avatarStyle.skinTone} />
                    </mesh>
                    
                    {avatarStyle.hairStyle === 'short' && (
                      <mesh position={[0, 1.25, 0]}>
                        <sphereGeometry args={[0.34, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={avatarStyle.hairColor} />
                      </mesh>
                    )}
                    {avatarStyle.hairStyle === 'long' && (
                      <>
                        <mesh position={[0, 1.25, 0]}>
                          <sphereGeometry args={[0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
                          <meshStandardMaterial color={avatarStyle.hairColor} />
                        </mesh>
                        <mesh position={[0, 0.8, -0.3]}>
                          <boxGeometry args={[0.5, 0.6, 0.2]} />
                          <meshStandardMaterial color={avatarStyle.hairColor} />
                        </mesh>
                      </>
                    )}
                    {avatarStyle.hairStyle === 'bald' && null}
                    
                    {avatarStyle.accessory === 'glasses' && (
                      <>
                        <mesh position={[-0.15, 1.05, 0.28]}>
                          <torusGeometry args={[0.08, 0.02, 8, 16]} />
                          <meshStandardMaterial color="#1f2937" metalness={0.8} />
                        </mesh>
                        <mesh position={[0.15, 1.05, 0.28]}>
                          <torusGeometry args={[0.08, 0.02, 8, 16]} />
                          <meshStandardMaterial color="#1f2937" metalness={0.8} />
                        </mesh>
                        <mesh position={[0, 1.05, 0.28]}>
                          <boxGeometry args={[0.12, 0.02, 0.02]} />
                          <meshStandardMaterial color="#1f2937" metalness={0.8} />
                        </mesh>
                      </>
                    )}
                    {avatarStyle.accessory === 'hat' && (
                      <>
                        <mesh position={[0, 1.35, 0]}>
                          <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
                          <meshStandardMaterial color="#ef4444" />
                        </mesh>
                        <mesh position={[0, 1.45, 0]}>
                          <cylinderGeometry args={[0.25, 0.35, 0.2, 16]} />
                          <meshStandardMaterial color="#ef4444" />
                        </mesh>
                      </>
                    )}
                    
                    <group position={[-0.45, 0.5, 0]}>
                      <mesh position={[0, -0.25, 0]}>
                        <boxGeometry args={[0.2, 0.7, 0.2]} />
                        <meshStandardMaterial color={avatarStyle.bodyColor} />
                      </mesh>
                    </group>
                    <group position={[0.45, 0.5, 0]}>
                      <mesh position={[0, -0.25, 0]}>
                        <boxGeometry args={[0.2, 0.7, 0.2]} />
                        <meshStandardMaterial color={avatarStyle.bodyColor} />
                      </mesh>
                    </group>
                    <group position={[-0.2, 0.15, 0]}>
                      <mesh position={[0, -0.35, 0]}>
                        <boxGeometry args={[0.22, 0.7, 0.22]} />
                        <meshStandardMaterial color="#2563eb" />
                      </mesh>
                    </group>
                    <group position={[0.2, 0.15, 0]}>
                      <mesh position={[0, -0.35, 0]}>
                        <boxGeometry args={[0.22, 0.7, 0.22]} />
                        <meshStandardMaterial color="#2563eb" />
                      </mesh>
                    </group>
                  </group>
                  
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                </Canvas>
              </div>
              <p className="text-white/80 text-xs md:text-sm text-center">Votre avatar tourne automatiquement</p>
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-6 max-h-none lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              <div>
                <label className="text-white font-semibold mb-2 block flex items-center gap-2 text-xs sm:text-sm md:text-base">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">1</div>
                  Couleur du Corps
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5 sm:gap-2">
                  {['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e', '#84cc16', '#f97316', '#14b8a6', '#eab308', '#6366f1', '#d946ef'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarStyle({ ...avatarStyle, bodyColor: color })}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl border-4 transition-all active:scale-95 shadow-lg ${
                        avatarStyle.bodyColor === color ? 'border-white scale-105 ring-4 ring-white/50' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      title="Couleur du corps"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 md:mb-3 block flex items-center gap-2 text-sm md:text-base">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">2</div>
                  Teint de Peau
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {['#fde68a', '#fca5a5', '#d4a373', '#c68642', '#8b6f47', '#fdba74', '#f0abfc', '#c4b5fd', '#a7f3d0', '#cbd5e1', '#fef3c7', '#fed7aa'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarStyle({ ...avatarStyle, headColor: color, skinTone: color })}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-4 transition-all active:scale-95 ${
                        avatarStyle.skinTone === color ? 'border-white scale-105 ring-4 ring-white/50' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      title="Teint de peau"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 md:mb-3 block flex items-center gap-2 text-sm md:text-base">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">3</div>
                  Style de Cheveux
                </label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { id: 'short', label: 'Courts', emoji: '👨' },
                    { id: 'long', label: 'Longs', emoji: '👩' },
                    { id: 'bald', label: 'Chauve', emoji: '🧑‍🦲' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setAvatarStyle({ ...avatarStyle, hairStyle: style.id })}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                        avatarStyle.hairStyle === style.id 
                          ? 'bg-green-500 border-white text-white scale-105' 
                          : 'bg-white/10 border-white/20 text-white/80'
                      }`}
                    >
                      <div className="text-2xl md:text-3xl mb-1">{style.emoji}</div>
                      <div className="text-xs md:text-sm font-medium">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {avatarStyle.hairStyle !== 'bald' && (
                <div>
                  <label className="text-white font-semibold mb-2 md:mb-3 block flex items-center gap-2 text-sm md:text-base">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs">4</div>
                    Couleur de Cheveux
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {['#1f2937', '#7c2d12', '#fbbf24', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#22c55e', '#6b7280', '#f59e0b', '#8b5cf6', '#14b8a6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAvatarStyle({ ...avatarStyle, hairColor: color })}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-4 transition-all active:scale-95 shadow-lg ${
                          avatarStyle.hairColor === color ? 'border-white scale-105 ring-4 ring-white/50' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: color }}
                        title="Couleur de cheveux"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-white font-semibold mb-2 md:mb-3 block flex items-center gap-2 text-sm md:text-base">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs">5</div>
                  Visage (Smiley)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { emoji: '😊', label: 'Souriant' },
                    { emoji: '😎', label: 'Cool' },
                    { emoji: '🤓', label: 'Intello' },
                    { emoji: '😇', label: 'Ange' },
                    { emoji: '🤩', label: 'Star' },
                    { emoji: '😈', label: 'Diable' },
                    { emoji: '🤖', label: 'Robot' },
                    { emoji: '👽', label: 'Alien' },
                    { emoji: '🔥', label: 'Feu' },
                    { emoji: '⭐', label: 'Étoile' }
                  ].map((face) => (
                    <button
                      key={face.emoji}
                      onClick={() => setAvatarStyle({ ...avatarStyle, faceSmiley: face.emoji })}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                        avatarStyle.faceSmiley === face.emoji 
                          ? 'bg-orange-500 border-white scale-105' 
                          : 'bg-white/10 border-white/20 text-white/80'
                      }`}
                      title={face.label}
                    >
                      <div className="text-2xl md:text-3xl">{face.emoji}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 md:mb-3 block flex items-center gap-2 text-sm md:text-base">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center text-xs">6</div>
                  Accessoires
                </label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { id: 'none', label: 'Aucun', emoji: '🙂' },
                    { id: 'glasses', label: 'Lunettes', emoji: '🤓' },
                    { id: 'hat', label: 'Chapeau', emoji: '🎩' }
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setAvatarStyle({ ...avatarStyle, accessory: acc.id })}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                        avatarStyle.accessory === acc.id 
                          ? 'bg-red-500 border-white text-white scale-105' 
                          : 'bg-white/10 border-white/20 text-white/80'
                      }`}
                    >
                      <div className="text-2xl md:text-3xl mb-1">{acc.emoji}</div>
                      <div className="text-xs md:text-sm font-medium">{acc.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateProfile}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 sm:py-3 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:from-green-600 hover:to-emerald-700 transition-all mt-3 sm:mt-4 md:mt-6 shadow-2xl hover:shadow-green-500/50 flex items-center justify-center gap-2 active:scale-95"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            Entrer dans le Monde
          </Button>
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-white mb-6">Bienvenue dans WaveWatch World</h1>
          <p className="text-white/80 mb-4">Choisissez votre nom d'utilisateur pour commencer</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border-2 border-white/30 mb-4"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && setShowOnboarding(true)}
          />
          <Button
            onClick={() => setShowOnboarding(true)}
            disabled={!username.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Continuer
          </Button>
        </div>
      </div>
    )
  }

  if (showWorld) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <InteractiveWorld userId={user!.id} userProfile={userProfile} visitId={currentVisitId} onExit={endSession} />
      </div>
    )
  }

  return null
}
