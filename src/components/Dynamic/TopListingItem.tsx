import { topListingItemsBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../ui/heading';
import ListingCard from './ListingCard';

function TopListingItem({ data }: { data: topListingItemsBlock }) {
    if (!data || !data.topListings || !data.topListings.listingsComponent) {
        return <div>No listings available.</div>;
    }

    const listings = data.topListings.listingsComponent;

    const seenDocumentIds = new Set<string>();
    const filteredListings = listings.filter(item => {
        const isTypeMatch = item.listingItem.type === data.listingType;
        const docId = item.listingItem.documentId;
        if (!isTypeMatch || !docId) return false;
        if (seenDocumentIds.has(docId)) return false;
        seenDocumentIds.add(docId);
        return true;
    });

    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6'>
            <div className='mb-5 flex w-full flex-col items-center justify-center'>
                <Heading headingPiece={data.sectionheader.heading.headingPiece} />
                <p>{data.sectionheader.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center'>
                {filteredListings.length === 0 ? (
                    <div className='flex items-center justify-center'>No {data.listingType} found.</div>
                ) : (
                    <div className='flex flex-wrap items-center justify-center gap-4'>
                        {filteredListings.map(item => (
                            <ListingCard key={item.listingItem.documentId} item={item.listingItem} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TopListingItem