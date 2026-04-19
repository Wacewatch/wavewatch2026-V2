"use client"

import { PublicPlaylistsDiscovery } from "@/components/public-playlists-discovery"

export default function DiscoverPlaylistsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <PublicPlaylistsDiscovery />
      </div>
    </div>
  )
}
