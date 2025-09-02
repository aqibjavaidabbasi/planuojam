import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageLocalized } from '@/services/pagesApi';
import { page } from '@/types/pagesTypes';
import React from 'react'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const aboutUsData: page = await fetchPageLocalized('about-us', locale);
    if (!aboutUsData) return null;
    return (
    <div>
      <DynamicZoneRenderer blocks={aboutUsData.blocks} />
    </div>
  )
}