"use client"

import { ArrowUp, Music } from "lucide-react"

interface QuickActionsPanelProps {
  isMobileMode: boolean
  enableJumping: boolean
  onJump: () => void
  onEmoji: (emoji: string) => void
  onDance?: () => void
  isDancing?: boolean
}

const EMOJIS = ["😂", "👍", "❤️", "😭", "🔥", "🎉", "😎", "🤔", "😱", "💪", "🙏", "✨"]

export function QuickActionsPanel({ isMobileMode, enableJumping, onJump, onEmoji, onDance, isDancing }: QuickActionsPanelProps) {
  if (isMobileMode) {
    return (
      <div className="fixed top-[220px] right-4 z-20 bg-black/90 backdrop-blur-lg p-2 rounded-xl border-2 border-white/20 max-h-[50vh] overflow-y-auto w-[140px]">
        <div className="grid grid-cols-3 gap-1">
          {enableJumping && (
            <button
              onClick={onJump}
              className="bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
          {onDance && (
            <button
              onClick={onDance}
              className={`p-2 rounded-lg shadow-lg transition-colors flex items-center justify-center ${
                isDancing
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              <Music className="w-5 h-5" />
            </button>
          )}
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmoji(emoji)}
              className="text-2xl p-1 rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-28 right-6 z-20 bg-black/90 backdrop-blur-lg p-4 rounded-2xl border-2 border-white/20 max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col gap-3">
        {enableJumping && (
          <button
            onClick={onJump}
            className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}
        {onDance && (
          <button
            onClick={onDance}
            className={`p-4 rounded-full shadow-lg transition-colors flex items-center justify-center ${
              isDancing
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
            title="Danser"
          >
            <Music className="w-6 h-6" />
          </button>
        )}
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmoji(emoji)}
            className="text-4xl p-2 rounded-full hover:bg-white/10 transition-colors text-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
