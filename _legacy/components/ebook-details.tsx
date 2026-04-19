"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { WatchTracker } from "@/lib/watch-tracking"
import { IframeModal } from "@/components/iframe-modal"
import { AddToPlaylistButtonGeneric } from "@/components/add-to-playlist-button-generic"
import { Star, Calendar, Download, ThumbsUp, ThumbsDown, BookOpen, FileText, User, Headphones } from "lucide-react"

interface EbookDetailsProps {
  ebook: any
}

export function EbookDetails({ ebook }: EbookDetailsProps) {
  const [showReadModal, setShowReadModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    const seed = id * (type === "like" ? 7 : 11)
    return Math.floor((seed % 1000) + 50)
  }

  const totalLikes = getTotalVotes(ebook.id, "like")
  const totalDislikes = getTotalVotes(ebook.id, "dislike")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFavorite(WatchTracker.isFavorite("ebook", ebook.id))
      setUserRating(WatchTracker.getRating("ebook", ebook.id))
    }
  }, [ebook.id])

  const handleLike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleLike("ebook", ebook.id, ebook.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Livre liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${ebook.title}` : `Like retiré de ${ebook.title}`,
    })
  }

  const handleDislike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleDislike("ebook", ebook.id, ebook.title, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Livre disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${ebook.title}` : `Dislike retiré de ${ebook.title}`,
    })
  }

  const handleAddToFavorites = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris.",
        variant: "destructive",
      })
      return
    }

    if (typeof window === "undefined") return

    const newState = WatchTracker.toggleFavorite("ebook", ebook.id, ebook.title, {})
    setIsFavorite(newState)
    toast({
      title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
      description: `${ebook.title} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
    })
  }

  const readUrl = ebook.reading_url || `https://embed.wavewatch.xyz/read/ebook?id=${ebook.id}`
  const downloadUrl = ebook.download_url || `https://embed.wavewatch.xyz/download/ebook?id=${ebook.id}`
  const audiobookUrl = ebook.audiobook_url || `https://embed.wavewatch.xyz/audio/ebook?id=${ebook.id}`

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[30vh] md:h-[40vh] overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Cover */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden">
              <Image
                src={ebook.cover_url || "/placeholder.svg?height=600&width=400"}
                alt={ebook.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-center md:text-left">
              {ebook.title}
            </h1>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{ebook.rating?.toFixed(1) || "N/A"}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{ebook.publication_date ? new Date(ebook.publication_date).getFullYear() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{ebook.pages} pages</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>{ebook.file_size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>
                  {ebook.downloads > 1000000
                    ? `${(ebook.downloads / 1000000).toFixed(1)}M`
                    : ebook.downloads > 1000
                      ? `${(ebook.downloads / 1000).toFixed(0)}K`
                      : ebook.downloads}{" "}
                  téléchargements
                </span>
              </div>
              {/* Votes */}
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-auto ${
                    userRating === "like" ? "text-green-500 hover:text-green-400" : "text-gray-400 hover:text-green-500"
                  }`}
                  onClick={handleLike}
                >
                  <ThumbsUp className={`w-4 h-4 ${userRating === "like" ? "fill-current" : ""}`} />
                </Button>
                <span className="text-green-500 text-sm font-medium">
                  {totalLikes + (userRating === "like" ? 1 : 0)}
                </span>
                <div className="w-px h-4 bg-gray-600 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-auto ${
                    userRating === "dislike" ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                  }`}
                  onClick={handleDislike}
                >
                  <ThumbsDown className={`w-4 h-4 ${userRating === "dislike" ? "fill-current" : ""}`} />
                </Button>
                <span className="text-red-500 text-sm font-medium">
                  {totalDislikes + (userRating === "dislike" ? 1 : 0)}
                </span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-300">
              <User className="w-5 h-5" />
              <span>Par</span>
              <span className="text-green-400 font-medium">{ebook.author}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-green-800 text-green-300 border-green-700">
                {ebook.category}
              </Badge>
              <Badge variant="secondary" className="bg-blue-800 text-blue-300 border-blue-700">
                {ebook.language}
              </Badge>
              <Badge variant="secondary" className="bg-purple-800 text-purple-300 border-purple-700">
                {ebook.file_format}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-200 leading-relaxed text-center md:text-left">
              {ebook.description}
            </p>

            {/* Book Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                Informations sur le livre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Auteur:</span>
                  <span className="text-white">{ebook.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Éditeur:</span>
                  <span className="text-white">{ebook.publisher || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ISBN:</span>
                  <span className="text-white">{ebook.isbn || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pages:</span>
                  <span className="text-white">{ebook.pages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Langue:</span>
                  <span className="text-white">{ebook.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Format:</span>
                  <span className="text-white">{ebook.file_format}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
              <Button
                size="lg"
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-900/20 w-full sm:w-auto bg-transparent"
                onClick={() => setShowReadModal(true)}
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Lire en ligne
              </Button>
              {ebook.is_audiobook && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/20 w-full sm:w-auto bg-transparent"
                  onClick={() => setShowAudioModal(true)}
                >
                  <Headphones className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Écouter
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-900/20 w-full sm:w-auto bg-transparent"
                onClick={() => setShowDownloadModal(true)}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Télécharger
              </Button>
              <AddToPlaylistButtonGeneric
                itemId={ebook.id}
                mediaType="ebook"
                title={ebook.title}
                posterPath={ebook.cover_url}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-green-600 text-green-400 hover:bg-green-900/20 bg-transparent"
              />
              <Button
                size="lg"
                variant="outline"
                className={`border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 w-full sm:w-auto ${
                  isFavorite ? "bg-yellow-900/20" : ""
                }`}
                onClick={handleAddToFavorites}
              >
                <Star className={`w-4 h-4 md:w-5 md:h-5 mr-2 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                Favoris
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IframeModal
        isOpen={showReadModal}
        onClose={() => setShowReadModal(false)}
        src={readUrl}
        title={`Lecture - ${ebook.title}`}
      />

      <IframeModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        src={audiobookUrl}
        title={`Écoute - ${ebook.title}`}
      />

      <IframeModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Téléchargement - ${ebook.title}`}
      />
    </div>
  )
}
