"use client"

import { useEffect, useState } from "react"
import type { LoadingStep } from "../hooks/useWorldPreloader"

interface WorldLoadingScreenProps {
  progress: number
  currentStep: LoadingStep | null
  completedSteps: string[]
  onSkip?: () => void
}

// Animated particles for the background
function LoadingParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

// 3D-like cube animation
function AnimatedCube() {
  return (
    <div className="relative w-24 h-24 perspective-500">
      <div className="relative w-full h-full animate-spin-slow preserve-3d">
        {/* Front face */}
        <div className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/20 backface-hidden transform-style-3d" />
        {/* Back face */}
        <div className="absolute w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 border border-white/20 backface-hidden rotate-y-180" />
        {/* Right face */}
        <div className="absolute w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 border border-white/20 backface-hidden rotate-y-90 translate-z-12" />
        {/* Left face */}
        <div className="absolute w-full h-full bg-gradient-to-br from-pink-500 to-red-500 border border-white/20 backface-hidden -rotate-y-90 translate-z-12" />
      </div>
    </div>
  )
}

// Simplified 3D world icon
function WorldIcon() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse" />

      {/* Globe with orbiting rings */}
      <div className="relative">
        {/* Main sphere */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 shadow-2xl relative overflow-hidden">
          {/* Continents effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/40 via-transparent to-green-400/30 animate-spin-very-slow" />
          {/* Atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20" />
          {/* Highlight */}
          <div className="absolute top-2 left-3 w-4 h-4 bg-white/40 rounded-full blur-sm" />
        </div>

        {/* Orbiting ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-28 h-8 border-2 border-cyan-400/50 rounded-full animate-orbit" style={{ transform: 'rotateX(70deg)' }} />
        </div>

        {/* Second orbiting ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-10 border border-purple-400/30 rounded-full animate-orbit-reverse" style={{ transform: 'rotateX(70deg) rotateZ(45deg)' }} />
        </div>
      </div>
    </div>
  )
}

export default function WorldLoadingScreen({
  progress,
  currentStep,
  completedSteps,
  onSkip,
}: WorldLoadingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [showTip, setShowTip] = useState(0)

  // Tips to show during loading
  const tips = [
    "Utilisez ZQSD ou les touches flechees pour vous deplacer",
    "Appuyez sur F pour interagir avec les batiments",
    "Maintenez Shift pour courir plus vite",
    "Appuyez sur Espace pour sauter",
    "Ouvrez le menu pour personnaliser votre avatar",
  ]

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        const diff = progress - prev
        if (Math.abs(diff) < 0.5) return progress
        return prev + diff * 0.1
      })
    }, 16)
    return () => clearInterval(interval)
  }, [progress])

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTip((prev) => (prev + 1) % tips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tips.length])

  return (
    <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <LoadingParticles />

      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-lg w-full">
        {/* Logo / Icon */}
        <WorldIcon />

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            WaveWatch World
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Preparation de votre experience interactive
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          {/* Progress container */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            {/* Animated gradient background */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-300 ease-out"
              style={{
                width: `${displayProgress}%`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
            {/* Glow effect on progress bar */}
            <div
              className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"
              style={{
                left: `${displayProgress}%`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>

          {/* Progress percentage and step */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-white/80 text-sm font-medium">
              {Math.round(displayProgress)}%
            </span>
            {currentStep && (
              <span className="text-white/60 text-sm flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                {currentStep.label}
              </span>
            )}
          </div>
        </div>

        {/* Loading steps indicator */}
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < completedSteps.length
                  ? 'bg-cyan-400 scale-100'
                  : i === completedSteps.length
                  ? 'bg-white/80 animate-pulse scale-110'
                  : 'bg-white/20 scale-100'
              }`}
            />
          ))}
        </div>

        {/* Tip carousel */}
        <div className="text-center min-h-[48px] flex items-center justify-center">
          <p
            key={showTip}
            className="text-white/50 text-sm animate-fade-in"
          >
            {tips[showTip]}
          </p>
        </div>
      </div>

      {/* Skip button (optional, shown after a delay) */}
      {onSkip && progress > 50 && (
        <button
          onClick={onSkip}
          className="absolute bottom-8 right-8 text-white/40 hover:text-white/80 text-sm transition-colors"
        >
          Passer
        </button>
      )}

      {/* Custom styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes orbit {
          0% { transform: rotateX(70deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateZ(360deg); }
        }

        @keyframes orbit-reverse {
          0% { transform: rotateX(70deg) rotateZ(45deg); }
          100% { transform: rotateX(70deg) rotateZ(-315deg); }
        }

        @keyframes spin-very-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-orbit {
          animation: orbit 8s linear infinite;
        }

        .animate-orbit-reverse {
          animation: orbit-reverse 12s linear infinite;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 20s linear infinite;
        }

        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }

        .perspective-500 {
          perspective: 500px;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}
