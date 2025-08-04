import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPage } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function TermsOfServicePage() {
    const TermsOfServicePageData: page = await fetchPage('terms-of-service');
  return (
    <DynamicZoneRenderer blocks={TermsOfServicePageData.blocks} />
  )
}

export default TermsOfServicePage
