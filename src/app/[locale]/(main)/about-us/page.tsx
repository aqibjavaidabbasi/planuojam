import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageById } from '@/services/pagesApi';
import { page } from '@/types/pagesTypes';
import React from 'react';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, resolveSeoForPageById } from '@/services/seoApi'

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params 
  const aboutUsData: page = await fetchPageById('w9xmo2id7rjddo44es246xzl', locale);
    if (!aboutUsData) return null;
    return (
    <div>
      <DynamicZoneRenderer blocks={aboutUsData.blocks} />
    </div>
  )
}

export async function generateMetadata({ params }: AboutPageProps ): Promise<Metadata> {
  const { locale } = await params;
  const documentId = 'w9xmo2id7rjddo44es246xzl';
  const urlPath = `/${locale}/about-us`;

  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForPageById({ documentId, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}