"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tv, Loader2, CheckCircle } from "lucide-react"

interface AdGateModalProps {
  onAdComplete: () => void
  onBack: () => void
}

// Zone ID Monetag
const MONETAG_ZONE_ID = "10266724"

// Activer les pubs uniquement en production
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export function AdGateModal({ onAdComplete, onBack }: AdGateModalProps) {
  // Initialiser depuis localStorage pour survivre aux re-renders
  const [adClicked, setAdClicked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wavewatch_ad_clicked') === 'true'
    }
    return false
  })
  const [countdown, setCountdown] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wavewatch_ad_countdown')
      return saved ? parseInt(saved, 10) : 5
    }
    return 5
  })
  const [canProceed, setCanProceed] = useState(false)

  // Injecter le script Monetag au montage du composant
  useEffect(() => {
    // Vérifier si le script n'est pas déjà chargé
    if (!document.getElementById('monetag-script')) {
      const script = document.createElement('script')
      script.id = 'monetag-script'
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = `//otieu.com/4/${MONETAG_ZONE_ID}`
      document.body.appendChild(script)
    }
  }, [])

  // Countdown après le clic sur la pub
  useEffect(() => {
    if (adClicked && countdown > 0) {
      // Sauvegarder le countdown dans localStorage
      localStorage.setItem('wavewatch_ad_countdown', countdown.toString())
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (adClicked && countdown === 0) {
      setCanProceed(true)
      // Nettoyer le localStorage temporaire
      localStorage.removeItem('wavewatch_ad_clicked')
      localStorage.removeItem('wavewatch_ad_countdown')
    }
  }, [adClicked, countdown])

  const handleAdClick = () => {
    console.log('[AdGate] handleAdClick called')

    // Ouvrir la pub dans un nouvel onglet
    const adWindow = window.open(`https://otieu.com/4/${MONETAG_ZONE_ID}`, '_blank')

    // Si le popup a été bloqué, informer l'utilisateur mais continuer quand même
    if (!adWindow || adWindow.closed || typeof adWindow.closed === 'undefined') {
      console.log('[AdGate] Popup may have been blocked, but proceeding anyway')
    }

    // Marquer comme cliqué APRÈS l'ouverture de la popup
    // Sauvegarder dans localStorage pour survivre aux re-renders
    localStorage.setItem('wavewatch_ad_clicked', 'true')
    console.log('[AdGate] Setting adClicked to true')
    setAdClicked(true)
  }

  const handleProceed = () => {
    // Sauvegarder que l'utilisateur a vu la pub (valide 24h)
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000 // 24 heures
    localStorage.setItem('wavewatch_ad_viewed', JSON.stringify({ expires: expiryTime }))
    onAdComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500/50 rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-500/20 p-4 rounded-full">
            <Tv className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Accès au Monde 3D</h2>
            <p className="text-gray-400 text-sm">Sponsorisé par nos partenaires</p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
          <p className="text-gray-300 leading-relaxed mb-4">
            Pour accéder gratuitement au <span className="text-blue-400 font-semibold">Monde Interactif WaveWatch</span>,
            merci de cliquer sur le bouton ci-dessous.
          </p>
          <p className="text-gray-400 text-sm">
            Cela nous aide à maintenir le service gratuit pour tous ! 🙏
          </p>
        </div>

        {/* État du processus */}
        {!adClicked ? (
          // Bouton pour déclencher la pub
          <Button
            onClick={handleAdClick}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
          >
            <Tv className="w-5 h-5 mr-2" />
            Cliquer pour continuer
          </Button>
        ) : !canProceed ? (
          // Countdown après le clic
          <div className="text-center">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-400 font-semibold mb-2">Merci !</p>
              <p className="text-gray-300 text-sm">Vous pourrez entrer dans {countdown} secondes...</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Préparation du monde 3D...</span>
            </div>
          </div>
        ) : (
          // Bouton pour entrer après le countdown
          <Button
            onClick={handleProceed}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Entrer dans le Monde 3D
          </Button>
        )}

        {/* Bouton retour */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full mt-4 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  )
}

// Fonction utilitaire pour vérifier si la pub a déjà été vue récemment
export function hasRecentAdView(): boolean {
  // En développement, toujours skip les pubs
  if (process.env.NODE_ENV !== 'production') return true

  // En production, toujours afficher la pub (à chaque visite)
  return false
}
