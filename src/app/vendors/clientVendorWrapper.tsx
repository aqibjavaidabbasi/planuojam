'use client'
import ListingCard from '@/components/Dynamic/ListingCard';
import FiltersAndMap from '@/components/global/FiltersAndMap';
import Loader from '@/components/ui/Loader';
import { fetchListings } from '@/services/common';
import { listingItem } from '@/types/pagesTypes';
import React, { useEffect, useState } from 'react'

const PricingFilters = ['With Pricing only', 'Without Pricing Only'];
const TYPE = 'vendor'


function ClientVendorWrapper({ vendorNames, eventTypeNames }:
    { vendorNames: string[], eventTypeNames: string[] }) {
    const [vendorList, setVendorList] = useState<listingItem[]>([]);
    const [loading, setLoading] = useState(false);

    const filters = [
        {
            name: 'category',
            options: vendorNames,
            placeholder: 'Choose a vendor',
        },
        {
            name: 'price',
            options: PricingFilters,
            placeholder: 'Select pricing',
        },
        {
            name: 'eventType',
            options: eventTypeNames,
            placeholder: 'Pick event type',
        },
    ]

    useEffect(function () {
        setLoading(true);
        async function fetchItems() {
            try {
                const res = await fetchListings(TYPE);
                setVendorList(res);
            } catch (err) {
                console.log(err);
            }
            setLoading(false);
        }
        fetchItems();
    }, []);

    if (loading) return <div>
        <Loader />
    </div>

    console.log("vendors", vendorList)


    return (
        <div>
            <FiltersAndMap filters={filters} type={TYPE} setList={setVendorList} />
            <div className='flex items-center gap-5 my-10 flex-wrap'>
                {vendorList.length === 0 ? (
                    <div className="w-full flex justify-center items-center py-10">
                        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500 text-lg font-medium shadow">
                            No vendors found matching your criteria.
                        </div>
                    </div>
                ) : (
                    vendorList.map(vendor => (
                        <ListingCard key={vendor.documentId} item={vendor} />
                    ))
                )}
            </div>
        </div>
    )
}

export default ClientVendorWrapper