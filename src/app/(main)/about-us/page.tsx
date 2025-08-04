import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPage } from '@/services/pagesApi';
import { page } from '@/types/pagesTypes';
import React from 'react'

export default async function AboutPage() {
    const aboutUsData: page = await fetchPage('about-us');

    console.log(aboutUsData)
    return (
    <div>
      <DynamicZoneRenderer blocks={aboutUsData.blocks} />
    </div>
  )
}