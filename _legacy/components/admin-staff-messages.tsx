"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MessageSquare, Trash2, Reply, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AdminStaffMessages() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [replyContent, setReplyContent] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/staff-messages")
      const data = await response.json()
      setMessages(data.messages || [])
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

    try {
      const response = await fetch(`/api/staff-messages?id=${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erreur lors de la suppression")

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

    try {
      const response = await fetch("/api/staff-messages/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          recipientId: selectedMessage.user_id,
          replyContent,
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de l'envoi")

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée dans la messagerie de l'utilisateur",
      })

      setReplyDialogOpen(false)
      setSelectedMessage(null)
      setReplyContent("")
      loadMessages()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
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

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement des messages...</div>
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Messages du staff</CardTitle>
            <CardDescription>Gérez les messages envoyés par les utilisateurs au staff</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">{message.username}</TableCell>
                  <TableCell>{message.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                  <TableCell className="text-muted-foreground">
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
                      {message.status === "replied" ? "Répondu" : message.status === "pending" ? "En attente" : "Fermé"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleReply(message)}>
                        <Reply className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(message.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMessages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun message trouvé</p>
              <p className="text-sm">Les messages des utilisateurs apparaîtront ici</p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  )
}
