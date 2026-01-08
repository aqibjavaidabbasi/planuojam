'use client'

import NoDataCard from '@/components/custom/NoDataCard'
import ListingCard from '@/components/Dynamic/ListingCard'
import HotDealFilter from '@/components/global/HotDealFilter'
import Heading from '@/components/custom/heading'
import LoadMoreButton from '@/components/custom/LoadMoreButton'
import { fetchPromotedHotDealsWithMeta } from '@/services/listing'
import { ListingItem, TitleDescriptionBlock } from '@/types/pagesTypes'
import React, { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { shouldShowHotDeal } from '@/utils/hotDealHelper';

function ClientHotDealWrapper({
    titleDescriptionBlock,
    initialHotDeals,
    initialMeta
}: { 
    titleDescriptionBlock: TitleDescriptionBlock[];
    initialHotDeals?: ListingItem[];
    initialMeta?: { page: number; pageSize: number; pageCount: number; total: number };
}) {
    const [hotDealListings, setHotDealListings] = useState<ListingItem[]>(initialHotDeals || [])
    const [page, setPage] = useState<number>(initialMeta?.page || 1)
    const [pageSize, setPageSize] = useState<number>(initialMeta?.pageSize || 5)
    const [total, setTotal] = useState<number>(initialMeta?.total || 0)
    const [loadingMore, setLoadingMore] = useState<boolean>(false)
    const [filterLoading, setFilterLoading] = useState<boolean>(false)
    const [newIds, setNewIds] = useState<Set<string>>(new Set())
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(!initialHotDeals)
    const locale = useLocale();
    const t = useTranslations('hotdeal');

    const filterActive = useCallback((list: ListingItem[]) => {
        return (list || []).filter((l: ListingItem) => shouldShowHotDeal(l.hotDeal));
    }, [])

    useEffect(function(){
        if (initialHotDeals) {
            setIsInitialLoad(false);
            return;
        }
        
        async function fetchListings(){
            setIsInitialLoad(true);
            const res = await fetchPromotedHotDealsWithMeta(locale, { page: 1, pageSize });
            const meta = res?.meta?.pagination;
            if (meta) {
                if (typeof meta.total === 'number') setTotal(meta.total);
                if (typeof meta.pageSize === 'number') setPageSize(meta.pageSize);
                if (typeof meta.page === 'number') setPage(meta.page);
            }
            const active = filterActive(Array.isArray(res?.data) ? res.data : []);
            setHotDealListings(active);
            setIsInitialLoad(false);
        }
        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale])

    const AnimatedListItem: React.FC<{ isNew: boolean; children: React.ReactNode }> = ({ isNew, children }) => {
        const [entered, setEntered] = useState(!isNew);
        useEffect(() => {
          if (isNew) {
            const id = requestAnimationFrame(() => setEntered(true));
            return () => cancelAnimationFrame(id);
          }
        }, [isNew]);
        return (
          <div className={`transition-all duration-300 ease-out will-change-transform ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {children}
          </div>
        );
    };

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
            setList={async (list: ListingItem[]) => {
                setFilterLoading(true);
                try {
                    const active = (list || []).filter((l: ListingItem) => shouldShowHotDeal(l.hotDeal));
                    setHotDealListings(active);
                } finally {
                    setFilterLoading(false);
                }
            }}
        />
        <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
            {
                isInitialLoad ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : hotDealListings && hotDealListings.length > 0 ? (
                    hotDealListings.map(listing => (
                        <AnimatedListItem key={String(listing.documentId)} isNew={newIds.has(String(listing.documentId))}>
                            <ListingCard item={listing} />
                        </AnimatedListItem>
                    ))
                ) : filterLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <NoDataCard>{t('noHotDealsFound')}</NoDataCard>
                )
            }
        </div>
        {hotDealListings.length < (total || 0) && (
            <div className='flex items-center justify-center my-6'>
                <LoadMoreButton
                    loading={loadingMore}
                    disabled={hotDealListings.length >= (total || 0)}
                    onClick={async () => {
                        if (loadingMore) return;
                        setLoadingMore(true);
                        try {
                            const resp = await fetchPromotedHotDealsWithMeta(locale, { page: page + 1, pageSize });
                            const meta = resp?.meta?.pagination;
                            if (meta && typeof meta.total === 'number') setTotal(meta.total);
                            const newItems = filterActive(Array.isArray(resp?.data) ? resp.data : []);
                            if (newItems.length) {
                                const existingIds = new Set(hotDealListings.map((l) => String(l.documentId)));
                                const actuallyNew = newItems.filter((it) => !existingIds.has(String(it.documentId)));
                                const addedIds = new Set(actuallyNew.map((it) => String(it.documentId)));
                                if (addedIds.size) {
                                    setNewIds(addedIds);
                                    setTimeout(() => setNewIds(new Set()), 600);
                                }
                                setHotDealListings((prev) => {
                                    const combined = [...prev, ...newItems];
                                    const seen = new Set<string>();
                                    return combined.filter((it) => {
                                        const key = String(it.documentId);
                                        if (seen.has(key)) return false;
                                        seen.add(key);
                                        return true;
                                    });
                                })
                                setPage((p) => p + 1);
                            }
                        } finally {
                            setLoadingMore(false);
                        }
                    }}
                />
            </div>
        )}
    </div>
  )
}

export default ClientHotDealWrapper