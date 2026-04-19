"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface UseVoiceChatProps {
  userId?: string | null
  currentRoom?: string | null
  voiceChatEnabled?: boolean
}

interface VoicePeer {
  userId: string
  username: string
  stream: MediaStream | null
  isMuted: boolean
  isSpeaking: boolean
  volume: number
}

export function useVoiceChat({ userId = null, currentRoom = null, voiceChatEnabled = false }: UseVoiceChatProps = {}) {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([])
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null)
  const usernameRef = useRef<string>("")

  useEffect(() => {
    if (!userId) return

    const loadUsername = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.from("user_profiles").select("username").eq("user_id", userId).single()

      if (data && !error) {
        usernameRef.current = data.username || `User ${userId.slice(0, 8)}`
        console.log("[v0] [VoiceChat] Loaded username:", usernameRef.current)
      } else {
        usernameRef.current = `User ${userId.slice(0, 8)}`
        console.log("[v0] [VoiceChat] Failed to load username, using fallback:", usernameRef.current)
      }
    }

    loadUsername()
  }, [userId])

  const requestMicAccess = useCallback(async () => {
    console.log("[v0] [VoiceChat] ==> requestMicAccess called")
    console.log("[v0] [VoiceChat] voiceChatEnabled:", voiceChatEnabled)
    console.log("[v0] [VoiceChat] userId:", userId)
    console.log("[v0] [VoiceChat] currentRoom:", currentRoom)

    if (!voiceChatEnabled) {
      console.log("[v0] [VoiceChat] Voice chat is disabled in world settings")
      setMicErrorMessage("Le chat vocal est désactivé dans les paramètres du monde")
      return false
    }

    if (!userId) {
      console.log("[v0] [VoiceChat] No userId provided")
      setMicErrorMessage("Erreur: ID utilisateur manquant")
      return false
    }

    if (!currentRoom) {
      console.log("[v0] [VoiceChat] No currentRoom provided")
      setMicErrorMessage("Erreur: Aucune salle sélectionnée")
      return false
    }

    try {
      console.log("[v0] [VoiceChat] Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      console.log("[v0] [VoiceChat] ✓ Microphone access granted")
      localStreamRef.current = stream

      // Set up audio analysis for speaking detection
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start muted by default
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false
      })

      setIsVoiceConnected(true)
      setMicPermissionDenied(false)
      setMicErrorMessage(null)
      console.log("[v0] [VoiceChat] ✓ Voice chat connected successfully")
      return true
    } catch (error) {
      console.error("[v0] [VoiceChat] ✗ Error accessing microphone:", error)
      setMicPermissionDenied(true)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setMicErrorMessage(
            "Accès au microphone refusé. Cliquez sur l'icône de verrouillage dans la barre d'adresse et autorisez le microphone.",
          )
        } else if (error.name === "NotFoundError") {
          setMicErrorMessage("Aucun microphone détecté. Vérifiez que votre microphone est branché.")
        } else if (error.name === "NotReadableError") {
          setMicErrorMessage("Impossible d'accéder au microphone. Il est peut-être utilisé par une autre application.")
        } else if (error.name === "OverconstrainedError") {
          setMicErrorMessage("Configuration du microphone non supportée.")
        } else if (error.name === "NotSupportedError") {
          setMicErrorMessage(
            "Votre navigateur ne supporte pas l'accès au microphone. Utilisez HTTPS ou un navigateur récent.",
          )
        } else {
          setMicErrorMessage(`Erreur microphone: ${error.message}`)
        }
      } else {
        setMicErrorMessage("Erreur inconnue lors de l'accès au microphone.")
      }

      return false
    }
  }, [voiceChatEnabled, userId, currentRoom])

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return

    const newMutedState = !isMicMuted
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState
    })
    setIsMicMuted(newMutedState)
    console.log("[v0] [VoiceChat] Mic toggled. Muted:", newMutedState)
  }, [isMicMuted])

  const disconnect = useCallback(() => {
    console.log("[v0] [VoiceChat] Disconnecting voice chat...")
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (channelRef.current) {
      console.log("[v0] [VoiceChat] Leaving voice channel")
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    setIsVoiceConnected(false)
    setIsMicMuted(true)
    setIsSpeaking(false)
    setVoicePeers([])
    console.log("[v0] [VoiceChat] ✓ Disconnected")
  }, [])

  // Detect speaking
  useEffect(() => {
    if (!analyserRef.current || isMicMuted) {
      setIsSpeaking(false)
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const checkSpeaking = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length

      setIsSpeaking(average > 30)

      animationFrameRef.current = requestAnimationFrame(checkSpeaking)
    }

    checkSpeaking()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isMicMuted])

  useEffect(() => {
    if (!isVoiceConnected || !currentRoom || !userId) {
      if (channelRef.current) {
        console.log("[v0] [VoiceChat] Leaving voice channel (conditions not met)")
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setVoicePeers([])
      return
    }

    console.log("[v0] [VoiceChat] ===== SETTING UP VOICE SYNC =====")
    console.log("[v0] [VoiceChat] Room:", currentRoom)
    console.log("[v0] [VoiceChat] User ID:", userId)
    console.log("[v0] [VoiceChat] Username:", usernameRef.current)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const voiceChannelName = `voice_room:${currentRoom}`
    console.log("[v0] [VoiceChat] Creating channel:", voiceChannelName)

    const channel = supabase.channel(voiceChannelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState()
        console.log("[v0] [VoiceChat] ===== PRESENCE SYNC =====")
        console.log("[v0] [VoiceChat] Presence state:", JSON.stringify(presenceState, null, 2))

        const peers: VoicePeer[] = []
        Object.entries(presenceState).forEach(([key, value]) => {
          const presences = value as any[]
          presences.forEach((presence) => {
            console.log("[v0] [VoiceChat] Processing presence:", presence)
            if (presence.user_id !== userId) {
              peers.push({
                userId: presence.user_id,
                username: presence.username || `User ${presence.user_id.slice(0, 8)}`,
                stream: null,
                isMuted: presence.is_muted || false,
                isSpeaking: presence.is_speaking || false,
                volume: 1,
              })
              console.log("[v0] [VoiceChat] Added peer:", presence.username)
            }
          })
        })

        console.log("[v0] [VoiceChat] Total peers in voice:", peers.length)
        setVoicePeers(peers)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[v0] [VoiceChat] ===== USER JOINED VOICE =====")
        console.log("[v0] [VoiceChat] Key:", key)
        console.log("[v0] [VoiceChat] New presences:", newPresences)
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[v0] [VoiceChat] ===== USER LEFT VOICE =====")
        console.log("[v0] [VoiceChat] Key:", key)
        console.log("[v0] [VoiceChat] Left presences:", leftPresences)
      })
      .subscribe(async (status) => {
        console.log("[v0] [VoiceChat] Channel subscription status:", status)
        if (status === "SUBSCRIBED") {
          console.log("[v0] [VoiceChat] ✓ Subscribed to voice channel:", voiceChannelName)
          const presenceData = {
            user_id: userId,
            username: usernameRef.current || `User ${userId.slice(0, 8)}`,
            is_muted: isMicMuted,
            is_speaking: isSpeaking,
            online_at: new Date().toISOString(),
          }
          console.log("[v0] [VoiceChat] Tracking presence:", presenceData)
          const trackResult = await channel.track(presenceData)
          console.log("[v0] [VoiceChat] Track result:", trackResult)
        } else if (status === "CHANNEL_ERROR") {
          console.error("[v0] [VoiceChat] ✗ Channel error")
        } else if (status === "TIMED_OUT") {
          console.error("[v0] [VoiceChat] ✗ Channel timed out")
        } else if (status === "CLOSED") {
          console.log("[v0] [VoiceChat] Channel closed")
        }
      })

    channelRef.current = channel

    return () => {
      console.log("[v0] [VoiceChat] Cleaning up voice channel")
      channel.unsubscribe()
    }
  }, [isVoiceConnected, currentRoom, userId])

  useEffect(() => {
    if (channelRef.current && userId && usernameRef.current) {
      const presenceData = {
        user_id: userId,
        username: usernameRef.current,
        is_muted: isMicMuted,
        is_speaking: isSpeaking,
        online_at: new Date().toISOString(),
      }
      console.log("[v0] [VoiceChat] Updating presence:", presenceData)
      channelRef.current.track(presenceData)
    }
  }, [isMicMuted, isSpeaking, userId])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  useEffect(() => {
    if (!currentRoom && isVoiceConnected) {
      disconnect()
    }
  }, [currentRoom, isVoiceConnected, disconnect])

  const resetMicPermission = useCallback(() => {
    console.log("[v0] [VoiceChat] Resetting microphone permission state")
    setMicPermissionDenied(false)
    setMicErrorMessage(null)
  }, [])

  const setPeerVolume = useCallback((peerId: string, volume: number) => {
    setVoicePeers((peers) =>
      peers.map((peer) => (peer.userId === peerId ? { ...peer, volume: Math.max(0, Math.min(1, volume)) } : peer)),
    )
  }, [])

  const togglePeerMute = useCallback((peerId: string) => {
    setVoicePeers((peers) => peers.map((peer) => (peer.userId === peerId ? { ...peer, isMuted: !peer.isMuted } : peer)))
  }, [])

  return {
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
  }
}
