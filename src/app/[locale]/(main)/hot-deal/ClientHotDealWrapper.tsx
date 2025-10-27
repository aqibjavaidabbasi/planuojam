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

function ClientHotDealWrapper({titleDescriptionBlock}: {titleDescriptionBlock: TitleDescriptionBlock[]}) {
    const [hotDealListings, setHotDealListings] = useState<ListingItem[]>([])
    const [page, setPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(5)
    const [total, setTotal] = useState<number>(0)
    const [loadingMore, setLoadingMore] = useState<boolean>(false)
    const [newIds, setNewIds] = useState<Set<string>>(new Set())
    const locale = useLocale();
    const t = useTranslations('hotdeal');

    const filterActive = useCallback((list: ListingItem[]) => {
        const now = new Date();
        return (list || []).filter((l: ListingItem) => {
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
    }, [])

    useEffect(function(){
        async function fetchListings(){
            const res = await fetchPromotedHotDealsWithMeta(locale, { page: 1, pageSize });
            const meta = res?.meta?.pagination;
            if (meta) {
                if (typeof meta.total === 'number') setTotal(meta.total);
                if (typeof meta.pageSize === 'number') setPageSize(meta.pageSize);
                if (typeof meta.page === 'number') setPage(meta.page);
            }
            const active = filterActive(Array.isArray(res?.data) ? res.data : []);
            setHotDealListings(active);
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
                        <AnimatedListItem key={String(listing.documentId)} isNew={newIds.has(String(listing.documentId))}>
                            <ListingCard item={listing} />
                        </AnimatedListItem>
                    ))
                    :
                    <NoDataCard>{t('noHotDealsFound')}</NoDataCard>
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