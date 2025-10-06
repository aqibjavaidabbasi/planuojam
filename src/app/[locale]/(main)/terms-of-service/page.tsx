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
  return (
    <DynamicZoneRenderer blocks={TermsOfServicePageData.blocks} />
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
