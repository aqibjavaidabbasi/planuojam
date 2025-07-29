import { fetchChildCategories } from '@/services/common';
import { category } from '@/types/pagesTypes';
import React from 'react'
import ClientVendorWrapper from './clientVendorWrapper';

async function VendorPage() {
  const vendors: category[] = await fetchChildCategories('vendor');
  const vendorNames: string[] = [];
  vendors.map(vendor => vendorNames.push(vendor.name));

  return (
    <div className='bg-normal px-10 sm:px-20 md:px-24 lg:px-32 py-7 md:py-10'>
      <ClientVendorWrapper
        vendorNames={vendorNames}
      />
    </div>
  )
}

export default VendorPage