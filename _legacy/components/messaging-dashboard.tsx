"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Search, UserX, Mail, MailOpen, Plus, Shield, Trash2, Reply } from "lucide-react"
import { useMessaging } from "@/hooks/use-messaging"
import { useAuth } from "@/components/auth-provider"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export function MessagingDashboard() {
  const { user } = useAuth()
  const {
    messages,
    sentMessages,
    blockedUsers,
    unreadCount,
    loading,
    sendMessage,
    markAsRead,
    deleteMessage,
    blockUser,
    unblockUser,
    searchUsers,
    updateMessagePreferences,
  } = useMessaging()

  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [messageSubject, setMessageSubject] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [allowMessages, setAllowMessages] = useState(true)
  const [replyingTo, setReplyingTo] = useState<any>(null)

  const handleUserSearch = async (query: string) => {
    setUserSearch(query)
    if (query.length >= 2) {
      const results = await searchUsers(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSendMessage = async () => {
    if (!selectedRecipient || !messageContent.trim()) return

    setSending(true)
    const success = await sendMessage(selectedRecipient.id, messageSubject, messageContent)

    if (success) {
      setNewMessageOpen(false)
      setSelectedRecipient(null)
      setMessageSubject("")
      setMessageContent("")
      setUserSearch("")
      setSearchResults([])
      setReplyingTo(null)
    }

    setSending(false)
  }

  const handleMarkAsRead = async (messageId: string) => {
    await markAsRead(messageId)
  }

  const handleDeleteMessage = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteMessage(messageId)
  }

  const handleBlockUser = async (userId: string) => {
    await blockUser(userId)
  }

  const handleUnblockUser = async (userId: string) => {
    await unblockUser(userId)
  }

  const handleReply = (message: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setReplyingTo(message)
    setSelectedRecipient({
      id: message.sender_id,
      username: message.sender_username,
    })
    setMessageSubject(message.subject ? `Re: ${message.subject}` : "Re: Votre message")
    setMessageContent(`\n\n--- Message original de ${message.sender_username} ---\n${message.content}`)
    setNewMessageOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Chargement de la messagerie...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-400" />
            Messagerie
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h2>
          <p className="text-gray-400">Communiquez avec les autres utilisateurs</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {replyingTo ? "Répondre au message" : "Nouveau message"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {replyingTo
                    ? `Répondre à ${replyingTo.sender_username}`
                    : "Envoyez un message à un autre utilisateur"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Recipient Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Destinataire</label>
                  {selectedRecipient ? (
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700">
                      <span className="text-white">{selectedRecipient.username}</span>
                      {!replyingTo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecipient(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher un utilisateur..."
                          value={userSearch}
                          onChange={(e) => handleUserSearch(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <ScrollArea className="max-h-32 border border-gray-700 rounded">
                          <div className="p-1">
                            {searchResults.map((user) => (
                              <Button
                                key={user.id}
                                variant="ghost"
                                className="w-full justify-start text-white hover:bg-gray-800"
                                onClick={() => {
                                  setSelectedRecipient(user)
                                  setUserSearch("")
                                  setSearchResults([])
                                }}
                              >
                                {user.username}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Sujet (optionnel)</label>
                  <Input
                    placeholder="Sujet du message..."
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Message</label>
                  <Textarea
                    placeholder="Votre message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white min-h-24"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedRecipient || !messageContent.trim() || sending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Envoyer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700 h-auto">
          <TabsTrigger
            value="received"
            className="data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 py-2 sm:py-2.5 whitespace-normal sm:whitespace-nowrap"
          >
            <span className="hidden sm:inline">Messages reçus</span>
            <span className="sm:hidden">Reçus</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 py-2 sm:py-2.5 whitespace-normal sm:whitespace-nowrap"
          >
            <span className="hidden sm:inline">Messages envoyés</span>
            <span className="sm:hidden">Envoyés</span>
          </TabsTrigger>
          <TabsTrigger
            value="blocked"
            className="data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 py-2 sm:py-2.5 whitespace-normal sm:whitespace-nowrap"
          >
            <span className="hidden sm:inline">Utilisateurs bloqués</span>
            <span className="sm:hidden">Bloqués</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {messages.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucun message reçu</h3>
                <p className="text-gray-400 text-center">Vous n'avez pas encore reçu de messages.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={`bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors ${
                    !message.is_read ? "border-blue-600" : ""
                  }`}
                  onClick={() => handleMarkAsRead(message.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {message.is_read ? (
                            <MailOpen className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Mail className="w-4 h-4 text-blue-400" />
                          )}
                          <CardTitle className="text-white text-sm">De: {message.sender_username}</CardTitle>
                          {!message.is_read && (
                            <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        {message.subject && (
                          <CardDescription className="text-gray-300 mt-1">{message.subject}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleReply(message, e)}
                          className="text-gray-400 hover:text-blue-400"
                          title="Répondre"
                        >
                          <Reply className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteMessage(message.id, e)}
                          className="text-gray-400 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBlockUser(message.sender_id)
                          }}
                          className="text-gray-400 hover:text-red-400"
                          title="Bloquer l'utilisateur"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentMessages.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucun message envoyé</h3>
                <p className="text-gray-400 text-center">Vous n'avez pas encore envoyé de messages.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentMessages.map((message) => (
                <Card key={message.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-gray-400" />
                          <CardTitle className="text-white text-sm">À: {message.recipient_username}</CardTitle>
                        </div>
                        {message.subject && (
                          <CardDescription className="text-gray-300 mt-1">{message.subject}</CardDescription>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          {blockedUsers.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserX className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucun utilisateur bloqué</h3>
                <p className="text-gray-400 text-center">Vous n'avez bloqué aucun utilisateur.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((userId) => (
                <Card key={userId} className="bg-gray-800 border-gray-700">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <UserX className="w-5 h-5 text-red-400" />
                      <span className="text-white">Utilisateur bloqué</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockUser(userId)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Débloquer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
