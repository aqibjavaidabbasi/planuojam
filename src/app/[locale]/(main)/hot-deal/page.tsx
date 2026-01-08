import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageById } from '@/services/pagesApi'
import { fetchPromotedHotDealsWithMeta } from '@/services/listing'
import { page, ListingItem } from '@/types/pagesTypes';
import React from 'react'
import ClientHotDealWrapper from './ClientHotDealWrapper';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForPageById } from '@/services/seoApi'
import { shouldShowHotDeal } from '@/utils/hotDealHelper';

async function HotDealsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const hotDealPageData: page = await fetchPageById('h7ycc611qvimjg3prccyvm3n', locale);

    // Fetch hot deals server-side
    const initialHotDealsResponse = await fetchPromotedHotDealsWithMeta(locale, { page: 1, pageSize: 5 });
    const initialHotDeals = (initialHotDealsResponse?.data || []).filter((item: ListingItem) => shouldShowHotDeal(item.hotDeal));
    const initialMeta = initialHotDealsResponse?.meta?.pagination;

    const heroBlock = hotDealPageData.blocks.filter(block => block.__component === 'dynamic-blocks.hero-banner');
    const faqBlock = hotDealPageData.blocks.filter(block => block.__component === 'dynamic-blocks.faqs');
    const titleDescriptionBlock = hotDealPageData.blocks.filter(
        block => block.__component === 'general.title-description'
    );

    return (
        <div>
            {/* hero block */}
            <DynamicZoneRenderer blocks={heroBlock} />

            {/* filters and deals part */}
            <ClientHotDealWrapper 
                titleDescriptionBlock={titleDescriptionBlock}
                initialHotDeals={initialHotDeals}
                initialMeta={initialMeta}
            />

            {/* faq block */}
            <DynamicZoneRenderer blocks={faqBlock} />
        </div>
    )
}

export default HotDealsPage

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } =await params;
  const documentId = 'h7ycc611qvimjg3prccyvm3n';
  const urlPath = `/${locale}/hot-deal`;

  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForPageById({ documentId, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}