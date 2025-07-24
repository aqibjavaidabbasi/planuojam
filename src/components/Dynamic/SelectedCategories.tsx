import { SelectedCategoriesList } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers';
import Image from 'next/image';
import React from 'react'
import Heading from '../ui/heading';

function SelectedCategories({ data }: { data: SelectedCategoriesList }) {
    console.log(data)
    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1400px]'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.sectionTitle.heading.headingPiece} />
                <p>{data.sectionTitle.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
                {data.categoryListItem.map(item => {
                    const imageUrl = item.category.image?.url ? getCompleteImageUrl(item.category.image.url) : '/placeholder.png'
                    return (
                        <div
                            key={item.id}
                            className='flex flex-col gap-1.5 w-[300px]'
                            style={{
                                backgroundColor: '#fff',
                                boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
                            }}
                        >
                            <div className='relative w-[300px] h-[250px]'>
                                <Image
                                    src={imageUrl}
                                    alt={`Category image for ${item.category.name}`}
                                    layout='fill'
                                    objectFit='cover'
                                />
                            </div>
                            <div className='m-2.5 flex-1 overflow-hidden'>
                                <h3 className='text-primary font-medium text-lg truncate'>{item.category.name}</h3>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default SelectedCategories