import React from 'react'
import ListingDetailsPage from './ListingDetailsPage'
import ListingStatusHandler from './ListingStatusHandler'
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForListing } from '@/services/seoApi'
import { fetchListingBySlug } from '@/services/listing'
import { buildListingJsonLd, jsonLdToString } from '@/lib/listingJsonLd'

// ISR: server-render the listing into HTML from Strapi directly (no self-fetch hop).
// Kept fresh on publish via revalidateTag('listings') in /api/revalidate.
export const revalidate = 3600;

async function ListingDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  // Preserve prior graceful behavior: on error -> null -> ListingStatusHandler renders "not found".
  const listing = await fetchListingBySlug(slug, locale).catch((error) => {
    console.error('Failed to fetch listing for SSR:', error);
    return null;
  });

  // Emit structured data only for live listings (skip drafts / not-found).
  const jsonLd =
    listing && listing.listingStatus === 'published'
      ? buildListingJsonLd(listing, `${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/${locale}/listing/${slug}`)
      : [];

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdToString(block) }}
        />
      ))}
      <ListingStatusHandler listing={listing} locale={locale}>
        <ListingDetailsPage initialListing={listing} locale={locale} />
      </ListingStatusHandler>
    </>
  );
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
