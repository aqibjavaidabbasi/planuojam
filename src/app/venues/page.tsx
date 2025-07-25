import FiltersAndMap from '@/components/global/FiltersAndMap'
import { fetchChildCategories, fetchEventTypes } from '@/services/common'
import { category, eventType } from '@/types/pagesTypes';
import React from 'react'

const PricingFiltes = ['With Pricing only', 'Without Pricing Only'];

async function VenuePage() {
  const venues: category[] = await fetchChildCategories('venue');
  const eventTypes: eventType[] = await fetchEventTypes();

  const venueNames: string[] = [];
  const eventTypeNames: string[] = [];

  venues.map(venue => venueNames.push(venue.name));
  eventTypes.map(event => eventTypeNames.push(event.eventName));

  
const filters = [
  {
    name: 'venue',
    options: venueNames,
    placeholder: 'Choose a venue',
  },
  {
    name: 'pricing',
    options: PricingFiltes,
    placeholder: 'Select pricing',
  },
  {
    name: 'event',
    options: eventTypeNames,
    placeholder: 'Pick event type',
  },
]

  return (
    <div className='bg-normal px-32 py-10'>
      <FiltersAndMap
        filters={filters}
      />
    </div>
  )
}

export default VenuePage