"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Collection {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  parts?: any[]
}

export function PopularCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const popularCollectionIds = [
    10, // Star Wars
    119, // Lord of the Rings
    295, // Pirates of the Caribbean
    328, // Jurassic Park
    645, // James Bond
    748, // X-Men
    1241, // Harry Potter
    9485, // Fast & Furious
    86311, // The Avengers
    87359, // Mission: Impossible
    529892, // Marvel Cinematic Universe
    623, // Toy Story
  ]

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const loadedCollections: Collection[] = []

        for (const id of popularCollectionIds) {
          try {
            const response = await fetch(`/api/tmdb/collection/${id}`)
            if (response.ok) {
              const data = await response.json()
              loadedCollections.push(data)
            }
          } catch (error) {
            console.log(`[v0] Error loading collection ${id}, skipping`)
          }
        }

        setCollections(loadedCollections)
      } catch (error) {
        console.error("Error fetching collections:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
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
  }, [collections])

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Collections Populaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (collections.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/collections" className="hover:opacity-80 transition-opacity">
          <h2 className="text-2xl font-bold cursor-pointer">Collections Populaires</h2>
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
        >
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="flex-none w-[200px] md:w-[240px] group"
            >
              <Card className="overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="relative aspect-[16/9]">
                  {collection.backdrop_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${collection.backdrop_path}`}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    {collection.parts && collection.parts.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className="bg-blue-600 text-white border-0 text-xs">
                          <Film className="w-2.5 h-2.5 mr-0.5" />
                          {collection.parts.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
