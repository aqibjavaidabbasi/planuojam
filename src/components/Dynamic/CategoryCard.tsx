'use client'
import { useParentCategories } from '@/context/ParentCategoriesContext'
import { useRouter } from '@/i18n/navigation'
import { category } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React from 'react'

function CategoryCard({category}: {category: category}) {
    const { getServiceCategoryByDocId } = useParentCategories();
     const imageUrl = category.image?.url ? getCompleteImageUrl(category.image.url) : '/placeholder.png'
     const router = useRouter();

     const cat = getServiceCategoryByDocId(category.parentCategory.documentId);
     function getUrlPath(){
        if(!cat) return '/';
        // Use slug instead of name for more robust URL generation
        return `/service/${encodeURIComponent(cat.slug)}?cat=${encodeURIComponent(category.slug.trim())}`;
     }
  return (
    <div
        className='flex flex-col gap-1.5 w-[300px] transition-all duration-300 ease-in hover:scale-105 cursor-pointer rounded-lg'
        style={{
        backgroundColor: '#fff',
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
    }}
    onClick={()=>router.push(getUrlPath())}
>
    <div className='relative w-[300px] h-[150px] md:h-[250px]'>
        <Image
            src={imageUrl}
            alt={`Category image for ${category.name}`}
            layout='fill'
            objectFit='cover'
        />
    </div>
    <div className='m-2.5 flex-1 overflow-hidden'>
        <h3 className='text-primary font-medium text-lg'>{category.name}</h3>
    </div>
</div>
  )
}

export default CategoryCard