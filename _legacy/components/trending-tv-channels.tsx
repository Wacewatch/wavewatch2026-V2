"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tv, ChevronLeft, ChevronRight } from "lucide-react"
import { IframeModal } from "@/components/iframe-modal"
import { useTVChannels } from "@/hooks/use-tv-channels"
import Link from "next/link"

interface TVChannel {
  id: number
  name: string
  category: string
  country: string
  language: string
  logo_url: string
  stream_url: string
  trailer_url?: string
  description?: string
  quality?: string
  is_active?: boolean
}

export function TrendingTVChannels() {
  const { channels, isLoading, error } = useTVChannels()
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [shuffledChannels, setShuffledChannels] = useState<TVChannel[]>([])

  useEffect(() => {
    if (channels.length > 0) {
      // Fisher-Yates shuffle algorithm
      const shuffled = [...channels]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setShuffledChannels(shuffled)
    }
  }, [channels])

  const handleChannelClick = (channel: TVChannel) => {
    setSelectedChannel(channel)
    setIsModalOpen(true)
  }

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      const newScrollLeft =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Tv className="h-8 w-8 text-blue-500" />
          <h2 className="text-3xl font-bold">Chaînes TV Populaires</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des chaînes...</p>
        </div>
      </section>
    )
  }

  const trendingChannels = shuffledChannels.slice(0, 25)

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/tv-channels" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Tv className="h-8 w-8 text-blue-500" />
            <h2 className="text-3xl font-bold cursor-pointer">Chaînes TV Populaires</h2>
          </Link>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="opacity-75 hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="opacity-75 hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
            onScroll={updateScrollButtons}
          >
            {trendingChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex-none w-[150px] md:w-[180px] cursor-pointer"
                onClick={() => handleChannelClick(channel)}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-2 md:p-3">
                    <div className="aspect-[3/4] bg-white rounded-lg mb-2 flex items-center justify-center border">
                      <img
                        src={channel.logo_url || "/placeholder.svg"}
                        alt={channel.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/tv-channel-logo.jpg"
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs md:text-sm truncate">{channel.name}</h3>
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          LIVE
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1 py-0 ${
                            channel.category === "Premium"
                              ? "bg-yellow-100 text-yellow-800"
                              : channel.category === "Sport"
                                ? "bg-green-100 text-green-800"
                                : channel.category === "Généraliste"
                                  ? "bg-blue-100 text-blue-800"
                                  : channel.category === "Documentaire"
                                    ? "bg-orange-100 text-orange-800"
                                    : channel.category === "Jeunesse"
                                      ? "bg-pink-100 text-pink-800"
                                      : channel.category === "Gaming"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {channel.category}
                        </Badge>
                      </div>

                      <p className="text-[10px] md:text-xs text-gray-600 truncate">
                        {channel.description || channel.country || "Chaîne TV"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de lecture */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedChannel?.name || ""}
        src={selectedChannel?.stream_url || ""}
      />
    </>
  )
}
