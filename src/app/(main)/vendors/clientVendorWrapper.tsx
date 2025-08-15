'use client'
import NoDataCard from '@/components/custom/NoDataCard';
import ListingCard from '@/components/Dynamic/ListingCard';
import FiltersAndMap from '@/components/global/FiltersAndMap';
import Loader from '@/components/custom/Loader';
import { useEventTypes } from '@/context/EventTypesContext';
import { fetchListings } from '@/services/common';
import { ListingItem } from '@/types/pagesTypes';
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import geocodeLocations from '@/utils/mapboxLocation';
import { Location } from '@/components/global/MapboxMap';

const PricingFilters = ['With Pricing only', 'Without Pricing Only'];
const TYPE = 'vendor'


function ClientVendorWrapper({ vendorNames }: { vendorNames: string[] }) {
    const [vendorList, setVendorList] = useState<ListingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { eventTypes } = useEventTypes();
    const eventTypeNames: string[] = [];
    eventTypes.map(event => eventTypeNames.push(event.eventName));
    const searchParams = useSearchParams();
    const categoryFromUrl = searchParams.get('cat');
    const eventTypeFromUrl = searchParams.get('eventType');
    const [locations,setLocations] = useState<Location[]>();

    useEffect(function(){
        async function fetchLocations() {
            const res = await geocodeLocations(vendorList);
            setLocations(res as unknown as Location[]);
        }
        fetchLocations();
    },[vendorList])
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

    const initialFilters = useMemo(() => {
        const obj: Record<string, string> = {};
        if (categoryFromUrl) obj.category = categoryFromUrl;
        if (eventTypeFromUrl) obj.eventType = eventTypeFromUrl;
        return obj;
    }, [categoryFromUrl, eventTypeFromUrl]);


    useEffect(function () {
        setLoading(true);
        const filtersObj = {};
        async function fetchItems() {
            if (categoryFromUrl) {
                (filtersObj as Record<string, unknown>).category = {
                    name: {
                        $eq: categoryFromUrl,
                    },
                };
            }
            if (eventTypeFromUrl) {
                (filtersObj as Record<string, unknown>).eventTypes = {
                    eventName: {
                        $eq: eventTypeFromUrl,
                    },
                };
            }
            try {
                const res = await fetchListings(TYPE, filtersObj);
                setVendorList(res);
            } catch (err) {
                console.log(err);
            }
            setLoading(false);
        }
        fetchItems();
    }, [categoryFromUrl, eventTypeFromUrl]);

    if (loading) return <div>
        <Loader />
    </div>;


    return (
        <div>
            <FiltersAndMap 
                filters={filters} 
                type={TYPE} 
                setList={setVendorList}
                initialFilterValues={initialFilters}
                locations={locations ?? []}
            />
            <div className='flex items-center gap-5 my-10 flex-wrap'>
                {vendorList.length === 0 ? (
                    <NoDataCard>No Vendors Found</NoDataCard>
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