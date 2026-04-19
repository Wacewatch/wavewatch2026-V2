"use client"

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AutocompleteSearchProps {
  /**
   * Fonction qui reçoit la chaîne de recherche et doit
   * renvoyer un tableau de chaînes ou d’objets (label,value).
   * Elle peut être asynchrone.
   */
  fetchSuggestions?: (query: string) => Promise<Array<string | { label: string; value: string }>>
  placeholder?: string
  onSelect?: (value: string) => void
  className?: string
}

export default function AutocompleteSearch({
  fetchSuggestions,
  placeholder = "Rechercher…",
  onSelect,
  className,
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Array<string | { label: string; value: string }>>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Charge les suggestions à chaque frappe
  useEffect(() => {
    if (!fetchSuggestions || query.trim().length === 0) {
      setSuggestions([])
      return
    }

    let active = true
    fetchSuggestions(query).then((res) => {
      if (active) setSuggestions(res.slice(0, 10)) // max 10
    })

    return () => {
      active = false
    }
  }, [query, fetchSuggestions])

  // Ferme la liste lorsqu’on clique à l’extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const getDisplay = (s: string | { label: string; value: string }) => (typeof s === "string" ? s : s.label)

  const getValue = (s: string | { label: string; value: string }) => (typeof s === "string" ? s : s.value)

  const handleSelect = (s: string | { label: string; value: string }) => {
    const val = getValue(s)
    setQuery("")
    setOpen(false)
    onSelect?.(val)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSelect(suggestions[highlight])
    }
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Input
        value={query}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && suggestions.length > 0 && (
        <Card className="absolute z-20 mt-1 w-full shadow-lg">
          <CardContent className="p-0">
            <ul>
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  className={cn("cursor-pointer px-4 py-2 text-sm hover:bg-muted", highlight === idx && "bg-muted")}
                  onMouseDown={(e) => {
                    e.preventDefault() // empê­che le blur
                    handleSelect(s)
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                >
                  {getDisplay(s)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------
   Exemple d’utilisation :

   <AutocompleteSearch
     fetchSuggestions={async (q) => {
       const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
       const data = await res.json()
       return data.results   // [{label,value}] ou ['string']
     }}
     onSelect={(v) => console.log('Choisi :', v)}
   />

----------------------------------------------------------------- */
