import { BlockGroupsBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../custom/heading'
import { getCompleteImageUrl } from '@/utils/helpers'

function BackgroundImageBlock({data} : {data: BlockGroupsBlock}) {
  return (
    <div className='w-full max-w-[1400px] mx-auto py-5 md:py-10 px-3 md:px-6'>
        <div className='flex flex-col items-center justify-center gap-2'>
            <Heading headingPiece={data.title.heading.headingPiece} />
            <p>{data.title.sectionDescription}</p>
        </div>
        <div className="w-full flex justify-center mt-10">
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                {data.block.map(imgBlock=>{
                    const imageUrl = getCompleteImageUrl(imgBlock.backgroundImage.url)
                    return (
                        <div
                            key={imgBlock.id}
                            className={`
                               md:w-[300px] h-52 md:h-64 lg:h-72 rounded-xl flex p-4 overflow-hidden relative
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
                            <h4 className="text-white text-2xl lg:text-3xl font-semibold px-3 py-1 rounded z-10 relative">{imgBlock.blockTitle}</h4>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  )
}

export default BackgroundImageBlock