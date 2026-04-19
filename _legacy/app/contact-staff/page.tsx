"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ContactStaffPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour contacter le staff",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      console.log("[v0] Contact Staff: Sending message...")
      const response = await fetch("/api/staff-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, message }),
      })

      console.log("[v0] Contact Staff: Response status:", response.status)
      const data = await response.json()
      console.log("[v0] Contact Staff: Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au staff avec succès",
      })

      setTitle("")
      setMessage("")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] Contact Staff: Error:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Accès refusé</h1>
            <p className="text-gray-300">Vous devez être connecté pour contacter le staff.</p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Écrire au staff</h1>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Contactez notre équipe</CardTitle>
            <CardDescription className="text-gray-400">
              Envoyez un message à notre équipe. Nous vous répondrons dans votre messagerie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Titre</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sujet de votre message..."
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande, question ou suggestion..."
                  className="bg-gray-900 border-gray-700 text-white min-h-48"
                  rows={8}
                  required
                />
              </div>

              <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700">
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer le message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
