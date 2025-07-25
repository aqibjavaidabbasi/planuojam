import { EventTypesBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../ui/heading';
import { getCompleteImageUrl } from '@/utils/helpers';

function EventTypesList({ data }: { data: EventTypesBlock }) {

    const uniqueEventTypeItems = data.eventTypeItem.filter(
        (item, index, self) =>
            index === self.findIndex((t) => t.eventType.documentId === item.eventType.documentId)
    );

    return (
        <div className='w-screen max-w-screen lg:max-w-[1400px] py-5 md:py-10 px-3 md:px-6'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.sectionheader.heading.headingPiece} />
                <p>{data.sectionheader.sectionDescription}</p>
            </div>
            <div className="w-full flex justify-center mt-10">
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {
                        uniqueEventTypeItems.length > 0 ?
                            uniqueEventTypeItems.map(item => {
                                const imageUrl = item.eventType.image?.url ? getCompleteImageUrl(item.eventType.image.url) : '/placeholder';
                                return (
                                    <div
                                        key={item.id}
                                        className={`
                               md:w-[300px] h-52 md:h-64 lg:h-72 rounded-xl flex p-4 overflow-hidden relative
                                ${item.contentPlacement === 'center'
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
                                        <h4 className="text-white text-2xl lg:text-3xl font-semibold px-3 py-1 rounded z-10 relative">{item.eventType.eventName}</h4>
                                    </div>
                                )
                            })
                            :
                            <div>No Events found!</div>}
                </div>
            </div>
        </div>
    )
}

export default EventTypesList