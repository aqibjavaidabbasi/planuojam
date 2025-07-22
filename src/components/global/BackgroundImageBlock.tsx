import { BlockGroupsBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../ui/heading'
import { getCompleteImageUrl } from '@/utils/helpers'

function BackgroundImageBlock({data} : {data: BlockGroupsBlock}) {
  return (
    <div className='w-screen max-w-screen py-10 px-6'>
        <div className='flex flex-col items-center justify-center gap-2'>
            <Heading headingPiece={data.title.heading.headingPiece} title={data.title.sectionTitle} />
            <p>{data.title.sectionDescription}</p>
        </div>
        <div className="w-full flex justify-center mt-10">
            <div className='grid grid-cols-3 gap-5'>
                {data.block.map(imgBlock=>{
                    const imageUrl = getCompleteImageUrl(imgBlock.backgroundImage.url)
                    return (
                        <div
                            key={imgBlock.id}
                            className={`
                                w-[430px] h-72 rounded-xl flex p-4 overflow-hidden relative
                                ${
                                    imgBlock.contentPlacement === 'center'
                                        ? 'items-center justify-center'
                                        : imgBlock.contentPlacement === 'top-left'
                                            ? 'items-start justify-start'
                                            : imgBlock.contentPlacement === 'top-right'
                                                ? 'items-start justify-end'
                                                : imgBlock.contentPlacement === 'bottom-left'
                                                    ? 'items-end justify-start'
                                                    : imgBlock.contentPlacement === 'bottom-right'
                                                        ? 'items-end justify-end'
                                                        : ''
                                 }`}
                            style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            {/* Black overlay */}
                            <div className="absolute inset-0 bg-black/10 z-0"></div>
                            <h4 className="text-white text-3xl font-semibold px-3 py-1 rounded z-10 relative">{imgBlock.blockTitle}</h4>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  )
}

export default BackgroundImageBlock