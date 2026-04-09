import React from 'react'
import dynamic from 'next/dynamic';
const ClientListingWrapper = dynamic(()=>import("@/components/global/ClientListingWrapper"));
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'
import { fetchSortedListingsWithMeta } from '@/services/listing'
import { fetchChildCategories, fetchParentCategories, fetchAllChildCategories } from '@/services/common'
import type { category } from '@/types/pagesTypes'

export default async function ServicePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ locale?: string; service: string }>, 
  searchParams?: Promise<Record<string, string | string[]>> 
}) {
  const { service, locale } = await params;
  const sp = (await searchParams) as Record<string, string | string[]> | undefined;

  const rawCat = sp?.["cats"];
  const rawEventType = sp?.["eventType"];
  const categoryFromUrl = typeof rawCat === 'string' ? rawCat : Array.isArray(rawCat) ? rawCat : undefined;
  const eventTypeFromUrl = typeof rawEventType === 'string' ? rawEventType : Array.isArray(rawEventType) ? rawEventType : undefined;

  const appliedFilters: Record<string, unknown> = {};
  const initialFilters: Record<string, string | string[]> = {};
  if (eventTypeFromUrl) {
    initialFilters.eventType = eventTypeFromUrl;
    appliedFilters.eventTypes = { eventName: { $eq: eventTypeFromUrl } };
  }

  // Fetch parent categories early to find the matching service type
  const parents = await fetchParentCategories('en');
  const parent = Array.isArray(parents) ? parents.find((p: category) => p?.slug === service) : undefined;
  let serviceType = parent?.serviceType;

  if (service === 'all') {
    serviceType = undefined;
  }

  const [initialCategories] = await Promise.all([
    (async () => {
      try {
        let cats: category[] = [];
        if (service === 'all') {
          cats = await fetchAllChildCategories(locale);
        } else if (parent?.documentId) {
          cats = await fetchChildCategories(parent.documentId, locale);
        }
        return Array.isArray(cats) 
          ? cats.sort((c1, c2) => c2.priority - c1.priority)
                .map((c) => ({ name: c.name, documentId: c.documentId }))
                .filter(c => !!c.name && !!c.documentId)
          : [];
      } catch {
        return [];
      }
    })(),
  ]);

  if (categoryFromUrl) {
    const names = (Array.isArray(categoryFromUrl) ? categoryFromUrl : [categoryFromUrl])
      .map(n => n.toLowerCase().trim());
    
    const categoryIds = initialCategories
      .filter(c => names.includes(c.name.toLowerCase().trim()))
      .map(c => c.documentId);
    
    if (categoryIds.length > 0) {
      appliedFilters.categories = { documentId: { $in: categoryIds } };
      initialFilters.categories = categoryIds;
    } else {
      // Fallback: Use names if resolution fails
      initialFilters.categories = Array.isArray(categoryFromUrl) ? categoryFromUrl : [categoryFromUrl];
    }
  }

  const finalInitialResp = await fetchSortedListingsWithMeta(
    serviceType,
    appliedFilters,
    locale,
    { page: 1, pageSize: 12 }
  );

  return (
    <ClientListingWrapper
      service={service}
      serviceType={serviceType}
      initialList={finalInitialResp?.data || []}
      initialFilters={initialFilters}
      initialCategories={initialCategories}
      initialPagination={finalInitialResp?.meta?.pagination}
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
