"use client"

import { useState } from "react"
import { Settings, User, Users, Palette, MessageSquare, Map, LogOut, Loader2, Trophy } from "lucide-react"

interface MenuDropdownProps {
  isMobileMode: boolean
  myProfile: { username?: string } | null
  onlineCount: number
  enableChat: boolean
  onOpenSettings: () => void
  onOpenAvatar: () => void
  onOpenChat: () => void
  onOpenMap: () => void
  onOpenQuests: () => void // Added onOpenQuests prop
  onQuit: () => void | Promise<void>
}

export function MenuDropdown({
  isMobileMode,
  myProfile,
  onlineCount,
  enableChat,
  onOpenSettings,
  onOpenAvatar,
  onOpenChat,
  onOpenMap,
  onOpenQuests, // Added onOpenQuests
  onQuit,
}: MenuDropdownProps) {
  const [isQuitting, setIsQuitting] = useState(false)

  const handleQuit = async () => {
    if (isQuitting) return // Prevent double-click
    setIsQuitting(true)
    try {
      await onQuit()
    } catch (err) {
      console.error("Error during quit:", err)
      setIsQuitting(false)
    }
  }
  return (
    <div
      className={`absolute top-0 mt-0 bg-black/95 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-white/30 ${isMobileMode ? "left-12 p-2 w-48 space-y-1" : "left-20 p-4 w-80 space-y-3"}`}
    >
      <div className={`text-white border-b border-white/20 ${isMobileMode ? "mb-2 pb-2" : "mb-3 pb-3"}`}>
        <div className={`font-bold flex items-center gap-2 ${isMobileMode ? "text-sm" : "text-lg"}`}>
          <User className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
          {myProfile?.username || "Vous"}
        </div>
        <div className={`flex items-center gap-2 text-white/60 mt-1 ${isMobileMode ? "text-xs" : "text-sm"}`}>
          <Users className={isMobileMode ? "w-3 h-3" : "w-4 h-4"} />
          <span>{onlineCount} en ligne</span>
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        className={`w-full bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-medium transition-colors ${isMobileMode ? "py-2 text-xs" : "py-3 text-base"}`}
      >
        <Settings className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
        Paramètres
      </button>

      <button
        onClick={onOpenAvatar}
        className={`w-full bg-purple-500/90 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 font-medium transition-colors ${isMobileMode ? "py-2 text-xs" : "py-3 text-base"}`}
      >
        <Palette className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
        Avatar
      </button>

      <button
        onClick={onOpenQuests}
        className={`w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 flex items-center justify-center gap-2 font-medium transition-colors ${isMobileMode ? "py-2 text-xs" : "py-3 text-base"}`}
      >
        <Trophy className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
        Quêtes
      </button>

      {enableChat && (
        <button
          onClick={onOpenChat}
          className={`w-full bg-green-500/90 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-medium transition-colors ${isMobileMode ? "py-2 text-xs" : "py-3 text-base"}`}
        >
          <MessageSquare className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
          Chat
        </button>
      )}

      <button
        onClick={onOpenMap}
        className={`w-full bg-cyan-500/90 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center gap-2 font-medium transition-colors ${isMobileMode ? "py-2 text-xs" : "py-3 text-base"}`}
      >
        <Map className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
        Carte
      </button>

      <button
        onClick={handleQuit}
        disabled={isQuitting}
        className={`w-full bg-gray-600/90 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center font-medium transition-colors border-t border-white/20 mt-2 pt-2 disabled:opacity-50 disabled:cursor-wait ${isMobileMode ? "py-2" : "py-3"}`}
        title="Quitter"
      >
        {isQuitting ? (
          <Loader2 className={`animate-spin ${isMobileMode ? "w-4 h-4" : "w-5 h-5"}`} />
        ) : (
          <LogOut className={isMobileMode ? "w-4 h-4" : "w-5 h-5"} />
        )}
      </button>
    </div>
  )
}
