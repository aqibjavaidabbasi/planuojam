'use client'
import { EventTypesBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../custom/heading';
import { getCompleteImageUrl } from '@/utils/helpers';
import NoDataCard from '../custom/NoDataCard';
import { useRouter } from '@/i18n/navigation';

function EventTypesList({ data }: { data: EventTypesBlock }) {

    const router = useRouter();
    const uniqueEventTypeItems = data.eventTypeItem.filter(
        (item, index, self) =>
            index === self.findIndex((t) => t.eventType.documentId === item.eventType.documentId)
    );

    return (
        <div className='w-screen max-w-screen lg:max-w-[1700px] mx-auto py-5 md:py-10 px-3 md:px-6'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.sectionheader.heading.headingPiece} />
                <p className='text-center max-w-prose'>{data.sectionheader.sectionDescription}</p>
            </div>
            <div className="w-full flex justify-center mt-10">
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {uniqueEventTypeItems.length > 0
                        ? uniqueEventTypeItems.map(item => {
                            const imageUrl = item.eventType.image?.url ? getCompleteImageUrl(item.eventType.image.url) : '/placeholder';
                            return (
                                <div
                                    key={item.id}
                                    onClick={()=>router.push(`/service/venue?eventType=${item.eventType.eventName}`)}
                                    className={`md:w-[300px] h-52 md:h-64 lg:h-72 rounded-lg flex p-4 overflow-hidden relative transition-all duration-300 ease-in hover:scale-105 cursor-pointer ${item.contentPlacement === 'center'
                                        ? 'items-center justify-center'
                                        : item.contentPlacement === 'top-left'
                                            ? 'items-start justify-start'
                                            : item.contentPlacement === 'top-right'
                                                ? 'items-start justify-end'
                                                : item.contentPlacement === 'bottom-left'
                                                    ? 'items-end justify-start'
                                                    : item.contentPlacement === 'bottom-right'
                                                        ? 'items-end justify-end'
                                                        : ''
                                        }`}
                                    style={{
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-black/10 z-0"></div>
                                    <h4 className="text-white text-lg md:text-xl lg:text-2xl font-semibold px-3 py-1 rounded z-10 relative">{item.eventType.eventName}</h4>
                                </div>
                            )
                        })
                        : <NoDataCard>No Events Found</NoDataCard>
                    }
                </div>
            </div>
        </div>
    )
}

export default EventTypesList