import { fetchChildCategories, fetchEventTypes } from '@/services/common'
import { category, eventType } from '@/types/pagesTypes';
import React from 'react'
import ClientVenueWrapper from './clientVenueWrapper';

async function VenuePage() {
  const venues: category[] = await fetchChildCategories('venue');
  const eventTypes: eventType[] = await fetchEventTypes();
  

  const venueNames: string[] = [];
  const eventTypeNames: string[] = [];

  venues.map(venue => venueNames.push(venue.name));
  eventTypes.map(event => eventTypeNames.push(event.eventName));


  return (
    <div className='bg-normal px-10 sm:px-20 md:px-24 lg:px-32 py-7 md:py-10'>
      <ClientVenueWrapper 
        venueNames={venueNames}
        eventTypeNames={eventTypeNames}
      />
    </div>
  )
}

export default VenuePage