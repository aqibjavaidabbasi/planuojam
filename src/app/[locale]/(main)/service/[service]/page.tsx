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
    // `?eventType=` carries the locale-stable event-type documentId (eventName is localized).
    initialFilters.eventType = eventTypeFromUrl;
    appliedFilters.eventTypes = { documentId: { $eq: eventTypeFromUrl } };
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

  // The service page had no <h1> at all. Derive it from data already fetched — the filtered
  // child-category name when one is applied, otherwise the parent category in the active
  // locale — so no new copy is needed and it translates with the rest of the catalogue.
  const localizedParentName =
    parent?.locale === locale
      ? parent?.name
      : parent?.localizations?.find((l: category) => l.locale === locale)?.name ?? parent?.name;
  const firstCat = Array.isArray(categoryFromUrl) ? categoryFromUrl[0] : categoryFromUrl;
  const heading = firstCat?.trim() || localizedParentName;

  return (
    <>
      {heading && (
        <h1 className="lg:max-w-425 mx-auto px-4 pt-6 text-2xl md:text-3xl font-semibold text-primary">
          {heading}
        </h1>
      )}
    <ClientListingWrapper
      service={service}
      serviceType={serviceType}
      initialList={finalInitialResp?.data || []}
      initialFilters={initialFilters}
      initialAppliedFilters={appliedFilters}
      initialCategories={initialCategories}
      initialPagination={finalInitialResp?.meta?.pagination}
    />
    </>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; service: string }>,
  searchParams?: Promise<Record<string, string | string[]>>
}): Promise<Metadata> {
  const { locale, service } = await params;
  const pageUrl = `/service/${service}`; // SEO lookup key in Strapi (locale-agnostic) — do not change
  // category-sitemap.xml publishes one URL per child category as `?cats=<name>`. Without
  // the param in the canonical, all 50+ of those collapsed onto 3 service pages and Google
  // reported them as duplicates. Keep the canonical self-referential for that one param.
  const rawCats = (await searchParams)?.["cats"];
  const cats = Array.isArray(rawCats) ? rawCats[0] : rawCats;
  const query = cats ? `?cats=${encodeURIComponent(cats.trim())}` : '';
  const urlPath = `/${locale}/service/${service}${query}`; // canonical/OG path (locale-correct)

  // Prefer slug-based EN-first SEO via Pages; fall back to SEO collection by relative URL
  const pageSeo = await fetchPageSeoBySlug(service, locale);
  const [mappedSeo, fallbackSeo] = await Promise.all([
    pageSeo ? Promise.resolve(pageSeo) : resolveSeoByUrl({ pageUrl, locale }),
    fetchFallbackSeo(),
  ]);
  const metadata = getSeoMetadata(mappedSeo, fallbackSeo, urlPath);

  // Without this every ?cats= URL in category-sitemap.xml carried the same title as the
  // unfiltered service page. Prefix with the category name already present in the URL so
  // each indexed filter URL is distinguishable. Override in Strapi SEO when copy is written.
  if (cats) {
    metadata.title = `${cats.trim()} | ${metadata.title ?? ''}`.replace(/ \| $/, '');
    if (metadata.openGraph) metadata.openGraph.title = metadata.title;
  }

  return metadata;
}
