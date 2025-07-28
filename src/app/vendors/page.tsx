import { fetchChildCategories, fetchEventTypes } from '@/services/common';
import { category, eventType } from '@/types/pagesTypes';
import React from 'react'
import ClientVendorWrapper from './clientVendorWrapper';

async function VendorPage() {
  const vendors: category[] = await fetchChildCategories('vendor');
  const eventTypes: eventType[] = await fetchEventTypes();

  const vendorNames: string[] = [];
  const eventTypeNames: string[] = [];

  vendors.map(vendor => vendorNames.push(vendor.name));
  eventTypes.map(event => eventTypeNames.push(event.eventName));

  return (
    <div className='bg-normal px-10 sm:px-20 md:px-24 lg:px-32 py-7 md:py-10'>
      <ClientVendorWrapper
        eventTypeNames={eventTypeNames}
        vendorNames={vendorNames}
      />
    </div>
  )
}

export default VendorPage