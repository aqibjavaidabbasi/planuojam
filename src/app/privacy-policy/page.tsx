import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer'
import { fetchPage } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes'
import React from 'react'

async function PrivacyPolicyPage() {
    const privacyPolicyPageData: page = await fetchPage('privacy-policy');
  return (
    <DynamicZoneRenderer blocks={privacyPolicyPageData.blocks} />
  )
}

export default PrivacyPolicyPage
