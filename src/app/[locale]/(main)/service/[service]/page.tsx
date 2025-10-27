import React from 'react'
import dynamic from 'next/dynamic';
const ClientListingWrapper = dynamic(()=>import("@/components/global/ClientListingWrapper"));
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'
import { fetchSortedListingsWithMeta } from '@/services/listing'
import { fetchChildCategories, fetchParentCategories } from '@/services/common'
import type { category } from '@/types/pagesTypes'

export default async function ServicePage({ params, searchParams }: { params: Promise<{ locale?: string; service: string }>, searchParams?: Promise<Record<string, string | string[]>> }) {
  const { service, locale } = await params;
  const sp = (await searchParams) as Record<string, string | string[]> | undefined;

  const rawCat = sp?.["cat"];
  const rawEventType = sp?.["eventType"];
  const categoryFromUrl = typeof rawCat === 'string' ? rawCat : Array.isArray(rawCat) ? rawCat[0] : undefined;
  const eventTypeFromUrl = typeof rawEventType === 'string' ? rawEventType : Array.isArray(rawEventType) ? rawEventType[0] : undefined;

  const initialFilters: Record<string, string> = {};
  if (categoryFromUrl) initialFilters.category = categoryFromUrl;
  if (eventTypeFromUrl) initialFilters.eventType = eventTypeFromUrl;

  const appliedFilters: Record<string, unknown> = {};
  if (categoryFromUrl) {
    appliedFilters.category = { name: { $eq: categoryFromUrl } };
  }
  if (eventTypeFromUrl) {
    appliedFilters.eventTypes = { eventName: { $eq: eventTypeFromUrl } };
  }

  const [initialResp, initialCategoryNames] = await Promise.all([
    fetchSortedListingsWithMeta(
      service as 'vendor' | 'venue',
      appliedFilters,
      locale,
      { page: 1, pageSize: 5 }
    ),
    (async () => {
      try {
        const parents = await fetchParentCategories('en');
        const parent = Array.isArray(parents) ? parents.find((p: category) => p?.slug === service) : undefined;
        if (!parent?.documentId) return [] as string[];
        const cats = await fetchChildCategories(parent.documentId, locale);
        return Array.isArray(cats) ? (cats as Array<Pick<category, 'name'>>).map((c) => c.name).filter(Boolean) as string[] : [];
      } catch {
        return [] as string[];
      }
    })()
  ]);

  return (
    <ClientListingWrapper
      service={service}
      initialList={initialResp?.data || []}
      initialFilters={initialFilters}
      initialCategoryNames={initialCategoryNames}
      initialPagination={initialResp?.meta?.pagination}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; service: string }> }): Promise<Metadata> {
  const { locale, service } = await params;
  const pageUrl = `/service/${service}`;
  const urlPath = pageUrl;

  // Prefer slug-based EN-first SEO via Pages; fall back to SEO collection by relative URL
  const pageSeo = await fetchPageSeoBySlug(service, locale);
  if (pageSeo) {
    const fallbackSeo = await fetchFallbackSeo();
    return getSeoMetadata(pageSeo, fallbackSeo, urlPath);
  }

  const [mappedSeo, fallbackSeo] = await Promise.all([
    resolveSeoByUrl({ pageUrl, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(mappedSeo, fallbackSeo, urlPath);
}
