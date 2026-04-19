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
import { Star, Calendar, Download, ThumbsUp, ThumbsDown, Monitor, HardDrive, Shield } from "lucide-react"

interface SoftwareDetailsProps {
  software: any
}

export function SoftwareDetails({ software }: SoftwareDetailsProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<"like" | "dislike" | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const getTotalVotes = (id: number, type: "like" | "dislike") => {
    const seed = id * (type === "like" ? 7 : 11)
    return Math.floor((seed % 1000) + 50)
  }

  const totalLikes = getTotalVotes(software.id, "like")
  const totalDislikes = getTotalVotes(software.id, "dislike")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFavorite(WatchTracker.isFavorite("software", software.id))
      setUserRating(WatchTracker.getRating("software", software.id))
    }
  }, [software.id])

  const handleLike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleLike("software", software.id, software.name, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Logiciel liké !" : "Like retiré",
      description: newRating ? `Vous avez liké ${software.name}` : `Like retiré de ${software.name}`,
    })
  }

  const handleDislike = () => {
    if (typeof window === "undefined") return
    const newRating = WatchTracker.toggleDislike("software", software.id, software.name, {})
    setUserRating(newRating)
    toast({
      title: newRating ? "Logiciel disliké" : "Dislike retiré",
      description: newRating ? `Vous avez disliké ${software.name}` : `Dislike retiré de ${software.name}`,
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

    const newState = WatchTracker.toggleFavorite("software", software.id, software.name, {})
    setIsFavorite(newState)
    toast({
      title: newState ? "Ajouté aux favoris" : "Retiré des favoris",
      description: `${software.name} a été ${newState ? "ajouté à" : "retiré de"} vos favoris.`,
    })
  }

  const downloadUrl = software.download_url || `https://embed.wavewatch.xyz/download/software?id=${software.id}`

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[30vh] md:h-[40vh] overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Icon */}
          <div className="lg:col-span-1">
            <div className="relative aspect-square w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg overflow-hidden bg-gradient-to-br from-blue-800 to-blue-900 p-8 flex items-center justify-center">
              <Image
                src={software.icon_url || "/placeholder.svg?height=200&width=200"}
                alt={software.name}
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-center md:text-left">
              {software.name}
            </h1>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{software.rating?.toFixed(1) || "N/A"}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{software.release_date ? new Date(software.release_date).getFullYear() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                <span>{software.file_size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>
                  {software.downloads > 1000000
                    ? `${(software.downloads / 1000000).toFixed(1)}M`
                    : software.downloads > 1000
                      ? `${(software.downloads / 1000).toFixed(0)}K`
                      : software.downloads}{" "}
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

            {/* Developer */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-300">
              <Monitor className="w-5 h-5" />
              <span>Développé par</span>
              <span className="text-blue-400 font-medium">{software.developer}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-blue-800 text-blue-300 border-blue-700">
                {software.category}
              </Badge>
              <Badge
                variant="secondary"
                className={`${
                  software.license === "Gratuit"
                    ? "bg-green-800 text-green-300 border-green-700"
                    : software.license === "Payant"
                      ? "bg-red-800 text-red-300 border-red-700"
                      : "bg-orange-800 text-orange-300 border-orange-700"
                }`}
              >
                {software.license}
              </Badge>
              <Badge variant="secondary" className="bg-purple-800 text-purple-300 border-purple-700">
                v{software.version}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-200 leading-relaxed text-center md:text-left">
              {software.description}
            </p>

            {/* Platform Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Informations système
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plateformes:</span>
                  <span className="text-white">{software.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white">{software.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Taille:</span>
                  <span className="text-white">{software.file_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Licence:</span>
                  <span className="text-white">{software.license}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
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
                itemId={software.id}
                mediaType="software"
                title={software.name}
                posterPath={software.icon_url}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-blue-600 text-blue-400 hover:bg-blue-900/20 bg-transparent"
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
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        src={downloadUrl}
        title={`Téléchargement - ${software.name}`}
      />
    </div>
  )
}
