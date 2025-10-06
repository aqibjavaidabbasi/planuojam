import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageById } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes';
import React from 'react'
import ClientHotDealWrapper from './ClientHotDealWrapper';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForPageById } from '@/services/seoApi'

async function HotDealsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const hotDealPageData: page = await fetchPageById('h7ycc611qvimjg3prccyvm3n', locale);

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
            <ClientHotDealWrapper titleDescriptionBlock={titleDescriptionBlock} />

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