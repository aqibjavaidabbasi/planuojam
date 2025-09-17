'use client'
import MapboxMap, { Location } from '@/components/global/MapboxMap'
import { fetchListings } from '@/services/common'
import { ListingItem, Venue } from '@/types/pagesTypes'
import geocodeLocations from '@/utils/mapboxLocation'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

function ClientMapWrapper() {
  const t = useTranslations('Map')
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch vendors and venues, then process into locations
  useEffect(() => {
    async function fetchAndProcessLocations() {
      setLoading(true)
      try {
        // Fetch vendors and venues concurrently
        const [vendors, venues] = await Promise.all([
          fetchListings('vendor'),
          fetchListings('venue'),
        ])

        // Process vendors and venues into locations
        const vendorLocations = await geocodeLocations(vendors)
        const venueLocations = getLocationsFromVenues(venues, t)

        // Combine locations, ensuring unique IDs
        const combinedLocations = [
          ...vendorLocations,
          ...venueLocations,
        ].filter(
          (location, index, self) =>
            index === self.findIndex(l => l.id === location.id)
        )

        setLocations(combinedLocations)
      } catch (err) {
        setError(t('errors.failedToLoadLocations'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessLocations()
  }, [t])

  // Map venues to Location[]
function getLocationsFromVenues(venues: ListingItem[], t?: ReturnType<typeof useTranslations>): Location[] {
  return venues
    .map(item => {
      const venueBlock = item.listingItem?.find(
        block => block.__component === 'dynamic-blocks.venue'
      ) as Venue | undefined;

      if (!venueBlock?.location) return null;

      return {
        id: item.id,
        name: item.title || t?.('fallback.unnamedVenue') || 'Unnamed Venue',
        username: item.user?.username || t?.('fallback.unknownUser') || 'Unknown',
        description: item.description || '',
        category: {
          name: item.category?.name || t?.('fallback.uncategorized') || 'Uncategorized',
          type: 'venue' as const,
        },
        position: {
          lat: venueBlock.location.latitude,
          lng: venueBlock.location.longitude,
        },
        address: venueBlock.location.address || t?.('fallback.noAddress') || 'No address provided',
      };
    })

    .filter(
      (location): location is {
        id: number;
        name: string;
        username: string;
        description: string;
        category: { name: string; type: "venue" };
        position: { lat: number; lng: number };
        address: string;
      } => location !== null
    );
}

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">{t('loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">{error}</p>
      </div>
    )
  }

  return (
    <div className='w-screen h-[calc(100vh-100px)] md:h-[calc(100vh-460px)]'>
          <MapboxMap locations={locations} />
    </div>
  )
}

export default ClientMapWrapper