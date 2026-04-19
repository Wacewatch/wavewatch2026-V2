"use client"

import { Settings, X, Zap, Gauge, Sparkles } from "lucide-react"

interface SettingsModalProps {
  controlMode: "auto" | "pc" | "mobile"
  setControlMode: (mode: "auto" | "pc" | "mobile") => void
  graphicsQuality: string
  setGraphicsQuality: (quality: string) => void
  povMode: boolean
  togglePovMode: () => void
  showBadgesPreference: boolean
  setShowBadgesPreference: (value: boolean) => void
  showCollisionDebug: boolean
  setShowCollisionDebug: (value: boolean) => void
  onClose: () => void
}

const qualityOptions = [
  {
    value: "low",
    label: "Basse",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    description: "Performances max, sans ombres ni brouillard",
  },
  {
    value: "medium",
    label: "Moyenne",
    icon: Gauge,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
    description: "Equilibre, sans ombres mais avec effets",
  },
  {
    value: "high",
    label: "Haute",
    icon: Sparkles,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
    description: "Qualite max avec ombres et tous les effets",
  },
]

export function SettingsModal({
  controlMode,
  setControlMode,
  graphicsQuality,
  setGraphicsQuality,
  povMode,
  togglePovMode,
  showBadgesPreference,
  setShowBadgesPreference,
  showCollisionDebug,
  setShowCollisionDebug,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full border-2 border-blue-500/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Paramètres
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white font-medium block mb-2">Mode de Contrôle</label>
            <select
              value={controlMode}
              onChange={(e) => setControlMode(e.target.value as "auto" | "pc" | "mobile")}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
            >
              <option value="auto">Automatique</option>
              <option value="pc">PC (Clavier)</option>
              <option value="mobile">Mobile (Joystick)</option>
            </select>
          </div>

          <div>
            <label className="text-white font-medium block mb-3">Qualite Graphique</label>
            <div className="space-y-2">
              {qualityOptions.map((option) => {
                const Icon = option.icon
                const isSelected = graphicsQuality === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setGraphicsQuality(option.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${option.bgColor} ${option.borderColor}`
                        : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? option.bgColor : "bg-gray-600"}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? option.color : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${isSelected ? option.color : "text-white"}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className={`w-3 h-3 rounded-full ${option.color.replace("text-", "bg-")}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Mode POV</label>
            <button
              onClick={togglePovMode}
              className={`w-12 h-6 rounded-full transition-colors ${povMode ? "bg-blue-500" : "bg-gray-600"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  povMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Afficher les badges des statuts</label>
            <button
              onClick={() => {
                const newValue = !showBadgesPreference
                setShowBadgesPreference(newValue)
                localStorage.setItem('interactive_show_badges', String(newValue))
              }}
              className={`w-12 h-6 rounded-full transition-colors ${showBadgesPreference ? "bg-blue-500" : "bg-gray-600"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  showBadgesPreference ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Debug Collisions - uniquement en développement local */}
          {process.env.NODE_ENV === "development" && (
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Debug Collisions</label>
              <button
                onClick={() => setShowCollisionDebug(!showCollisionDebug)}
                className={`w-12 h-6 rounded-full transition-colors ${showCollisionDebug ? "bg-red-500" : "bg-gray-600"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    showCollisionDebug ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium mt-6"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
