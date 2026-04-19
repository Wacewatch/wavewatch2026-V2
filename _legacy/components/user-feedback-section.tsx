"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Smile, Meh, Frown, Star, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FeedbackData {
  content_rating: number
  functionality_rating: number
  design_rating: number
  guestbook_message: string
}

interface GuestbookStats {
  guestbookMessages: Array<{
    message: string
    username: string
    created_at: string
  }>
  stats: {
    content: number
    functionality: number
    design: number
    totalFeedback: number
  }
}

export function UserFeedbackSection() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [guestbookStats, setGuestbookStats] = useState<GuestbookStats | null>(null)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData>({
    content_rating: 5,
    functionality_rating: 5,
    design_rating: 5,
    guestbook_message: "",
  })

  useEffect(() => {
    if (user) {
      fetchUserFeedback()
    }
    fetchGuestbookStats()
  }, [user])

  const fetchGuestbookStats = async () => {
    try {
      const response = await fetch("/api/feedback/stats")

      if (!response.ok) {
        console.error("Error fetching feedback:", response.status, response.statusText)
        return
      }

      const text = await response.text()

      try {
        const data = JSON.parse(text)
        setGuestbookStats(data)
      } catch (parseError) {
        console.error("Error parsing feedback response:", parseError)
        console.error("Response text:", text.substring(0, 100))
      }
    } catch (error) {
      console.error("Error fetching guestbook stats:", error)
    }
  }

  const fetchUserFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback?user_id=${user?.id}`)

      if (!response.ok) {
        console.error("Error fetching user feedback:", response.status)
        return
      }

      const data = await response.json()
      if (data.feedback && data.feedback.length > 0) {
        const userFeedback = data.feedback[0]
        setFeedback({
          content_rating: userFeedback.content_rating || 5,
          functionality_rating: userFeedback.functionality_rating || 5,
          design_rating: userFeedback.design_rating || 5,
          guestbook_message: userFeedback.guestbook_message || "",
        })
      }
    } catch (error) {
      console.error("Error fetching feedback:", error)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre un avis",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          ...feedback,
        }),
      })

      if (!response.ok) throw new Error("Failed to save feedback")

      toast({
        title: "Merci !",
        description: "Votre avis a été enregistré avec succès",
      })
      fetchGuestbookStats()
    } catch (error) {
      console.error("Error saving feedback:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre avis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const RatingSelector = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (value: number) => void
  }) => {
    const getEmoji = (rating: number) => {
      if (rating <= 3) return <Frown className="w-5 h-5 text-red-500" />
      if (rating <= 7) return <Meh className="w-5 h-5 text-yellow-500" />
      return <Smile className="w-5 h-5 text-green-500" />
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <div className="flex items-center gap-2">
            {getEmoji(value)}
            <span className="text-lg font-bold text-white">{value}/10</span>
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`flex-1 h-10 rounded transition-all ${
                rating <= value
                  ? rating <= 3
                    ? "bg-red-500 hover:bg-red-600"
                    : rating <= 7
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-green-500 hover:bg-green-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <Star className={`w-4 h-4 mx-auto ${rating <= value ? "fill-current" : ""}`} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Votre avis compte</CardTitle>
              <CardDescription className="text-gray-400">
                Aidez-nous à améliorer WaveWatch en partageant votre expérience
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="space-y-6">
            <RatingSelector
              label="Contenu"
              value={feedback.content_rating}
              onChange={(value) => setFeedback({ ...feedback, content_rating: value })}
            />
            <RatingSelector
              label="Fonctionnalités"
              value={feedback.functionality_rating}
              onChange={(value) => setFeedback({ ...feedback, functionality_rating: value })}
            />
            <RatingSelector
              label="Design"
              value={feedback.design_rating}
              onChange={(value) => setFeedback({ ...feedback, design_rating: value })}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Livre d'or</label>
              <Textarea
                placeholder="Partagez votre expérience avec WaveWatch..."
                value={feedback.guestbook_message}
                onChange={(e) => setFeedback({ ...feedback, guestbook_message: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Enregistrement..." : "Enregistrer mon avis"}
            </Button>
          </CardContent>
        )}
      </Card>

      {guestbookStats && (
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Avis de la communauté
            </CardTitle>
            <CardDescription className="text-gray-400">
              Notes moyennes basées sur {guestbookStats.stats.totalFeedback} vote
              {guestbookStats.stats.totalFeedback > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-white">{guestbookStats.stats.content.toFixed(1)}/10</div>
                <div className="text-xs text-gray-400">Contenu</div>
                <div className="text-xs text-gray-500">{guestbookStats.stats.totalFeedback} votes</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-white">{guestbookStats.stats.functionality.toFixed(1)}/10</div>
                <div className="text-xs text-gray-400">Fonctionnalités</div>
                <div className="text-xs text-gray-500">{guestbookStats.stats.totalFeedback} votes</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-white">{guestbookStats.stats.design.toFixed(1)}/10</div>
                <div className="text-xs text-gray-400">Design</div>
                <div className="text-xs text-gray-500">{guestbookStats.stats.totalFeedback} votes</div>
              </div>
            </div>

            {guestbookStats.guestbookMessages.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Livre d'or</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(showAllMessages
                    ? guestbookStats.guestbookMessages
                    : guestbookStats.guestbookMessages.slice(0, 5)
                  ).map((msg, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-400">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  ))}
                </div>
                {guestbookStats.guestbookMessages.length > 5 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllMessages(!showAllMessages)}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {showAllMessages
                      ? "Voir moins"
                      : `Voir tous les messages (${guestbookStats.guestbookMessages.length})`}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
