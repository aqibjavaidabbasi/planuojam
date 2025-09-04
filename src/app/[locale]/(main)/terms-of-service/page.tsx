import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageById } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function TermsOfServicePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const TermsOfServicePageData: page = await fetchPageById('d1wrcza11cao15fm3mg2xibi', locale);
    if (!TermsOfServicePageData) return null;
  return (
    <DynamicZoneRenderer blocks={TermsOfServicePageData.blocks} />
  )
}

export default TermsOfServicePage
