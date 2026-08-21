'use client'
import { useParentCategories } from '@/context/ParentCategoriesContext'
import { Link } from '@/i18n/navigation'
import { category } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React from 'react'

function CategoryCard({category}: {category: category}) {
    const { getServiceCategoryByDocId } = useParentCategories();
     const imageUrl = category.image?.url ? getCompleteImageUrl(category.image.url) : '/placeholder.png'

     const parent = category.parentCategory;
     // /service/[service] matches EN parent slugs. Prefer the slug that came with the page
     // payload so the href is already correct in the server-rendered HTML; the context is a
     // fallback and only resolves after it loads client-side.
     const parentSlug =
        (parent?.locale === 'en'
          ? parent.slug
          : parent?.localizations?.find((l) => l.locale === 'en')?.slug) ||
        getServiceCategoryByDocId(parent?.documentId)?.slug;

     function getUrlPath(){
        if(!parentSlug) return '/';
        // Category filtering on the service page matches the child-category name in the
        // current locale, so the localized name is correct here. The param must be `cats`
        // (both the server page and ClientListingWrapper read `cats`).
        return `/service/${encodeURIComponent(parentSlug)}?cats=${encodeURIComponent(category.name.trim())}`;
     }
  // Was a <div onClick={router.push}>: crawlers don't click, so the home page passed no
  // link equity to any service/category page and they were sitemap-only discoveries.
  return (
    <Link
        href={getUrlPath()}
        className='flex flex-col gap-1.5 w-[300px] transition-all duration-300 ease-in hover:scale-105 cursor-pointer rounded-lg'
        style={{
        backgroundColor: '#fff',
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
    }}
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
</Link>
  )
}

export default CategoryCard