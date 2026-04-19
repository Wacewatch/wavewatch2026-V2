"use client"

import * as React from "react"

if (typeof window !== 'undefined' && typeof self !== 'undefined') {
  self.__v0_$RefreshReg$ = () => {}
  self.__v0_$RefreshSig$ = () => (type: any) => type
}

type Theme =
  | "dark"
  | "light"
  | "system"
  | "ocean"
  | "sunset"
  | "forest"
  | "midnight"
  | "aurora"
  | "desert"
  | "lavender"
  | "crimson"
  | "sapphire"
  | "jade"
  | "premium"
  | "royal"
  | "neon"
  | "emerald"
  | "cosmic"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, defaultTheme = "dark", ...props }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("wavewatch_theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove(
      "light",
      "dark",
      "ocean",
      "sunset",
      "forest",
      "midnight",
      "aurora",
      "desert",
      "lavender",
      "crimson",
      "sapphire",
      "jade",
      "premium",
      "royal",
      "neon",
      "emerald",
      "cosmic",
    )

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    localStorage.setItem("wavewatch_theme", theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
