import { topListingItemsBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../custom/heading';
import ListingCard from './ListingCard';

function TopListingItem({ data }: { data: topListingItemsBlock }) {
    if (!data || !data.topListings || !data.topListings.listings) {
        return null;
    }

    const listings = data.topListings.listings;

    const seenDocumentIds = new Set<string>();
    const filteredListings = listings.filter(item => {
        const isTypeMatch = item.type === data.listingType;
        const docId = item.documentId;
        if (!isTypeMatch || !docId) return false;
        if (seenDocumentIds.has(docId)) return false;
        seenDocumentIds.add(docId);
        return true;
    });

    if (filteredListings.length === 0) return null;

    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1700px] mx-auto'>
            <div className='mb-5 flex w-full flex-col items-center justify-center'>
                <Heading headingPiece={data.sectionheader.heading.headingPiece} />
                <p className='text-center max-w-prose'>{data.sectionheader.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center'>
                <div className='grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),340px))] justify-center gap-6 lg:gap-8 w-full'>
                    {filteredListings.map(item => (
                        <ListingCard key={item.documentId} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TopListingItem
