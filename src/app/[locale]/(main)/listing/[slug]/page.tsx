import React from 'react'
import ListingDetailsPage from './ListingDetailsPage'
import ListingStatusHandler from './ListingStatusHandler'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForListing } from '@/services/seoApi'
import { fetchListingBySlug } from '@/services/listing'
import { buildListingJsonLd, jsonLdToString } from '@/lib/listingJsonLd'

// ISR: server-render the listing into HTML from Strapi directly (no self-fetch hop).
// Kept fresh on publish via revalidateTag('listings') in /api/revalidate.
export const revalidate = 3600;

async function ListingOverview({
  description,
  locale,
  tags,
}: {
  description?: string | null;
  locale: string;
  tags?: { documentId: string; name: string }[] | null;
}) {
  if (!description && !tags?.length) return null;

  const [tDetails, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'Listing.Details' }),
    getTranslations({ locale, namespace: 'Common' }),
  ]);
  const maxChars = 1000;
  const text = description || '';
  const intro = text.length > maxChars ? text.slice(0, maxChars).trimEnd() : text;
  const rest = text.length > maxChars ? text.slice(intro.length).trimStart() : '';

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
      <h2 className="text-2xl font-semibold text-primary mb-4">
        {tDetails('overview')}
      </h2>
      <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
        {intro}
        {rest && (
          <>
            ...
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-primary hover:text-primary/90">
                {tCommon('readMore')}
              </summary>
              {rest}
            </details>
          </>
        )}
      </div>
      {!!tags?.length && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {tags.map((tag) => (
            <span
              key={tag.documentId}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

async function ListingDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
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
        <ListingDetailsPage
          initialListing={listing}
          locale={locale}
          overview={<ListingOverview description={listing?.description} locale={locale} tags={listing?.tags} />}
        />
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
