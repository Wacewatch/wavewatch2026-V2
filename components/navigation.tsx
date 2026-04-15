"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, X, User, LogOut, Crown, Shield, ChevronDown, Palette } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { useMessaging } from "@/hooks/use-messaging"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/hooks/use-toast"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, signOut } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()
  const { unreadCount } = useMessaging()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setIsMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    setIsMenuOpen(false)
  }

  const freeThemes = [
    { id: "dark", name: "Sombre", gradient: "from-gray-900 to-gray-800" },
    { id: "light", name: "Clair", gradient: "from-gray-100 to-gray-200" },
    { id: "ocean", name: "Océan", gradient: "from-blue-900 to-cyan-700" },
    { id: "forest", name: "Forêt", gradient: "from-green-900 to-emerald-700" },
    { id: "midnight", name: "Minuit", gradient: "from-indigo-950 to-blue-900" },
    { id: "aurora", name: "Aurore", gradient: "from-teal-800 to-cyan-600" },
    { id: "desert", name: "Désert", gradient: "from-yellow-800 to-orange-700" },
    { id: "lavender", name: "Lavande", gradient: "from-purple-400 to-pink-400" },
    { id: "crimson", name: "Cramoisi", gradient: "from-red-900 to-rose-700" },
    { id: "jade", name: "Jade", gradient: "from-emerald-800 to-teal-700" },
  ]

  const limitedThemes = [
    { id: "halloween", name: "Halloween", gradient: "from-orange-600 via-black to-purple-900" },
    { id: "christmas", name: "Noël", gradient: "from-red-700 via-green-700 to-red-700" },
  ]

  const premiumThemes = [
    { id: "premium", name: "Premium", gradient: "from-yellow-600 via-purple-600 to-yellow-600", requiresVip: true },
    { id: "royal", name: "Royal", gradient: "from-purple-700 to-indigo-800", requiresVip: true },
    { id: "neon", name: "Néon", gradient: "from-pink-500 via-cyan-500 to-pink-500", requiresVipPlus: true },
    { id: "emerald", name: "Émeraude", gradient: "from-emerald-600 to-teal-700", requiresVipPlus: true },
    { id: "cosmic", name: "Cosmique", gradient: "from-purple-600 via-blue-600 to-purple-600", requiresVipPlus: true },
  ]

  const handleThemeChange = (themeId: string, requiresVip?: boolean, requiresVipPlus?: boolean) => {
    if (requiresVipPlus && !user?.isVipPlus && !user?.isAdmin) {
      toast({
        title: "Thème VIP+ requis",
        description: "Ce thème est réservé aux membres VIP+",
        variant: "destructive",
      })
      return
    }

    if (requiresVip && !user?.isVip && !user?.isVipPlus && !user?.isAdmin) {
      toast({
        title: "Thème VIP requis",
        description: "Ce thème est réservé aux membres VIP et VIP+",
        variant: "destructive",
      })
      return
    }

    setTheme(themeId as any)
    toast({
      title: "Thème changé",
      description: `Le thème a été changé avec succès`,
    })
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: "hsl(var(--nav-bg))", borderColor: "hsl(var(--nav-border))" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 lg:h-24">
          {/* Logo - Optimisé pour toutes les tailles */}
          <Link href="/" className="flex items-center flex-shrink-0 group">
            <div className="relative h-12 w-auto sm:h-14 md:h-16 lg:h-20 transition-transform group-hover:scale-105">
              <img src="/images/design-mode/wwlogo2026.png" alt="WaveWatch" className="h-full w-auto object-contain" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Content Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="transition-all duration-300 font-medium relative group flex items-center"
                style={{ color: "hsl(var(--nav-text))" }}
              >
                Contenu
                <ChevronDown className="w-4 h-4 ml-1" />
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                ></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                style={{ backgroundColor: "hsl(var(--nav-dropdown-bg))", borderColor: "hsl(var(--nav-border))" }}
              >
                <DropdownMenuItem asChild>
                  <Link href="/movies" style={{ color: "hsl(var(--nav-text))" }}>
                    Films
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tv-shows" style={{ color: "hsl(var(--nav-text))" }}>
                    Séries
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/anime" style={{ color: "hsl(var(--nav-text))" }}>
                    Animés
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/collections" style={{ color: "hsl(var(--nav-text))" }}>
                    Collections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: "hsl(var(--nav-border))" }} />
                <DropdownMenuItem asChild>
                  <Link
                    href="/ebooks"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    Ebooks
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      NEW
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/logiciels" style={{ color: "hsl(var(--nav-text))" }}>
                    Logiciels
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      NEW
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/musique" style={{ color: "hsl(var(--nav-text))" }}>
                        Musiques
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/jeux" style={{ color: "hsl(var(--nav-text))" }}>
                        Jeux
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem disabled style={{ color: "hsl(var(--nav-text-secondary))", opacity: 0.6 }}>
                      Musiques <span className="ml-auto text-xs">Bientôt</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled style={{ color: "hsl(var(--nav-text-secondary))", opacity: 0.6 }}>
                      Jeux <span className="ml-auto text-xs">Bientôt</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Media Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="transition-all duration-300 font-medium relative group flex items-center"
                style={{ color: "hsl(var(--nav-text))" }}
              >
                Médias
                <ChevronDown className="w-4 h-4 ml-1" />
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                ></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                style={{ backgroundColor: "hsl(var(--nav-dropdown-bg))", borderColor: "hsl(var(--nav-border))" }}
              >
                <DropdownMenuItem asChild>
                  <Link href="/tv-channels" style={{ color: "hsl(var(--nav-text))" }}>
                    Chaînes TV
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="https://livewatch.sbs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    Live Watch
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      🔥​HOT
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="https://sports-stream.sbs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    Sports Stream
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      🔥​HOT
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/radio" style={{ color: "hsl(var(--nav-text))" }}>
                    Radio FM
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/retrogaming" style={{ color: "hsl(var(--nav-text))" }}>
                    Retrogaming
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/discover/playlists" style={{ color: "hsl(var(--nav-text))" }}>
                    Découvrir des Playlists
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: "hsl(var(--nav-border))" }} />
                <DropdownMenuItem asChild>
                  <Link
                    href="/watch-party"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    Soiree Cine
                    <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                      NEW
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/interactive"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    WaveWatch World
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      ⭐NEW
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="https://apis.wavewatch.xyz/cinematch.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    CineMatch
                    <Badge className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">⭐HOT</Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="https://apis.wavewatch.xyz/cinequiz.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "hsl(var(--nav-text))" }}
                    className="flex items-center justify-between"
                  >
                    CineQuiz
                    <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">⭐NEW</Badge>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: "hsl(var(--nav-text-secondary))" }}
              />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-full h-10 md:h-12 transition-colors"
                style={{
                  backgroundColor: "hsl(var(--nav-hover))",
                  borderColor: "hsl(var(--nav-border))",
                  color: "hsl(var(--nav-text))",
                }}
              />
            </div>
          </form>

          {/* User Menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 transition-colors"
                  style={{ borderColor: "hsl(var(--nav-border))" }}
                >
                  <Palette className="w-4 h-4 md:w-5 md:h-5" style={{ color: "hsl(var(--nav-text))" }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 max-h-[500px] overflow-y-auto"
                style={{ backgroundColor: "hsl(var(--nav-dropdown-bg))", borderColor: "hsl(var(--nav-border))" }}
              >
                <DropdownMenuLabel style={{ color: "hsl(var(--nav-text))" }}>Thèmes Standard</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-2 p-2">
                  {freeThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors ${
                        theme === t.id ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.gradient}`} />
                      <span className="text-sm" style={{ color: "hsl(var(--nav-text))" }}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>

                <DropdownMenuSeparator style={{ backgroundColor: "hsl(var(--nav-border))" }} />

                <DropdownMenuLabel style={{ color: "hsl(var(--nav-text))" }}>Thèmes Limités</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-2 p-2">
                  {limitedThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors relative ${
                        theme === t.id ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.gradient}`} />
                      <span className="text-sm" style={{ color: "hsl(var(--nav-text))" }}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>

                {user && (
                  <>
                    <DropdownMenuSeparator style={{ backgroundColor: "hsl(var(--nav-border))" }} />

                    <DropdownMenuLabel style={{ color: "hsl(var(--nav-text))" }}>
                      Thèmes Premium
                      {!user.isVip && !user.isVipPlus && !user.isAdmin && (
                        <Crown className="w-4 h-4 inline ml-2 text-yellow-400" />
                      )}
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {premiumThemes.map((t) => {
                        const isLocked =
                          (t.requiresVipPlus && !user.isVipPlus && !user.isAdmin) ||
                          (t.requiresVip && !user.isVip && !user.isVipPlus && !user.isAdmin)

                        return (
                          <button
                            key={t.id}
                            onClick={() => handleThemeChange(t.id, t.requiresVip, t.requiresVipPlus)}
                            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors relative ${
                              theme === t.id ? "ring-2 ring-blue-500" : ""
                            } ${isLocked ? "opacity-60" : ""}`}
                          >
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.gradient}`} />
                            <span className="text-sm" style={{ color: "hsl(var(--nav-text))" }}>
                              {t.name}
                            </span>
                            {isLocked && (
                              <Crown className="w-3 h-3 absolute top-1 right-1 text-yellow-400 drop-shadow-glow" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 md:h-12 md:w-12 rounded-full border-2 transition-colors"
                    style={{ borderColor: "hsl(var(--nav-border))" }}
                  >
                    <User className="w-4 h-4 md:w-5 md:h-5" style={{ color: "hsl(var(--nav-text))" }} />
                    {user.isVip && (
                      <Crown className="w-3 h-3 md:w-4 md:h-4 absolute -top-1 -right-1 text-yellow-400 drop-shadow-glow" />
                    )}
                    {user.isVipPlus && (
                      <Crown className="w-3 h-3 md:w-4 md:h-4 absolute -top-1 -right-1 text-purple-400 drop-shadow-glow" />
                    )}
                    {user.isAdmin && <Shield className="w-2 h-2 md:w-3 md:h-3 absolute top-0 left-0 text-red-400" />}
                    {unreadCount > 0 && (
                      <Badge
                        className="absolute -bottom-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2"
                        style={{ borderColor: "hsl(var(--nav-bg))" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  style={{ backgroundColor: "hsl(var(--nav-dropdown-bg))", borderColor: "hsl(var(--nav-border))" }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(var(--nav-border))" }}>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--nav-text))" }}>
                      {user.username || "Utilisateur"}
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--nav-text-secondary))" }}>
                      {user.isAdmin
                        ? "Administrateur"
                        : user.isUploader
                          ? "Uploader"
                          : user.isVipPlus
                            ? "Membre VIP Plus"
                            : user.isVip
                              ? "Membre VIP"
                              : "Membre Standard"}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" style={{ color: "hsl(var(--nav-text))" }}>
                      Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" style={{ color: "hsl(var(--nav-text))" }}>
                      Mes favoris
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" style={{ color: "hsl(var(--nav-text))" }}>
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {!user.isVip && (
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="text-yellow-400 hover:text-yellow-300">
                        <Crown className="w-4 h-4 mr-2" />
                        Devenir VIP
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.isAdmin || user.isUploader) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="text-red-400 hover:text-red-300">
                        <Shield className="w-4 h-4 mr-2" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} style={{ color: "hsl(var(--nav-text))" }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" asChild style={{ color: "hsl(var(--nav-text))" }}>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button
                  asChild
                  className="px-4 md:px-6"
                  style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  <Link href="/register">Inscription</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-12 md:w-12 lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: "hsl(var(--nav-text))" }}
            >
              {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden overflow-y-auto"
          style={{ backgroundColor: "hsl(var(--nav-bg) / 0.98)" }}
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center group">
                <div className="relative h-10 w-auto sm:h-12 transition-transform group-hover:scale-105">
                  <img
                    src="/images/design-mode/wwlogo2026.png"
                    alt="WaveWatch"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6" style={{ color: "hsl(var(--nav-text))" }} />
              </Button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: "hsl(var(--nav-text-secondary))" }}
                />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: "hsl(var(--nav-hover))",
                    borderColor: "hsl(var(--nav-border))",
                    color: "hsl(var(--nav-text))",
                  }}
                />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <div className="space-y-6">
              {!user ? (
                <div className="flex flex-col space-y-2">
                  <Button
                    asChild
                    className="w-full"
                    style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Connexion
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full bg-transparent"
                    style={{
                      borderColor: "hsl(var(--nav-border))",
                      color: "hsl(var(--nav-text))",
                      backgroundColor: "transparent",
                    }}
                  >
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Inscription
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="relative h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "hsl(var(--nav-hover))" }}
                    >
                      <User className="w-5 h-5" style={{ color: "hsl(var(--nav-text))" }} />
                      {user.isVip && <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />}
                      {user.isVipPlus && <Crown className="w-3 h-3 absolute -top-1 -right-1 text-purple-400" />}
                      {user.isAdmin && <Shield className="w-3 h-3 absolute top-0 left-0 text-red-400" />}
                      {unreadCount > 0 && (
                        <Badge className="absolute -bottom-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "hsl(var(--nav-text))" }}>
                        {user.username || "Utilisateur"}
                      </p>
                      <p className="text-xs" style={{ color: "hsl(var(--nav-text-secondary))" }}>
                        {user.isAdmin
                          ? "Administrateur"
                          : user.isUploader
                            ? "Uploader"
                            : user.isVipPlus
                              ? "Membre VIP Plus"
                              : user.isVip
                                ? "Membre VIP"
                                : "Membre Standard"}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" className="justify-start" style={{ color: "hsl(var(--nav-text))" }}>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      Tableau de bord
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start" style={{ color: "hsl(var(--nav-text))" }}>
                    <Link href="/favorites" onClick={() => setIsMenuOpen(false)}>
                      Mes favoris
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start" style={{ color: "hsl(var(--nav-text))" }}>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      Profil
                    </Link>
                  </Button>
                  {!user.isVip && (
                    <Button asChild variant="ghost" className="justify-start text-yellow-400 hover:text-yellow-300">
                      <Link href="/subscription" onClick={() => setIsMenuOpen(false)}>
                        <Crown className="w-4 h-4 mr-2" />
                        Devenir VIP
                      </Link>
                    </Button>
                  )}
                  {(user.isAdmin || user.isUploader) && (
                    <Button asChild variant="ghost" className="justify-start text-red-400 hover:text-red-300">
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Administration
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={handleSignOut}
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t" style={{ borderColor: "hsl(var(--nav-border))" }}>
                <h3 className="text-lg font-medium mb-3" style={{ color: "hsl(var(--nav-text))" }}>
                  Contenu
                </h3>
                <div className="space-y-1">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/movies" onClick={() => setIsMenuOpen(false)}>
                      Films
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/tv-shows" onClick={() => setIsMenuOpen(false)}>
                      Séries
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/anime" onClick={() => setIsMenuOpen(false)}>
                      Animés
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/collections" onClick={() => setIsMenuOpen(false)}>
                      Collections
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="/ebooks"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      Ebooks
                      <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        NEW
                      </Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/logiciels" onClick={() => setIsMenuOpen(false)}>
                      Logiciels
                      <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        NEW
                      </Badge>
                    </Link>
                  </Button>
                  {user?.isAdmin ? (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                        style={{ color: "hsl(var(--nav-text))" }}
                      >
                        <Link href="/musique" onClick={() => setIsMenuOpen(false)}>
                          Musiques
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                        style={{ color: "hsl(var(--nav-text))" }}
                      >
                        <Link href="/jeux" onClick={() => setIsMenuOpen(false)}>
                          Jeux
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        disabled
                        className="w-full justify-start opacity-60 cursor-not-allowed"
                        style={{ color: "hsl(var(--nav-text-secondary))" }}
                      >
                        Musiques <span className="ml-auto text-xs">Bientôt</span>
                      </Button>
                      <Button
                        variant="ghost"
                        disabled
                        className="w-full justify-start opacity-60 cursor-not-allowed"
                        style={{ color: "hsl(var(--nav-text-secondary))" }}
                      >
                        Jeux <span className="ml-auto text-xs">Bientôt</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: "hsl(var(--nav-border))" }}>
                <h3 className="text-lg font-medium mb-3" style={{ color: "hsl(var(--nav-text))" }}>
                  Médias
                </h3>
                <div className="space-y-1">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/tv-channels" onClick={() => setIsMenuOpen(false)}>
                      Chaînes TV
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="https://livewatch.sbs/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      Live Watch
                      <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        🔥​HOT
                      </Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="https://sports-stream.sbs/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      Sports Stream
                      <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        🔥​HOT
                      </Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/radio" onClick={() => setIsMenuOpen(false)}>
                      Radio FM
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/retrogaming" onClick={() => setIsMenuOpen(false)}>
                      Retrogaming
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link href="/discover/playlists" onClick={() => setIsMenuOpen(false)}>
                      Playlists Public
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="/watch-party"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      Soiree Cine
                      <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                        NEW
                      </Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="/interactive"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      WaveWatch World
                      <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        ⭐​​NEW
                      </Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="https://apis.wavewatch.xyz/cinematch.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      Cinematch
                      <Badge className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">HOT</Badge>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    style={{ color: "hsl(var(--nav-text))" }}
                  >
                    <Link
                      href="https://apis.wavewatch.xyz/cinequiz.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between"
                    >
                      CineQuiz
                      <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">NEW</Badge>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
