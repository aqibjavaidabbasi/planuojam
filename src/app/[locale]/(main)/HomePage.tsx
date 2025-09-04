import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageById } from '@/services/pagesApi'
import { page, } from '@/types/pagesTypes';
import React from 'react'

export default async function HomePage({ params }: { params: { locale: string } }) {
    const { locale } = params;
    const homePageData: page = await fetchPageById('k97xf2g2fdn14vlubd26wupu', locale);

    return <DynamicZoneRenderer blocks={homePageData.blocks} />
}
