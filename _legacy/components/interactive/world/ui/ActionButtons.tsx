"use client"

import { Maximize2, Eye, EyeOff, MessageCircle, Smile } from "lucide-react"

interface ActionButtonsProps {
  isMobileMode: boolean
  povMode: boolean
  showQuickActions: boolean
  enableChat: boolean
  enableEmojis: boolean
  onFullscreen: () => void
  onTogglePov: () => void
  onOpenChat: () => void
  onToggleQuickActions: () => void
}

export function ActionButtons({
  isMobileMode,
  povMode,
  showQuickActions,
  enableChat,
  enableEmojis,
  onFullscreen,
  onTogglePov,
  onOpenChat,
  onToggleQuickActions,
}: ActionButtonsProps) {
  if (isMobileMode) {
    return (
      <div className="fixed top-4 right-4 z-20 flex flex-col gap-2">
        {/* Bouton Plein écran */}
        <button
          onClick={onFullscreen}
          className="bg-gray-600 hover:bg-gray-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
          title="Mode Immersif"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Bouton changement de vue POV */}
        <button
          onClick={onTogglePov}
          className="bg-purple-600 hover:bg-purple-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
          title={povMode ? "Vue troisième personne" : "Vue première personne"}
        >
          {povMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Bouton Messages */}
        {enableChat && (
          <button
            onClick={onOpenChat}
            className="bg-green-600 hover:bg-green-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}

        {/* Bouton Emojis */}
        {enableEmojis && (
          <button
            onClick={onToggleQuickActions}
            className="bg-orange-500 hover:bg-orange-600 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-2 border-white/20"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Bouton Messages - à gauche du bouton emojis */}
      {enableChat && (
        <button
          onClick={onOpenChat}
          className="fixed bottom-6 right-20 bg-green-600 hover:bg-green-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center z-20 transition-all hover:scale-105 border-2 border-white/20"
          title="Messages"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Bouton changement de vue POV - au dessus du bouton emojis */}
      <button
        onClick={onTogglePov}
        className="fixed bottom-20 right-6 bg-purple-600 hover:bg-purple-700 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center z-20 transition-all hover:scale-105 border-2 border-white/20"
        title={povMode ? "Vue troisième personne" : "Vue première personne"}
      >
        {povMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>

      {/* Bouton Emojis */}
      {enableEmojis && (
        <button
          onClick={onToggleQuickActions}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white w-11 h-11 rounded-lg shadow-2xl flex items-center justify-center z-20 transition-all hover:scale-105 border-2 border-white/20"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
