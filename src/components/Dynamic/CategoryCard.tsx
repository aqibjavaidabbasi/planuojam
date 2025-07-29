import { category } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React from 'react'

function CategoryCard({category}: {category: category}) {
     const imageUrl = category.image?.url ? getCompleteImageUrl(category.image.url) : '/placeholder.png'
  return (
    <div
        className='flex flex-col gap-1.5 w-[300px]'
        style={{
        backgroundColor: '#fff',
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
    }}
>
    <div className='relative w-[300px] h-[250px]'>
        <Image
            src={imageUrl}
            alt={`Category image for ${category.name}`}
            layout='fill'
            objectFit='cover'
        />
    </div>
    <div className='m-2.5 flex-1 overflow-hidden'>
        <h3 className='text-primary font-medium text-lg truncate'>{category.name}</h3>
    </div>
</div>
  )
}

export default CategoryCard