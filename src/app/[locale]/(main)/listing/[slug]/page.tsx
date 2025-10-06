import React from 'react'
import ListingDetailsPage from './ListingDetailsPage'
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForListing } from '@/services/seoApi'

function ListingDetailPage() {
  return <ListingDetailsPage />
}

export default ListingDetailPage

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const [primarySeo, fallbackSeo] = await Promise.all([
    // Always fetch in English internally and select localized SEO by provided locale
    resolveSeoForListing({ slug, locale }),
    fetchFallbackSeo(),
  ]);

  const urlPath = `/${locale}/listing/${slug}`;
  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}