'use client'
import NoDataCard from '@/components/custom/NoDataCard'
import ListingCard from '@/components/Dynamic/ListingCard'
import HotDealFilter from '@/components/global/HotDealFilter'
import Heading from '@/components/custom/heading'
import Loader from '@/components/custom/Loader'
import { useParentCategories } from '@/context/ParentCategoriesContext'
import { fetchHotDealListings } from '@/services/common'
import { ListingItem, TitleDescriptionBlock } from '@/types/pagesTypes'
import React, { useEffect, useState } from 'react'

function ClientHotDealWrapper({titleDescriptionBlock}: {titleDescriptionBlock: TitleDescriptionBlock[]}) {
    const [hotDealListings, setHotDealListings] = useState<ListingItem[]>()
    const { parentCategories, isLoading, error } = useParentCategories();

    useEffect(function(){
        async function fetchListings(){
            const res = await fetchHotDealListings();
            setHotDealListings(res);
        }
        fetchListings();
    },[])

    const parentCategoriesFilter = {
        name: 'category',
        options: parentCategories?.map(cat => cat.name) || [],
        placeholder: 'Choose a vendor',
    }

    if (isLoading) {
        return <Loader />
    }
    if (error) {
        return <div>Error: {error}</div>;
    }


  return (
    <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1440px] mx-auto'>
        <div className='flex flex-col items-center justify-center gap-2'>
            {titleDescriptionBlock[0]?.heading?.headingPiece && (
                <Heading headingPiece={titleDescriptionBlock[0].heading.headingPiece} />
            )}
            {titleDescriptionBlock[0]?.sectionDescription && (
                <p className='text-center'>{titleDescriptionBlock[0].sectionDescription}</p>
            )}
        </div>
        <HotDealFilter
            categoryOptions={parentCategoriesFilter}
            setList={setHotDealListings}
        />
        <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
            {
                hotDealListings && hotDealListings.length > 0 ?
                    hotDealListings.map(listing => (
                        <ListingCard key={listing.documentId} item={listing} />
                    ))
                    :
                    <NoDataCard>No Data Found</NoDataCard>
            }
        </div>
    </div>
  )
}

export default ClientHotDealWrapper