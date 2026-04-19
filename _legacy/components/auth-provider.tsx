"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { updateAdultContentPreference } from "@/lib/tmdb"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  username: string
  email: string
  isVip: boolean
  isVipPlus: boolean
  isAdmin: boolean
  isUploader: boolean
  vipExpiresAt?: string
  showAdultContent?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const isLoadingProfile = useRef(false)
  const lastLoadedUserId = useRef<string | null>(null)

  const loadUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    if (isLoadingProfile.current || lastLoadedUserId.current === supabaseUser.id) {
      console.log("[v0] Skipping duplicate profile load for:", supabaseUser.id)
      return
    }

    isLoadingProfile.current = true

    try {
      console.log("[v0] Loading profile for user ID:", supabaseUser.id)

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single()

      if (error) {
        console.error("[v0] Profile error:", error)

        if (error.message?.includes("Failed to fetch") || error.message?.includes("fetch")) {
          if (retryCount < 3) {
            console.log(`[v0] Retrying profile load (${retryCount + 1}/3)...`)
            isLoadingProfile.current = false
            await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
            return loadUserProfile(supabaseUser, retryCount + 1)
          }
          toast({
            title: "Erreur de connexion",
            description: "Problème de réseau. Veuillez réessayer.",
            variant: "destructive",
          })
        }

        if (error.code === "PGRST116") {
          const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split("@")[0] || "User"

          await supabase.from("user_profiles").insert({
            id: supabaseUser.id,
            username,
            email: supabaseUser.email || "",
            is_admin: false,
            is_vip: false,
            is_vip_plus: false,
            is_uploader: false,
          })

          const newUser = {
            id: supabaseUser.id,
            username,
            email: supabaseUser.email || "",
            isVip: false,
            isVipPlus: false,
            isAdmin: false,
            isUploader: false,
          }
          setUser(newUser)
          lastLoadedUserId.current = supabaseUser.id
        }
        setLoading(false)
        isLoadingProfile.current = false
        return
      }

      const now = new Date()
      let isVip = Boolean(profile.is_vip)

      if (isVip && profile.vip_expires_at) {
        const expiryDate = new Date(profile.vip_expires_at)
        if (expiryDate < now) {
          await supabase.from("user_profiles").update({ is_vip: false, is_vip_plus: false }).eq("id", supabaseUser.id)
          isVip = false
        }
      }

      const userData: User = {
        id: supabaseUser.id,
        username: profile.username || "User",
        email: supabaseUser.email || "",
        isVip,
        isVipPlus: Boolean(profile.is_vip_plus),
        isAdmin: Boolean(profile.is_admin),
        isUploader: Boolean(profile.is_uploader),
        vipExpiresAt: profile.vip_expires_at,
        showAdultContent: Boolean(profile.show_adult_content),
      }

      console.log("[v0] User loaded:", userData.username, "Admin:", userData.isAdmin, "Uploader:", userData.isUploader)
      setUser(userData)
      lastLoadedUserId.current = supabaseUser.id
      updateAdultContentPreference(userData.showAdultContent || false)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Load profile exception:", error)

      if (retryCount < 3) {
        console.log(`[v0] Retrying after exception (${retryCount + 1}/3)...`)
        isLoadingProfile.current = false
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
        return loadUserProfile(supabaseUser, retryCount + 1)
      }

      setLoading(false)
    } finally {
      isLoadingProfile.current = false
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[v0] Auth state:", _event)
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setUser(null)
        lastLoadedUserId.current = null
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshUser = async () => {
    lastLoadedUserId.current = null
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      await loadUserProfile(session.user)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur WaveWatch!",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: { username },
        },
      })

      if (error) throw error

      if (data.user) {
        try {
          const { error: profileError } = await supabase.from("user_profiles").insert({
            user_id: data.user.id,
            username: username.trim(),
            email: email.trim(),
            is_admin: false,
            is_vip: false,
            is_vip_plus: false,
            is_uploader: false,
            status: "active",
            join_date: new Date().toISOString().split("T")[0],
          })

          if (profileError && profileError.code !== "23505") {
            console.error("[v0] Profile creation error:", profileError)
          }
        } catch (profileErr) {
          console.error("[v0] Profile creation exception:", profileErr)
        }

        toast({
          title: "Compte créé !",
          description: `Bienvenue ${username} !`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    updateAdultContentPreference(false)
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt!",
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
