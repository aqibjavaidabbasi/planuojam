import React from 'react'
import ClientListingWrapper from "@/components/global/ClientListingWrapper";
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;

  return (
    <ClientListingWrapper
      service={service}
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
