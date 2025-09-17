import { ImageBlocksGroupBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../custom/heading'
import Image from 'next/image'
import { getCompleteImageUrl } from '@/utils/helpers'

function CardsGroup({ data }: { data: ImageBlocksGroupBlock }) {
    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1440px] mx-auto'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.title.heading.headingPiece} />
                <p>{data.title.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
                {data.imageBlock.map(block => {
                    const imageUrl = getCompleteImageUrl(block.image.url);
                    return (
                        <div key={block.id} className='flex gap-1.5'
                            style={{
                                backgroundColor: block.backgroundColor ?? '#fff',
                                boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
                                flexDirection: block.imagePositon === 'top' ? 'column'
                                    : block.imagePositon === 'left' ? 'row' : 'row-reverse'
                            }}
                        >
                            <Image
                                src={imageUrl}
                                alt='Block image'
                                width={300}
                                height={300}
                            />
                            <div className='m-2.5'>
                                <h3 className='text-primary font-medium text-lg'>{block.heading}</h3>
                                <p className='' >{block.blockContent}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default CardsGroup