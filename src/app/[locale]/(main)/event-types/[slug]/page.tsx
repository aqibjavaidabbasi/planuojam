import React from 'react'
import ClientEventTypeWrapper from './ClientEventTypeWrapper';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'

async function EventTypesPage() {
    return  <ClientEventTypeWrapper/>;
}

export default EventTypesPage

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