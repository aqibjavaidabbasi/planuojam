import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageById } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForPageById } from '@/services/seoApi'

async function TermsOfServicePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const TermsOfServicePageData: page = await fetchPageById('d1wrcza11cao15fm3mg2xibi', locale);
    if (!TermsOfServicePageData) return null;
  // Legal pages had no <h1>; Strapi already returns the page title.
  return (
    <>
      <h1 className="lg:max-w-425 mx-auto px-4 pt-6 text-2xl md:text-3xl font-semibold text-primary">
        {TermsOfServicePageData.title}
      </h1>
      <DynamicZoneRenderer blocks={TermsOfServicePageData.blocks} />
    </>
  )
}

export default TermsOfServicePage

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const documentId = 'd1wrcza11cao15fm3mg2xibi';
  const urlPath = `/${locale}/terms-of-service`;

  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForPageById({ documentId, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}
