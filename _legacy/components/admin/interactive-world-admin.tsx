"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorldSettingsPanel } from "./world-settings-panel"
import { CinemaRoomsPanel } from "./cinema-rooms-panel"
import { CustomizationOptionsPanel } from "./customization-options-panel"
import { OnlineUsersPanel } from "./online-users-panel"
import { ArcadeGamesPanel } from "./arcade-games-panel"
import { StadiumSettingsPanel } from "./stadium-settings-panel"
import { DiscoSettingsPanel } from "./disco-settings-panel"
import { VisitStatisticsPanel } from "./visit-statistics-panel"
import { Globe, Film, Palette, Users, Gamepad2, Trophy, Music, BarChart3 } from "lucide-react"

interface InteractiveWorldAdminProps {
  initialSettings: any[]
  initialRooms: any[]
  initialSessions: any[]
  initialOptions: any[]
  initialOnlineUsers: any[]
  initialArcadeGames?: any[]
}

export function InteractiveWorldAdmin({
  initialSettings,
  initialRooms,
  initialSessions,
  initialOptions,
  initialOnlineUsers,
  initialArcadeGames = [],
}: InteractiveWorldAdminProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Gestion du Monde Interactif</h1>
          <p className="text-gray-400">
            Gérez tous les aspects de WaveWatch World: paramètres, salles de cinéma, personnalisation et utilisateurs en
            ligne
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full bg-gray-800 border-gray-700 flex-nowrap">
              <TabsTrigger
                value="settings"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Paramètres du Monde</span>
                <span className="sm:hidden">Monde</span>
              </TabsTrigger>
              <TabsTrigger
                value="cinema"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Film className="w-4 h-4" />
                <span className="hidden sm:inline">Salles de Cinéma</span>
                <span className="sm:hidden">Cinéma</span>
              </TabsTrigger>
              <TabsTrigger
                value="customization"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Personnalisation</span>
                <span className="sm:hidden">Avatars</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Utilisateurs En Ligne</span>
                <span className="sm:hidden">En Ligne</span>
              </TabsTrigger>
              <TabsTrigger
                value="arcade"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">Jeux Arcade</span>
                <span className="sm:hidden">Arcade</span>
              </TabsTrigger>
              <TabsTrigger
                value="stadium"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Stade</span>
                <span className="sm:hidden">Stade</span>
              </TabsTrigger>
              <TabsTrigger
                value="disco"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Discothèque</span>
                <span className="sm:hidden">Disco</span>
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="flex items-center justify-center gap-1 data-[state=active]:bg-gray-700 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Statistiques</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="settings">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Paramètres du Monde</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez l'apparence, la capacité et les fonctionnalités du monde interactif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorldSettingsPanel settings={initialSettings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cinema">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Salles de Cinéma</CardTitle>
                <CardDescription className="text-gray-400">
                  Créez et gérez les salles de cinéma avec horaires, films et capacités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CinemaRoomsPanel rooms={initialRooms} sessions={initialSessions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customization">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Options de Personnalisation</CardTitle>
                <CardDescription className="text-gray-400">
                  Gérez les coiffures, couleurs, vêtements et accessoires (VIP, VIP+, Admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomizationOptionsPanel options={initialOptions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Utilisateurs En Ligne</CardTitle>
                <CardDescription className="text-gray-400">
                  Surveillez les utilisateurs connectés au monde interactif en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OnlineUsersPanel users={initialOnlineUsers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arcade">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Jeux Arcade</CardTitle>
                <CardDescription className="text-gray-400">
                  Gérez les jeux disponibles dans la salle d'arcade du monde virtuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArcadeGamesPanel games={initialArcadeGames} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stadium">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Paramètres du Stade</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez la vidéo, les horaires et l'accès au stade du monde virtuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StadiumSettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disco">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Paramètres de la Discothèque</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez la musique, les streams audio et l'ambiance de la discothèque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiscoSettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Statistiques de Visites</CardTitle>
                <CardDescription className="text-gray-400">
                  Suivez le nombre de connexions au monde interactif par utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VisitStatisticsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
