"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, MessageSquare, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeedbackStats {
  content: number
  functionality: number
  design: number
  totalFeedback: number
}

interface GuestbookMessage {
  message: string
  username: string
  created_at: string
}

export function Footer() {
  const [stats, setStats] = useState<FeedbackStats>({
    content: 0,
    functionality: 0,
    design: 0,
    totalFeedback: 0,
  })
  const [messages, setMessages] = useState<GuestbookMessage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    fetchFeedbackStats()
  }, [])

  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setFadeIn(false)
        setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
          setFadeIn(true)
        }, 300)
      }, 6000)

      return () => clearInterval(interval)
    }
  }, [messages])

  const fetchFeedbackStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/feedback/stats")

      if (!response.ok) {
        console.error("[v0] Error loading feedback stats:", response.status)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.guestbookMessages && data.guestbookMessages.length > 0) {
        setMessages(data.guestbookMessages)
        console.log("[v0] Loaded guestbook messages:", data.guestbookMessages.length)
      }
    } catch (error) {
      console.error("[v0] Error fetching feedback stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToPrevious = () => {
    setFadeIn(false)
    setTimeout(() => {
      setCurrentMessageIndex((prev) => (prev - 1 + messages.length) % messages.length)
      setFadeIn(true)
    }, 300)
  }

  const goToNext = () => {
    setFadeIn(false)
    setTimeout(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
      setFadeIn(true)
    }, 300)
  }

  const currentMessage = messages[currentMessageIndex]

  return (
    <footer
      className="border-t mt-20"
      style={{ backgroundColor: "hsl(var(--nav-bg))", borderColor: "hsl(var(--nav-border))" }}
    >
      <div className="container mx-auto px-4 py-8">
        {stats.totalFeedback > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: "hsl(var(--nav-text))" }}>
              Avis de la communauté
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-400">Contenu</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.content.toFixed(1)}/10</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-blue-400 fill-current" />
                  <span className="text-sm font-medium text-gray-400">Fonctionnalités</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.functionality.toFixed(1)}/10</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-purple-400 fill-current" />
                  <span className="text-sm font-medium text-gray-400">Design</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.design.toFixed(1)}/10</div>
              </div>
            </div>

            {!isLoading && messages.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-gray-400">
                      Livre d'or ({currentMessageIndex + 1}/{messages.length})
                    </span>
                  </div>
                  {messages.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevious}
                        className="h-8 w-8 p-0 hover:bg-gray-700"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={goToNext} className="h-8 w-8 p-0 hover:bg-gray-700">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative min-h-[80px] flex items-center">
                  {currentMessage && (
                    <div className={`w-full transition-opacity duration-300 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {currentMessage.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-blue-400">{currentMessage.username}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(currentMessage.created_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed italic">"{currentMessage.message}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {messages.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {messages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFadeIn(false)
                          setTimeout(() => {
                            setCurrentMessageIndex(index)
                            setFadeIn(true)
                          }, 300)
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentMessageIndex ? "bg-blue-500 w-8" : "bg-gray-600 w-1.5 hover:bg-gray-500"
                        }`}
                        aria-label={`Message ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 text-sm">Chargement des messages...</p>
                </div>
              </div>
            )}

            {!isLoading && messages.length === 0 && stats.totalFeedback > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun message dans le livre d'or pour le moment</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg" style={{ color: "hsl(var(--nav-text))" }}>
              WaveWatch
            </h3>
            <p className="text-sm" style={{ color: "hsl(var(--nav-text-secondary))" }}>
              Votre plateforme de streaming premium
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/contact-staff"
              className="transition-colors text-sm flex items-center gap-2 hover:text-blue-400"
              style={{ color: "hsl(var(--nav-text-secondary))" }}
            >
              <Mail className="w-4 h-4" />
              Écrire au staff
            </Link>
            <Link
              href="/dns-vpn"
              className="transition-colors text-sm hover:text-blue-400"
              style={{ color: "hsl(var(--nav-text-secondary))" }}
            >
              DNS & VPN
            </Link>
            <Link
              href="/faq"
              className="transition-colors text-sm hover:text-blue-400"
              style={{ color: "hsl(var(--nav-text-secondary))" }}
            >
              FAQ
            </Link>
            <Link
              href="/changelogs"
              className="transition-colors text-sm hover:text-blue-400"
              style={{ color: "hsl(var(--nav-text-secondary))" }}
            >
              Mise à jour
            </Link>
          </div>
        </div>

        <div className="border-t mt-6 pt-6 text-center" style={{ borderColor: "hsl(var(--nav-border))" }}>
          <p className="text-sm" style={{ color: "hsl(var(--nav-text-secondary))" }}>
            © {new Date().getFullYear()} WaveWatch. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
