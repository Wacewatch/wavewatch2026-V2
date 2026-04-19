"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Film, ThumbsUp, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePublicPlaylists } from "@/hooks/use-public-playlists"

export function PublicPlaylistsRow() {
  const { playlists, loading } = usePublicPlaylists()
  const [mounted, setMounted] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      updateScrollButtons()
      container.addEventListener("scroll", updateScrollButtons)
      return () => container.removeEventListener("scroll", updateScrollButtons)
    }
  }, [playlists])

  if (!mounted || loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Playlists Publiques</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-none w-[150px] md:w-[180px] aspect-square bg-gray-800 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </section>
    )
  }

  if (playlists.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/discover/playlists" className="hover:opacity-80 transition-opacity">
          <h2 className="text-2xl font-bold text-white cursor-pointer">Playlists Publiques</h2>
        </Link>
        <div className="flex items-center gap-2">
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
          <Button asChild variant="ghost" className="text-blue-400 hover:text-blue-300">
            <Link href="/discover/playlists">
              Voir tout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
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
        >
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="flex-none w-[150px] md:w-[180px]">
              <Card className="group overflow-hidden hover:scale-105 transition-transform duration-200 bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        playlist.theme_color.includes("gradient") ? "animate-gradient" : ""
                      }`}
                      style={{
                        background: playlist.theme_color,
                        backgroundSize: playlist.theme_color.includes("gradient") ? "200% 200%" : "auto",
                      }}
                    >
                      <Film
                        className="w-16 h-16 text-white opacity-50"
                        style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))" }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                      <h3
                        className="font-semibold text-sm line-clamp-2 mb-1 text-white"
                        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.9)" }}
                      >
                        {playlist.title}
                      </h3>
                      <div
                        className="flex items-center gap-2 text-xs text-gray-200"
                        style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.9)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {playlist.items_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {playlist.likes_count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.9)" }}>
                        Par {playlist.username}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
