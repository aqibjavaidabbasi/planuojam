import { fetchChildCategories } from '@/services/common'
import { category } from '@/types/pagesTypes';
import React from 'react'
import ClientVenueWrapper from './clientVenueWrapper';

async function VenuePage() {
  const venues: category[] = await fetchChildCategories('venue');
  const venueNames: string[] = [];

  venues.map(venue => venueNames.push(venue.name));

  return (
    <div className='bg-background px-10 sm:px-20 md:px-24 lg:px-32 py-7 md:py-10'>
      <ClientVenueWrapper 
        venueNames={venueNames}
      />
    </div>
  )
}

export default VenuePage