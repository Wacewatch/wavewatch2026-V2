"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  username: string
  email: string
  isVip: boolean
  isAdmin: boolean
  vipExpiresAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    const initAuth = async () => {
      try {
        // Vérifier la session actuelle
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        } else if (session?.user && isMounted) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("Auth state change:", event, !!session)

      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        await loadUserProfile(session.user)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [mounted])

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Vérifier si la table user_profiles existe et a des données
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error)
        // Créer un profil par défaut si la table existe mais pas le profil
        await createDefaultProfile(supabaseUser)
        return
      }

      const userData: User = {
        id: supabaseUser.id,
        username:
          profile?.username || supabaseUser.user_metadata?.username || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        isVip: profile?.is_vip || false,
        isAdmin: profile?.is_admin || false,
        vipExpiresAt: profile?.vip_expires_at,
      }

      setUser(userData)
    } catch (error) {
      console.error("Error loading user profile:", error)
      // Fallback: créer un utilisateur basique
      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        isVip: false,
        isAdmin: false,
      })
    }
  }

  const createDefaultProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split("@")[0] || "User"

      const { error } = await supabase.from("user_profiles").insert({
        id: supabaseUser.id,
        username: username,
        email: supabaseUser.email,
        is_vip: false,
        is_admin: username.toLowerCase() === "wwadmin",
      })

      if (error) {
        console.error("Error creating default profile:", error)
      }
    } catch (error) {
      console.error("Error in createDefaultProfile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur WaveWatch!",
      })
    } catch (error: any) {
      console.error("Sign in error:", error)
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

      // Validation des données
      if (!username || username.length < 2) {
        throw new Error("Le nom d'utilisateur doit contenir au moins 2 caractères")
      }
      if (!email || !email.includes("@")) {
        throw new Error("Format d'email invalide")
      }
      if (!password || password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères")
      }

      // Créer le compte Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      })

      if (error) throw error

      if (data.user && !data.session) {
        toast({
          title: "Vérification requise",
          description: "Vérifiez votre email pour confirmer votre compte avant de vous connecter.",
        })
        return
      }

      toast({
        title: "Compte créé avec succès !",
        description: `Bienvenue ${username} sur WaveWatch !`,
      })
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de la création du compte",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt!",
      })
    } catch (error: any) {
      console.error("Signout error:", error)
      // Forcer la déconnexion même en cas d'erreur
      setUser(null)
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté",
      })
    }
  }

  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          loading: true,
          signIn: async () => {},
          signUp: async () => {},
          signOut: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
