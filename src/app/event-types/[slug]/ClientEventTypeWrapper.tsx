'use client'
import NoDataCard from '@/components/custom/NoDataCard';
import CategoryCard from '@/components/Dynamic/CategoryCard';
import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/heading';
import Loader from '@/components/ui/Loader';
import { useEventTypes } from '@/context/EventTypesContext';
import { fetchListingsPerEvents } from '@/services/common';
import { fetchPage } from '@/services/pagesApi';
import { category, DynamicBlocks, TitleDescriptionBlock } from '@/types/pagesTypes';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function ClientEventTypeWrapper({ slug }: { slug: string }) {
    const { getEventTypeBySlug } = useEventTypes();
    const eventType = getEventTypeBySlug(slug);
    const [eventBlock, setEventBlocks] = useState<DynamicBlocks[]>([]);
    const router = useRouter();
    const [categories, setCategories] = useState<category[]>([]);

    useEffect(function () {
        async function fetchPageData() {
            if (eventType && eventType.page) {
                const res = await fetchPage(eventType.page.slug);
                setEventBlocks(res.blocks);
            }
        }
        fetchPageData();
    }, [eventType])

    useEffect(function () {
        async function fetchCategories() {
            if (eventType && eventType.page) {
                const res = await fetchListingsPerEvents(eventType.eventName);

                const allCategories: category[] = res
                    .map((listing: { category: category }) => listing?.category)
                    .filter((cat: { documentId: string; }): cat is category => !!cat && !!cat.documentId);

                const uniqueCategories: category[] = Array.from(
                    new Map(allCategories.map((cat) => [cat.documentId, cat])).values()
                );
                setCategories(uniqueCategories);
            }
        }
        fetchCategories();
    }, [eventType])

    if (!eventType) return <Loader />;

    if (!eventType.page) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center border border-gray-200 flex flex-col items-center justify-center">
                <p className='p-3 rounded-md text-lg font-semibold text-red-500'>{eventType.eventName}</p>
                <p className="text-gray-700 text-lg font-medium">
                    This page has not yet been created in Strapi, or if it is created, the link to this page is missing.
                </p>
                <Button style='ghost' onClick={() => router.push('/home')} >Go to homepage</Button>
            </div>
        </div>
    )

    // derived states for better data management
    const heroBlock = eventBlock.filter(block => block.__component === 'dynamic-blocks.hero-banner');
    const faqBlock = eventBlock.filter(block => block.__component === 'dynamic-blocks.faqs');
    const restBlocks = eventBlock.filter(block =>
        ![
            'dynamic-blocks.faqs',
            'dynamic-blocks.hero-banner',
            'general.title-description'
        ].includes(block.__component)
    );
    const titleDescriptionBlocks = eventBlock.filter(
        block => block.__component === 'general.title-description'
    );
    function isVenueBlock(block: TitleDescriptionBlock) {
        return block.sectionDescription?.toLowerCase().includes('venue') ||
            block.heading?.headingPiece?.some(piece =>
                piece.text.toLowerCase().includes('venue')
            );
    }

    function isVendorBlock(block: TitleDescriptionBlock) {
        return block.sectionDescription?.toLowerCase().includes('vendor') ||
            block.heading?.headingPiece?.some(piece =>
                piece.text.toLowerCase().includes('vendor')
            );
    }

    const venueTitleBlock = titleDescriptionBlocks.find(isVenueBlock);
    const vendorTitleBlock = titleDescriptionBlocks.find(isVendorBlock);
    const vendorCategories = categories.filter(cat => cat.parentCategory.name === 'vendor');
    const venueCategories = categories.filter(cat => cat.parentCategory.name === 'venue');

    return (
        <div>
            {/* hero block on the top */}
            <DynamicZoneRenderer blocks={heroBlock} />

            {/* venue categories */}
            <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1400px]'>
                <div className='flex flex-col items-center justify-center gap-2'>
                    {venueTitleBlock?.heading?.headingPiece && (
                        <Heading headingPiece={venueTitleBlock.heading.headingPiece} />
                    )}
                    {venueTitleBlock?.sectionDescription && (
                        <p className='text-center'>{venueTitleBlock.sectionDescription}</p>
                    )}
                </div>
                <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
                    {
                        venueCategories.length > 0 ?
                            venueCategories.map(category => {
                                return (<CategoryCard key={category.documentId} category={category} />)
                            })
                            :
                            <NoDataCard>No Data Found</NoDataCard>
                    }
                </div>
            </div>
            {/* vendor categories */}
            <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1400px]'>
                <div className='flex flex-col items-center justify-center gap-2'>
                    {vendorTitleBlock?.heading?.headingPiece && (
                        <Heading headingPiece={vendorTitleBlock.heading.headingPiece} />
                    )}
                    {vendorTitleBlock?.sectionDescription && (
                        <p className='text-center'>{vendorTitleBlock.sectionDescription}</p>
                    )}
                </div>
                <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
                    {
                        vendorCategories.length > 0 ?
                            vendorCategories.map(category => {
                                return (<CategoryCard key={category.documentId} category={category} />)
                            })
                            :
                            <NoDataCard>No Data Found</NoDataCard>
                    }
                </div>
            </div>

            {/* rest of the other blocks in middle */}
            <DynamicZoneRenderer blocks={restBlocks} />

            {/* faq block on the end */}
            <DynamicZoneRenderer blocks={faqBlock} />
        </div>
    )
}

export default ClientEventTypeWrapper