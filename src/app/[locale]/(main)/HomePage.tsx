import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPage } from '@/services/pagesApi'
import { page } from '@/types/pagesTypes';
import React from 'react'

export default async function HomePage() {
    const homePageData: page = await fetchPage('home');

    return <DynamicZoneRenderer blocks={homePageData.blocks} />
}