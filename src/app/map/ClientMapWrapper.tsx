'use client'
import Map, { Location } from '@/components/global/GoogleMap'
import { fetchListings } from '@/services/common'
import { ListingItem, Venue } from '@/types/pagesTypes'
import geocodeLocations from '@/utils/location'
import React, { useEffect, useState } from 'react'

function ClientMapWrapper() {
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
        const venueLocations = getLocationsFromVenues(venues)

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
        setError('Failed to load locations')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessLocations()
  }, [])

  // Map venues to Location[]
  function getLocationsFromVenues(venues: ListingItem[]): Location[] {
    return venues
      .map(item => {
        const venueBlock = item.listingItem?.find(
          block => block.__component === 'dynamic-blocks.venue'
        ) as Venue | undefined

        if (!venueBlock?.location) return null

        return {
          id: item.id,
          name: item.title || 'Unnamed Venue',
          description: item.description || '',
          position: {
            lat: venueBlock.location.latitude,
            lng: venueBlock.location.longitude,
          },
        }
      })
      .filter((location): location is Location => location !== null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">Loading map...</p>
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
    <div className='w-screen h-full'>
          <Map locations={locations} />
    </div>
  )
}

export default ClientMapWrapper