import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchHomePage } from '@/services/pagesApi'
import { homePage } from '@/types/pagesTypes';
import React from 'react'

export default async function HomePage() {
    const homePageData: homePage = await fetchHomePage('home');


    return (
    <div>
      <DynamicZoneRenderer blocks={homePageData.blocks} />
    </div>
  )
}