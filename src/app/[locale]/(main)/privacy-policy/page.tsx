import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPageById } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const privacyPolicyPageData: page = await fetchPageById('fvrfcj6up74ua7y459jbxt6t', locale);
    if (!privacyPolicyPageData) return null;
  return (
    <DynamicZoneRenderer blocks={privacyPolicyPageData.blocks} />
  )
}

export default PrivacyPolicyPage
