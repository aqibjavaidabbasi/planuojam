'use client'
import dynamic from "next/dynamic";
const MapboxMap = dynamic(()=>import("@/components/global/MapboxMap"),{ssr:false})
import { Location } from '@/components/global/MapboxMap'
import { fetchListings } from '@/services/common'
import { createLocationFromListing } from '@/utils/locationFactory'
import React, { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

function ClientMapWrapper() {
  const t = useTranslations('Map')
  const locale = useLocale();
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

        // Process all listings using the factory
        const allListings = [...vendors, ...venues]
        const allLocations: Location[] = []

        for (const listing of allListings) {
          const locations = createLocationFromListing({ listing, locale })
          allLocations.push(...locations)
        }

        // Remove duplicates by ID
        const uniqueLocations = allLocations.filter(
          (location, index, self) =>
            index === self.findIndex(l => l.id === location.id)
        )

        setLocations(uniqueLocations)
      } catch (err) {
        setError(t('errors.failedToLoadLocations'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessLocations()
  }, [t, locale])


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
    <div className='w-screen h-screen max-h-[850px]' style={{ contain: 'layout paint size' }}>
          <MapboxMap locations={locations} />
    </div>
  )
}

export default ClientMapWrapper