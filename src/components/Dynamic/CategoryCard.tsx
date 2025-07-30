'use client'
import { category } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

function CategoryCard({category}: {category: category}) {
     const imageUrl = category.image?.url ? getCompleteImageUrl(category.image.url) : '/placeholder.png'
     const router = useRouter();
  return (
    <div
        className='flex flex-col gap-1.5 w-[300px] transition-all duration-300 ease-in hover:scale-105 cursor-pointer'
        style={{
        backgroundColor: '#fff',
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
    }}
    onClick={()=>router.push(`/${category.parentCategory.name}s?cat=${category.name}`)}
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