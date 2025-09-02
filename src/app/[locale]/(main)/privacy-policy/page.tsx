import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageLocalized } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const privacyPolicyPageData: page = await fetchPageLocalized('privacy-policy', locale);
    if (!privacyPolicyPageData) return null;
  return (
    <DynamicZoneRenderer blocks={privacyPolicyPageData.blocks} />
  )
}

export default PrivacyPolicyPage
