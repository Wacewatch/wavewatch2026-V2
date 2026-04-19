"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

interface UserPreferences {
  showAdultContent: boolean // false by default - if false, hide adult content
  hideWatchedContent: boolean // false by default - if true, hide watched content
  autoMarkWatched: boolean // true by default - if true, auto-mark as watched on play
  hideSpoilers: boolean // false by default - if true, blur episode images and synopses
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showAdultContent: false, // Disabled by default
  hideWatchedContent: false, // Disabled by default
  autoMarkWatched: true, // Enabled by default
  hideSpoilers: false, // Disabled by default
}

export function useUserPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(false)
  const supabase = createClient()

  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setPreferences(DEFAULT_PREFERENCES)
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Loading preferences for user:", user.id)

      // Query by user_id column (the foreign key to auth.users)
      const { data, error } = await supabase
        .from("user_profiles")
        .select("hide_adult_content, auto_mark_watched, hide_spoilers")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error loading preferences:", error.message)
        setPreferences(DEFAULT_PREFERENCES)
        setLoading(false)
        return
      }

      if (data) {
        const loadedPrefs: UserPreferences = {
          showAdultContent: data.hide_adult_content === false, // Inverse logic
          hideWatchedContent: false, // Will be stored in localStorage for now
          autoMarkWatched: data.auto_mark_watched ?? true, // Default true
          hideSpoilers: data.hide_spoilers ?? false,
        }

        // Load hideWatchedContent from localStorage
        if (typeof window !== "undefined") {
          const storedHideWatched = localStorage.getItem("wavewatch_hide_watched")
          if (storedHideWatched !== null) {
            loadedPrefs.hideWatchedContent = storedHideWatched === "true"
          }
        }

        console.log("[v0] Loaded preferences:", loadedPrefs)
        setPreferences(loadedPrefs)

        // Update localStorage for other components
        if (typeof window !== "undefined") {
          localStorage.setItem("wavewatch_adult_content", loadedPrefs.showAdultContent.toString())
          localStorage.setItem("wavewatch_hide_spoilers", loadedPrefs.hideSpoilers.toString())
          localStorage.setItem("wavewatch_auto_mark_watched", loadedPrefs.autoMarkWatched.toString())
        }
      } else {
        console.log("[v0] No preferences found, using defaults")
        setPreferences(DEFAULT_PREFERENCES)

        if (typeof window !== "undefined") {
          localStorage.setItem("wavewatch_adult_content", "false")
          localStorage.setItem("wavewatch_hide_spoilers", "false")
          localStorage.setItem("wavewatch_auto_mark_watched", "true")
          localStorage.setItem("wavewatch_hide_watched", "false")
        }
      }
    } catch (error: any) {
      console.error("[v0] Error loading preferences:", error.message)
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Event listeners for cross-component communication
  useEffect(() => {
    const handleGetPreferences = () => {
      window.dispatchEvent(new CustomEvent("user-preferences-response", { detail: preferences }))
    }

    window.addEventListener("get-user-preferences", handleGetPreferences)
    return () => window.removeEventListener("get-user-preferences", handleGetPreferences)
  }, [preferences])

  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
    if (!user?.id) {
      console.error("[v0] No user ID available for updating preferences")
      return false
    }

    const previousPreferences = { ...preferences }
    const updatedPreferences = { ...preferences, ...newPreferences }

    // Optimistically update local state
    setPreferences(updatedPreferences)

    // Update localStorage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem("wavewatch_adult_content", updatedPreferences.showAdultContent.toString())
      localStorage.setItem("wavewatch_hide_spoilers", updatedPreferences.hideSpoilers.toString())
      localStorage.setItem("wavewatch_auto_mark_watched", updatedPreferences.autoMarkWatched.toString())
      localStorage.setItem("wavewatch_hide_watched", updatedPreferences.hideWatchedContent.toString())
    }

    try {
      console.log("[v0] Updating preferences for user:", user.id, updatedPreferences)

      // Update database - query by user_id
      const { error } = await supabase
        .from("user_profiles")
        .update({
          hide_adult_content: !updatedPreferences.showAdultContent, // Inverse logic
          auto_mark_watched: updatedPreferences.autoMarkWatched,
          hide_spoilers: updatedPreferences.hideSpoilers,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error updating preferences:", error.message)
        // Revert on failure
        setPreferences(previousPreferences)
        if (typeof window !== "undefined") {
          localStorage.setItem("wavewatch_adult_content", previousPreferences.showAdultContent.toString())
          localStorage.setItem("wavewatch_hide_spoilers", previousPreferences.hideSpoilers.toString())
          localStorage.setItem("wavewatch_auto_mark_watched", previousPreferences.autoMarkWatched.toString())
          localStorage.setItem("wavewatch_hide_watched", previousPreferences.hideWatchedContent.toString())
        }
        return false
      }

      console.log("[v0] Preferences updated successfully")

      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent("preferences-updated", { detail: updatedPreferences }))

      return true
    } catch (error: any) {
      console.error("[v0] Error updating preferences:", error.message)
      // Revert on failure
      setPreferences(previousPreferences)
      if (typeof window !== "undefined") {
        localStorage.setItem("wavewatch_adult_content", previousPreferences.showAdultContent.toString())
        localStorage.setItem("wavewatch_hide_spoilers", previousPreferences.hideSpoilers.toString())
        localStorage.setItem("wavewatch_auto_mark_watched", previousPreferences.autoMarkWatched.toString())
        localStorage.setItem("wavewatch_hide_watched", previousPreferences.hideWatchedContent.toString())
      }
      return false
    }
  }

  return {
    preferences,
    updatePreferences,
    loading,
    preferencesLoading,
    setPreferencesLoading,
  }
}
