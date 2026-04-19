"use client"

import { Send, X } from "lucide-react"

interface ChatInputProps {
  chatInput: string
  setChatInput: (value: string) => void
  sendMessage: () => void
  onClose: () => void
  isMobileMode: boolean
}

export function ChatInput({
  chatInput,
  setChatInput,
  sendMessage,
  onClose,
  isMobileMode,
}: ChatInputProps) {
  const handleSend = () => {
    sendMessage()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  if (isMobileMode) {
    // Mode mobile: input en bas de l'écran, style WhatsApp/Discord
    return (
      <div className="fixed bottom-44 left-4 right-4 z-30 bg-black/90 backdrop-blur-lg rounded-2xl p-3 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl outline-none text-sm"
            autoFocus
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white p-3 rounded-xl hover:bg-gray-700 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Mode desktop: panneau à droite
  return (
    <div className="absolute top-20 right-4 w-80 bg-black/80 backdrop-blur-lg rounded-lg z-10 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-sm">Envoyer un message</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg outline-none text-sm"
          autoFocus
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
