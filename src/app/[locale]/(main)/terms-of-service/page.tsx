import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageLocalized } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function TermsOfServicePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const TermsOfServicePageData: page = await fetchPageLocalized('terms-of-service', locale);
    if (!TermsOfServicePageData) return null;
  return (
    <DynamicZoneRenderer blocks={TermsOfServicePageData.blocks} />
  )
}

export default TermsOfServicePage
