"use client"

import { X, Send } from "lucide-react"

interface Message {
  id?: string
  username?: string
  message: string
  created_at?: string
}

interface ChatModalProps {
  currentCinemaRoom: { id: string; room_number: number } | null
  messages: Message[]
  roomMessages: Message[]
  chatInput: string
  setChatInput: (value: string) => void
  sendMessage: () => void
  onClose: () => void
}

export function ChatModal({
  currentCinemaRoom,
  messages,
  roomMessages,
  chatInput,
  setChatInput,
  sendMessage,
  onClose,
}: ChatModalProps) {
  const displayMessages = currentCinemaRoom ? roomMessages : messages

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-xl rounded-xl w-full max-w-md h-[600px] flex flex-col border-2 border-white/30 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/20">
          <h3 className="text-white font-bold text-lg">
            {currentCinemaRoom ? `Chat - Salle ${currentCinemaRoom.room_number}` : "Chat Global"}
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {displayMessages.map((msg, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-400 font-semibold text-sm">{msg.username || "Anonyme"}</div>
              <div className="text-white text-sm mt-1">{msg.message}</div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput.trim()) {
                  sendMessage()
                }
              }}
              placeholder="Votre message..."
              className="flex-1 bg-white/10 text-white px-4 py-3 rounded-lg outline-none placeholder-white/40"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim()}
              className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
