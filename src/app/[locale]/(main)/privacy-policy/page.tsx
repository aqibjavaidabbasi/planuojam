import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageById } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForPageById } from '@/services/seoApi'

async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const privacyPolicyPageData: page = await fetchPageById('fvrfcj6up74ua7y459jbxt6t', locale);
    if (!privacyPolicyPageData) return null;
  return (
    <DynamicZoneRenderer blocks={privacyPolicyPageData.blocks} />
  )
}

export default PrivacyPolicyPage

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const documentId = 'fvrfcj6up74ua7y459jbxt6t';
  const urlPath = `/${locale}/privacy-policy`;

  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForPageById({ documentId, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}
