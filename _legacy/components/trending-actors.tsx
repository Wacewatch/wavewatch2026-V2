"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Actor {
  id: number
  name: string
  profile_path: string | null
  known_for: Array<{
    title?: string
    name?: string
  }>
}

export function TrendingActors() {
  const [actors, setActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const response = await fetch("/api/tmdb/popular/actors")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        if (data && data.results && Array.isArray(data.results)) {
          setActors(data.results.slice(0, 12))
        } else {
          throw new Error("Invalid data structure")
        }
      } catch (error) {
        console.error("Error fetching actors:", error)
        setActors([
          {
            id: 6193,
            name: "Leonardo DiCaprio",
            profile_path: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg",
            known_for: [{ title: "Inception" }, { title: "The Wolf of Wall Street" }],
          },
          {
            id: 1245,
            name: "Scarlett Johansson",
            profile_path: "/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg",
            known_for: [{ title: "Black Widow" }, { title: "Marriage Story" }],
          },
          {
            id: 10859,
            name: "Ryan Gosling",
            profile_path: "/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg",
            known_for: [{ title: "La La Land" }, { title: "Blade Runner 2049" }],
          },
          {
            id: 54693,
            name: "Emma Stone",
            profile_path: "/wqEypkRUUZEcFmPV4O4JpZznmNk.jpg",
            known_for: [{ title: "La La Land" }, { title: "Easy A" }],
          },
          {
            id: 234352,
            name: "Margot Robbie",
            profile_path: "/euDPyqLnuwaWMHajcU3oZ9uZezR.jpg",
            known_for: [{ title: "Barbie" }, { title: "The Wolf of Wall Street" }],
          },
          {
            id: 10859,
            name: "Ryan Reynolds",
            profile_path: "/2Orm6l3z3zukF1q0AgIOUqvwLeB.jpg",
            known_for: [{ title: "Deadpool" }, { title: "The Proposal" }],
          },
          {
            id: 1892,
            name: "Matt Damon",
            profile_path: "/ehwS5WvU5yL5vKcUEqbzGK8Fh8B.jpg",
            known_for: [{ title: "The Martian" }, { title: "Good Will Hunting" }],
          },
          {
            id: 2231,
            name: "Samuel L. Jackson",
            profile_path: "/AiAYAqwpM5xmiFrAIeQvUXDCVvo.jpg",
            known_for: [{ title: "Pulp Fiction" }, { title: "Snakes on a Plane" }],
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchActors()
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
  }, [actors])

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Acteurs Tendance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-2"></div>
              <div className="bg-gray-300 h-4 rounded mb-1"></div>
              <div className="bg-gray-300 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/actors" className="hover:opacity-80 transition-opacity">
          <h2 className="text-2xl font-bold cursor-pointer">Acteurs Tendance</h2>
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
          {actors.map((actor) => (
            <div key={actor.id} className="flex-none">
              <Link href={`/actors/${actor.id}`} className="block">
                <Card className="w-[150px] md:w-[180px] hover:scale-105 transition-transform cursor-pointer">
                  <CardContent className="p-0">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                      <img
                        src={
                          actor.profile_path
                            ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                            : "/placeholder.svg?height=300&width=200"
                        }
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{actor.name}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {actor.known_for
                          ?.slice(0, 2)
                          .map((movie) => movie.title || movie.name)
                          .join(", ")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
