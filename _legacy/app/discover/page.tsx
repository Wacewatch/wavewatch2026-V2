"use client"

import { PublicPlaylistsDiscovery } from "@/components/public-playlists-discovery"

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <PublicPlaylistsDiscovery />
      </div>
    </div>
  )
}
