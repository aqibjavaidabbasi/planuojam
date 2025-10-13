import React from 'react'
import ListingDetailsPage from './ListingDetailsPage'
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForListing } from '@/services/seoApi'
import { fetchListingBySlug } from '@/services/listing'

async function ListingDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const listing = await fetchListingBySlug(slug, "en");
  return <ListingDetailsPage initialListing={listing} locale={locale} />;
}

export default ListingDetailPage

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForListing({ slug, locale }),
    fetchFallbackSeo(),
  ]);

  const urlPath = `/${locale}/listing/${slug}`;
  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}