import { Suspense } from "react"
import { Hero } from "@/components/hero"
import { TrendingMovies } from "@/components/trending-movies"
import { TrendingTVShows } from "@/components/trending-tv-shows"
import { PopularAnime } from "@/components/popular-anime"
import { TrendingActors } from "@/components/trending-actors"
import { TrendingTVChannels } from "@/components/trending-tv-channels"
import { SportsStreamPromo } from "@/components/sports-stream-promo"
import { LiveWatchPromo } from "@/components/livewatch-promo"
import { CalendarWidget } from "@/components/calendar-widget"
import { FootballCalendarWidget } from "@/components/football-calendar-widget"
import { RandomContent } from "@/components/random-content"
import { SubscriptionOffer } from "@/components/subscription-offer"
import { PublicPlaylistsRow } from "@/components/public-playlists-row"
import { PopularCollections } from "@/components/popular-collections"
import { supabase } from "@/lib/supabase"
import { InteractiveWorldPromoWrapper } from "@/components/interactive-world-promo-wrapper"

export const dynamic = "force-dynamic"

function LoadingSection() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

async function getHomeModulesSettings() {
  try {
    console.log("[v0] Loading home modules settings from database...")
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "home_modules")
      .single()

    if (error || !data) {
      console.log("[v0] No settings found, using defaults")
      // Return default settings if not found
      return {
        hero: true,
        trending_movies: true,
        trending_tv_shows: true,
        popular_anime: true,
        popular_collections: true,
        public_playlists: true,
        trending_actors: true,
        trending_tv_channels: true,
        subscription_offer: true,
        random_content: true,
        football_calendar: false,
        calendar_widget: true,
      }
    }

    console.log("[v0] Loaded modules settings:", data.setting_value)
    return data.setting_value
  } catch (error) {
    console.error("Error loading home modules settings:", error)
    // Return default settings on error
    return {
      hero: true,
      trending_movies: true,
      trending_tv_shows: true,
      popular_anime: true,
      popular_collections: true,
      public_playlists: true,
      trending_actors: true,
      trending_tv_channels: true,
      subscription_offer: true,
      random_content: true,
      football_calendar: false,
      calendar_widget: true,
    }
  }
}

export default async function HomePage() {
  const modules = await getHomeModulesSettings()

  return (
    <div className="space-y-8">
      {modules.hero && <Hero />}
      <div className="container mx-auto px-4 space-y-12">
        {modules.trending_movies && (
          <Suspense fallback={<LoadingSection />}>
            <TrendingMovies />
          </Suspense>
        )}
        {modules.trending_tv_shows && (
          <Suspense fallback={<LoadingSection />}>
            <TrendingTVShows />
          </Suspense>
        )}
        {modules.popular_anime && (
          <Suspense fallback={<LoadingSection />}>
            <PopularAnime />
          </Suspense>
        )}
        {modules.popular_collections && (
          <Suspense fallback={<LoadingSection />}>
            <PopularCollections />
          </Suspense>
        )}
        {modules.public_playlists && (
          <Suspense fallback={<LoadingSection />}>
            <PublicPlaylistsRow />
          </Suspense>
        )}
        {modules.trending_actors && (
          <Suspense fallback={<LoadingSection />}>
            <TrendingActors />
          </Suspense>
        )}
        {modules.trending_tv_channels && (
          <Suspense fallback={<LoadingSection />}>
            <TrendingTVChannels />
          </Suspense>
        )}
        <Suspense fallback={<LoadingSection />}>
          <InteractiveWorldPromoWrapper />
        </Suspense>
        <LiveWatchPromo />
        <SportsStreamPromo />
        {modules.subscription_offer && <SubscriptionOffer />}
        {modules.random_content && (
          <Suspense fallback={<LoadingSection />}>
            <RandomContent />
          </Suspense>
        )}
        {modules.football_calendar && (
          <Suspense fallback={<LoadingSection />}>
            <FootballCalendarWidget />
          </Suspense>
        )}
        {modules.calendar_widget && (
          <Suspense fallback={<LoadingSection />}>
            <CalendarWidget />
          </Suspense>
        )}
      </div>
    </div>
  )
}
