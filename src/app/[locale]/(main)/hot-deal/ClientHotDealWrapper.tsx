'use client'

import NoDataCard from '@/components/custom/NoDataCard'
import ListingCard from '@/components/Dynamic/ListingCard'
import HotDealFilter from '@/components/global/HotDealFilter'
import Heading from '@/components/custom/heading'
import { fetchPromotedHotDealListings } from '@/services/listing'
import { ListingItem, TitleDescriptionBlock } from '@/types/pagesTypes'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

function ClientHotDealWrapper({titleDescriptionBlock}: {titleDescriptionBlock: TitleDescriptionBlock[]}) {
    const [hotDealListings, setHotDealListings] = useState<ListingItem[]>([])
    const t = useTranslations('hotdeal');

    useEffect(function(){
        async function fetchListings(){
            const res = await fetchPromotedHotDealListings();
            // filter to only currently active hot deals
            const now = new Date();
            const active = (res || []).filter((l: ListingItem) => {
                const hd = l.hotDeal;
                if (!hd || !hd.enableHotDeal) return false;
                try {
                    const start = new Date(hd.startDate);
                    const end = new Date(hd.lastDate);
                    return now >= start && now <= end;
                } catch {
                    return false;
                }
            });
            setHotDealListings(active);
        }
        fetchListings();
    },[])

  return (
    <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1700px] mx-auto'>
        <div className='flex flex-col items-center justify-center gap-2'>
            {titleDescriptionBlock[0]?.heading?.headingPiece && (
                <Heading headingPiece={titleDescriptionBlock[0].heading.headingPiece} />
            )}
            {titleDescriptionBlock[0]?.sectionDescription && (
                <p className='text-center'>{titleDescriptionBlock[0].sectionDescription}</p>
            )}
        </div>
        <HotDealFilter
            setList={(list: ListingItem[]) => {
                const now = new Date();
                const active = (list || []).filter((l: ListingItem) => {
                    const hd = (l).hotDeal;
                    if (!hd || !hd.enableHotDeal) return false;
                    try {
                        const start = new Date(hd.startDate);
                        const end = new Date(hd.lastDate);
                        return now >= start && now <= end;
                    } catch {
                        return false;
                    }
                });
                setHotDealListings(active);
            }}
        />
        <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
            {
                hotDealListings && hotDealListings.length > 0 ?
                    hotDealListings.map(listing => (
                        <ListingCard key={listing.documentId} item={listing} />
                    ))
                    :
                    <NoDataCard>{t('noHotDealsFound')}</NoDataCard>
            }
        </div>
    </div>
  )
}

export default ClientHotDealWrapper