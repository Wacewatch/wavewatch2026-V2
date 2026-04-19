"use client"

import { Music, Gamepad2, Trophy, Film, type LucideIcon } from "lucide-react"

type ClosedModalType = "disco" | "arcade" | "stadium" | "cinema"

interface ClosedModalConfig {
  icon: LucideIcon
  title: string
  message: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  iconColor: string
  titleColor: string
  buttonBg: string
  buttonHover: string
}

const modalConfigs: Record<ClosedModalType, ClosedModalConfig> = {
  disco: {
    icon: Music,
    title: "Discothèque Fermée",
    message: "La discothèque est actuellement fermée. Revenez plus tard !",
    gradientFrom: "from-purple-900",
    gradientTo: "to-gray-900",
    borderColor: "border-purple-500/50",
    iconColor: "text-purple-400",
    titleColor: "text-purple-300",
    buttonBg: "bg-purple-600",
    buttonHover: "hover:bg-purple-700",
  },
  arcade: {
    icon: Gamepad2,
    title: "Arcade Fermée",
    message: "L'arcade est actuellement fermée. Revenez plus tard !",
    gradientFrom: "from-cyan-900",
    gradientTo: "to-gray-900",
    borderColor: "border-cyan-500/50",
    iconColor: "text-cyan-400",
    titleColor: "text-cyan-300",
    buttonBg: "bg-cyan-600",
    buttonHover: "hover:bg-cyan-700",
  },
  stadium: {
    icon: Trophy,
    title: "Stade Fermé",
    message: "Le stade est actuellement fermé. Revenez plus tard !",
    gradientFrom: "from-green-900",
    gradientTo: "to-gray-900",
    borderColor: "border-green-500/50",
    iconColor: "text-green-400",
    titleColor: "text-green-300",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
  },
  cinema: {
    icon: Film,
    title: "Cinéma Fermé",
    message: "Cette salle de cinéma est actuellement fermée. Revenez plus tard !",
    gradientFrom: "from-red-900",
    gradientTo: "to-gray-900",
    borderColor: "border-red-500/50",
    iconColor: "text-red-400",
    titleColor: "text-red-300",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
  },
}

interface ClosedModalProps {
  type: ClosedModalType
  onClose: () => void
}

export function ClosedModal({ type, onClose }: ClosedModalProps) {
  const config = modalConfigs[type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} text-white p-8 rounded-2xl max-w-md text-center border-2 ${config.borderColor} shadow-2xl`}>
        <div className="mb-4">
          <Icon className={`w-16 h-16 mx-auto ${config.iconColor} opacity-50`} />
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${config.titleColor}`}>{config.title}</h2>
        <p className="mb-6 text-gray-300">{config.message}</p>
        <button
          onClick={onClose}
          className={`px-6 py-3 ${config.buttonBg} ${config.buttonHover} rounded-lg font-semibold transition-colors`}
        >
          Compris
        </button>
      </div>
    </div>
  )
}
