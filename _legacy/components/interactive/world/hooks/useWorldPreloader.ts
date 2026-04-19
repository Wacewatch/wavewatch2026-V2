"use client"

import { useState, useEffect, useCallback } from "react"

export interface LoadingStep {
  id: string
  label: string
  weight: number // Relative weight for progress calculation
}

const LOADING_STEPS: LoadingStep[] = [
  { id: "threejs", label: "Initialisation du moteur 3D", weight: 20 },
  { id: "environment", label: "Chargement de l'environnement", weight: 15 },
  { id: "buildings", label: "Construction des bâtiments", weight: 20 },
  { id: "decorations", label: "Placement des décorations", weight: 15 },
  { id: "avatar", label: "Préparation de votre avatar", weight: 10 },
  { id: "network", label: "Connexion au monde", weight: 10 },
  { id: "finalizing", label: "Finalisation", weight: 10 },
]

interface UseWorldPreloaderProps {
  enabled?: boolean
  minLoadingTime?: number // Minimum time to show loading screen (ms)
}

interface UseWorldPreloaderReturn {
  isLoading: boolean
  progress: number
  currentStep: LoadingStep | null
  completedSteps: string[]
  completeStep: (stepId: string) => void
  forceComplete: () => void
}

export function useWorldPreloader({
  enabled = true,
  minLoadingTime = 2000,
}: UseWorldPreloaderProps = {}): UseWorldPreloaderReturn {
  const [isLoading, setIsLoading] = useState(enabled)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [startTime] = useState(Date.now())

  // Calculate progress based on completed steps
  const progress = LOADING_STEPS.reduce((acc, step) => {
    if (completedSteps.includes(step.id)) {
      return acc + step.weight
    }
    return acc
  }, 0)

  // Get current step (first uncompleted step)
  const currentStep = LOADING_STEPS.find((step) => !completedSteps.includes(step.id)) || null

  // Complete a specific step
  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev
      return [...prev, stepId]
    })
  }, [])

  // Force complete all steps
  const forceComplete = useCallback(() => {
    setCompletedSteps(LOADING_STEPS.map((s) => s.id))
  }, [])

  // Auto-complete steps with delays to simulate loading
  // This ensures a smooth experience even on fast connections
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const delays = [300, 600, 1000, 1400, 1700, 1900, 2100]
    const timers: NodeJS.Timeout[] = []

    LOADING_STEPS.forEach((step, index) => {
      const timer = setTimeout(() => {
        completeStep(step.id)
      }, delays[index] || delays[delays.length - 1] + (index - delays.length + 1) * 200)
      timers.push(timer)
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [enabled, completeStep])

  // Check if all steps are completed
  useEffect(() => {
    if (completedSteps.length === LOADING_STEPS.length) {
      // Ensure minimum loading time for smooth experience
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minLoadingTime - elapsed)

      const timer = setTimeout(() => {
        setIsLoading(false)
      }, remaining)

      return () => clearTimeout(timer)
    }
  }, [completedSteps, startTime, minLoadingTime])

  return {
    isLoading,
    progress,
    currentStep,
    completedSteps,
    completeStep,
    forceComplete,
  }
}

// Re-export loading steps for external use
export { LOADING_STEPS }
