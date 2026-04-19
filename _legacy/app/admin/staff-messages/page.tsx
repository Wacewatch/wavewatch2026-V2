"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MessageSquare, Trash2, Reply, Search, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

export default function AdminStaffMessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [replyContent, setReplyContent] = useState("")
  const [sending, setSending] = useState(false)

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    if (user?.isAdmin) {
      loadMessages()
    }
  }, [user])

  const loadMessages = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    
    try {
      const { data, error } = await supabase
        .from("staff_messages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading staff messages:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { error } = await supabase
        .from("staff_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      })

      loadMessages()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      })
    }
  }

  const handleReply = (message: any) => {
    setSelectedMessage(message)
    setReplyContent("")
    setReplyDialogOpen(true)
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return

    setSending(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error("User not authenticated")

      // Envoyer la réponse dans user_messages
      const { error: messageError } = await supabase.from("user_messages").insert({
        sender_id: authUser.id,
        recipient_id: selectedMessage.user_id,
        subject: `Re: ${selectedMessage.title}`,
        content: replyContent,
        is_read: false,
      })

      if (messageError) throw messageError

      // Mettre à jour le statut du message staff
      const { error: updateError } = await supabase
        .from("staff_messages")
        .update({ status: "replied" })
        .eq("id", selectedMessage.id)

      if (updateError) throw updateError

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée dans la messagerie de l'utilisateur",
      })

      setReplyDialogOpen(false)
      setSelectedMessage(null)
      setReplyContent("")
      loadMessages()
    } catch (error: any) {
      console.error("Error sending reply:", error)
      toast({
        title: "Erreur",
        description: `Impossible d'envoyer la réponse: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const filteredMessages = messages.filter(
    (msg) =>
      msg.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="text-center py-8 text-gray-400">
          <p>Accès refusé. Vous devez être administrateur.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="text-center py-8 text-gray-400">Chargement des messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Messages du Staff</h1>
          <p className="text-gray-400">Gérez les messages envoyés par les utilisateurs</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Tous les messages</CardTitle>
            <CardDescription className="text-gray-400">
              {messages.length} message{messages.length > 1 ? "s" : ""} au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900 border-gray-700 hover:bg-gray-900">
                    <TableHead className="text-gray-300">Utilisateur</TableHead>
                    <TableHead className="text-gray-300">Titre</TableHead>
                    <TableHead className="text-gray-300">Message</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Statut</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id} className="border-gray-700 hover:bg-gray-900/50">
                      <TableCell className="font-medium text-white">{message.username}</TableCell>
                      <TableCell className="text-gray-300">{message.title}</TableCell>
                      <TableCell className="max-w-xs truncate text-gray-400">{message.message}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(message.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            message.status === "replied"
                              ? "default"
                              : message.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {message.status === "replied"
                            ? "Répondu"
                            : message.status === "pending"
                              ? "En attente"
                              : "Fermé"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReply(message)}
                            className="border-gray-600 hover:bg-gray-700"
                          >
                            <Reply className="w-4 h-4 text-blue-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(message.id)}
                            className="border-gray-600 hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600" />
                <p className="text-gray-400">Aucun message trouvé</p>
                <p className="text-sm text-gray-500">Les messages des utilisateurs apparaîtront ici</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Répondre au message</DialogTitle>
            <DialogDescription className="text-gray-400">
              Votre réponse sera envoyée dans la messagerie de {selectedMessage?.username}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded border border-gray-700">
                <p className="text-sm font-medium text-gray-300 mb-2">Message original :</p>
                <p className="text-sm text-gray-400 mb-1">
                  <strong>Titre :</strong> {selectedMessage.title}
                </p>
                <p className="text-sm text-gray-400">{selectedMessage.message}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Votre réponse</label>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  className="bg-gray-800 border-gray-700 text-white min-h-32"
                  rows={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? "Envoi..." : "Envoyer la réponse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
