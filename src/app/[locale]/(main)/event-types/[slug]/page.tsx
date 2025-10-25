import React from 'react'
import ClientEventTypeWrapper from './ClientEventTypeWrapper';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'
import { notFound } from 'next/navigation'
import { fetchEventTypeAggregateByEnSlug, EventTypeAggregateResponse, HttpError } from '@/services/eventTypes'
import type { DynamicBlocks, ListingItem } from '@/types/pagesTypes'
import { fetchPageById } from '@/services/pagesApi'
import { fetchPromotedListingsPerEvents } from '@/services/listing'

export default async function EventTypesPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  let data: EventTypeAggregateResponse;
  try {
    data = await fetchEventTypeAggregateByEnSlug(slug, locale);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return notFound();
    throw e;
  }

  // Ensure deep population using existing services and schemas
  const pageDocId = data?.page?.documentId || data?.eventType?.page?.documentId;
  const eventTypeId = data?.eventType?.documentId;

  let eventBlocks: DynamicBlocks[] = [];
  if (pageDocId) {
    const pageRes = await fetchPageById(pageDocId, locale);
    eventBlocks = Array.isArray(pageRes?.blocks) ? (pageRes.blocks as DynamicBlocks[]) : [];
  }

  let listings: ListingItem[] = [];
  if (eventTypeId) {
    const listingRes = await fetchPromotedListingsPerEvents(eventTypeId, locale);
    listings = Array.isArray(listingRes) ? (listingRes as ListingItem[]) : [];
  }

  // Constants currently defined in ParentCategoriesContext; mirrored here for SSR
  const VENUE_DOC_ID = 'cvf586kao1521ew8lb1vl540';
  const VENDOR_DOC_ID = 'no20d9ryuyfvtu6dhsqxfej7';

  return (
    <ClientEventTypeWrapper
      eventBlocks={eventBlocks}
      listings={listings}
      vendorParentId={VENDOR_DOC_ID}
      venueParentId={VENUE_DOC_ID}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageUrl = `/${locale}/event-types/${slug}`;
  const urlPath = pageUrl;

  // Rule: rely on slug, fetch in EN, return requested locale if available
  const pageSeo = await fetchPageSeoBySlug(slug, locale);
  if (pageSeo) {
    const fallbackSeo = await fetchFallbackSeo();
    return getSeoMetadata(pageSeo, fallbackSeo, urlPath);
  }

  // Fallback: SEO collection by relative pageUrl
  const [mappedSeo, fallbackSeo] = await Promise.all([
    resolveSeoByUrl({ pageUrl, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(mappedSeo, fallbackSeo, urlPath);
}