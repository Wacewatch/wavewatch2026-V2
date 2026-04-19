"use client"
import Image from "next/image"

interface WatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

interface WatchProvidersProps {
  providers?: {
    results?: {
      FR?: {
        flatrate?: WatchProvider[]
        buy?: WatchProvider[]
        rent?: WatchProvider[]
      }
      US?: {
        flatrate?: WatchProvider[]
        buy?: WatchProvider[]
        rent?: WatchProvider[]
      }
    }
  }
}

export function WatchProviders({ providers }: WatchProvidersProps) {
  // Try FR first, then US as fallback
  const countryData = providers?.results?.FR || providers?.results?.US

  if (!countryData) return null

  const streamingProviders = countryData.flatrate || []
  const buyProviders = countryData.buy || []
  const rentProviders = countryData.rent || []

  const allProviders = [...streamingProviders, ...buyProviders, ...rentProviders]

  // Remove duplicates based on provider_id
  const uniqueProviders = allProviders.filter(
    (provider, index, self) => index === self.findIndex((p) => p.provider_id === provider.provider_id),
  )

  if (uniqueProviders.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {uniqueProviders.slice(0, 8).map((provider) => (
        <div
          key={provider.provider_id}
          className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0"
          title={provider.provider_name}
        >
          <Image
            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
            alt={provider.provider_name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
