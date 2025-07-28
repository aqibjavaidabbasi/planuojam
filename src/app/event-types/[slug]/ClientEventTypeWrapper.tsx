'use client'
import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { useEventTypes } from '@/context/EventTypesContext';
import { fetchPage } from '@/services/pagesApi';
import { DynamicBlocks } from '@/types/pagesTypes';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function ClientEventTypeWrapper({slug}: {slug: string}) {
    const { getEventTypeBySlug } = useEventTypes();
    const eventType = getEventTypeBySlug(slug);
    const [eventBlock, setEventBlocks] = useState<DynamicBlocks[]>([]);
    const router = useRouter();

    useEffect(function(){
        async function fetchPageData(){
            if(eventType && eventType.page){
                const res = await fetchPage(eventType.page.slug);
                setEventBlocks(res.blocks);
            }
        }
        fetchPageData();
    },[eventType])

    if(!eventType) return <Loader />;

    if(!eventType.page) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center border border-gray-200 flex flex-col items-center justify-center">
                <p className='p-3 rounded-md text-lg font-semibold text-red-500'>{eventType.eventName}</p>
                <p className="text-gray-700 text-lg font-medium">
                    This page has not yet been created in Strapi, or if it is created, the link to this page is missing.
                </p>
                <Button style='ghost' onClick={()=>router.push('/home')} >Go to homepage</Button>
            </div>
        </div>
    )

    const heroBlock = eventBlock.filter(block=>block.__component === 'dynamic-blocks.hero-banner');
    const faqBlock = eventBlock.filter(block=>block.__component === 'dynamic-blocks.faqs');
    const restBlocks = eventBlock.filter(block=>(block.__component !== 'dynamic-blocks.faqs' && block.__component !== 'dynamic-blocks.hero-banner'));

    console.log(restBlocks);

  return (
    <div>
        {/* hero block on the top */}
        <DynamicZoneRenderer blocks={heroBlock} />

            {/* venue and vendor categories here */}

        {/* rest of the other blocks in middle */}
        <DynamicZoneRenderer blocks={restBlocks} />

        {/* faq block on the end */}
        <DynamicZoneRenderer blocks={faqBlock} />
    </div>
  )
}

export default ClientEventTypeWrapper