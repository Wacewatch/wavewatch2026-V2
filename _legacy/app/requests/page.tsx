"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, ArrowLeft, ThumbsUp } from "lucide-react"
import { searchMulti } from "@/lib/tmdb"
import Image from "next/image"
import Link from "next/link"

interface SearchResult {
  id: number
  title?: string
  name?: string
  poster_path: string
  media_type: string
  release_date?: string
  first_air_date?: string
  overview: string
}

export default function RequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [votedRequests, setVotedRequests] = useState<Set<string>>(new Set())
  const [votingLoading, setVotingLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadRequests()
      loadUserVotes()
    }
  }, [user])

  const loadUserVotes = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/content-requests/votes")
      const data = await response.json()
      if (data.votes) {
        setVotedRequests(new Set(data.votes.map((v: any) => v.request_id)))
      }
    } catch (error) {
      console.error("Error loading votes:", error)
    }
  }

  const loadRequests = async () => {
    try {
      const response = await fetch("/api/content-requests")
      const data = await response.json()
      setRequests(data.requests || [])

      if (user) {
        const userRequests = (data.requests || []).filter((req: any) => req.user_id === user.id)
        setMyRequests(userRequests)
      } else {
        setMyRequests([])
      }
    } catch (error) {
      console.error("Error loading requests:", error)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const data = await searchMulti(query)
      setSearchResults(data.results.filter((item: any) => item.media_type === "movie" || item.media_type === "tv"))
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le contenu.",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleRequestContent = async (content: SearchResult) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour faire une demande.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/content-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: content.title || content.name,
          description: content.overview,
          content_type: content.media_type,
          tmdb_id: content.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      toast({
        title: "Demande envoyée",
        description: `Votre demande pour "${content.title || content.name}" a été envoyée avec succès.`,
      })

      setSearchQuery("")
      setSearchResults([])
      loadRequests()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de la demande.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (requestId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voter.",
        variant: "destructive",
      })
      return
    }

    setVotingLoading(requestId)

    try {
      const hasVoted = votedRequests.has(requestId)
      const method = hasVoted ? "DELETE" : "POST"

      const response = await fetch(`/api/content-requests/${requestId}/vote`, {
        method,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      // Update local state
      const newVotedRequests = new Set(votedRequests)
      if (hasVoted) {
        newVotedRequests.delete(requestId)
      } else {
        newVotedRequests.add(requestId)
      }
      setVotedRequests(newVotedRequests)

      // Reload requests to get updated vote counts
      loadRequests()

      toast({
        title: hasVoted ? "Vote retiré" : "Vote ajouté",
        description: hasVoted ? "Votre vote a été retiré." : "Votre vote a été pris en compte.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setVotingLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "approved":
        return <Badge variant="default">Approuvée</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejetée</Badge>
      case "completed":
        return <Badge className="bg-green-600">Terminée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const RequestCard = ({ request, showVotes = true }: { request: any; showVotes?: boolean }) => {
    const hasVoted = votedRequests.has(request.id)
    const isVoting = votingLoading === request.id

    return (
      <div key={request.id} className="border border-gray-700 rounded-lg p-4 space-y-2 bg-gray-700/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">{request.title}</h3>
            <p className="text-sm text-gray-400">
              {request.content_type === "movie" ? "Film" : request.content_type === "tv" ? "Série TV" : "Animé"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showVotes && (
              <Button
                onClick={() => handleVote(request.id)}
                disabled={isVoting || !user}
                size="sm"
                variant={hasVoted ? "default" : "outline"}
                className={
                  hasVoted
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-600"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                <ThumbsUp className={`w-4 h-4 ${request.vote_count ? "mr-1" : ""}`} />
                {request.vote_count || 0}
              </Button>
            )}
            {getStatusBadge(request.status)}
          </div>
        </div>
        {request.description && <p className="text-sm text-gray-300">{request.description}</p>}
        <p className="text-xs text-gray-500">Demandé le {new Date(request.created_at).toLocaleDateString("fr-FR")}</p>
        {request.admin_notes && (
          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-600">
            <p className="text-xs text-gray-400 font-semibold mb-1">Note de l'admin :</p>
            <p className="text-xs text-gray-300">{request.admin_notes}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Demandes de contenu</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Recherchez et demandez l'ajout de films, séries ou animés
          </p>
        </div>

        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-gray-800 border-gray-700 p-1 text-gray-300 w-full overflow-x-auto">
            <TabsTrigger
              value="submit"
              className="data-[state=active]:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 whitespace-nowrap"
            >
              Faire une demande
            </TabsTrigger>
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 whitespace-nowrap"
            >
              Parcourir
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="my-requests"
                className="data-[state=active]:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 whitespace-nowrap"
              >
                Mes demandes
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="submit" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Rechercher du contenu</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Tapez le nom d'un film, série ou animé pour le rechercher et faire une demande
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher un film, série ou animé..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {!user && <p className="text-sm text-gray-400">Vous devez être connecté pour faire une demande.</p>}

                {searching && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Recherche en cours...</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white">Résultats de recherche :</h3>
                    <div className="grid gap-4">
                      {searchResults.slice(0, 10).map((result) => (
                        <Card key={result.id} className="overflow-hidden bg-gray-700 border-gray-600">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                                <Image
                                  src={
                                    result.poster_path
                                      ? `https://image.tmdb.org/t/p/w200${result.poster_path}`
                                      : "/placeholder.svg?height=120&width=80"
                                  }
                                  alt={result.title || result.name || ""}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2 gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base sm:text-lg text-white truncate">
                                      {result.title || result.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <Badge variant="outline" className="border-gray-500 text-gray-300">
                                        {result.media_type === "movie" ? "Film" : "Série"}
                                      </Badge>
                                      <span>
                                        {result.release_date || result.first_air_date
                                          ? new Date(result.release_date || result.first_air_date || "").getFullYear()
                                          : "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleRequestContent(result)}
                                    disabled={loading || !user}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                                  >
                                    <Plus className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Demander</span>
                                  </Button>
                                </div>

                                {result.overview && (
                                  <p className="text-sm text-gray-400 line-clamp-2">{result.overview}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucun résultat trouvé pour "{searchQuery}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Toutes les demandes</CardTitle>
                <CardDescription className="text-gray-400">
                  Parcourez et votez pour les demandes de la communauté
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucune demande pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {[...requests]
                      .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
                      .map((request: any) => (
                        <RequestCard key={request.id} request={request} showVotes={true} />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user && (
            <TabsContent value="my-requests" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Mes demandes</CardTitle>
                  <CardDescription className="text-gray-400">Suivez le statut de vos demandes</CardDescription>
                </CardHeader>
                <CardContent>
                  {myRequests.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Vous n'avez fait aucune demande pour le moment.</p>
                  ) : (
                    <div className="space-y-4">
                      {myRequests.map((request: any) => (
                        <RequestCard key={request.id} request={request} showVotes={true} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
