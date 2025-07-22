'use client'
import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchHomePage } from '@/services/pagesApi'
import { homePage } from '@/types/pagesTypes';
import React, { useEffect, useState } from 'react'

function HomePage() {
    const [homePageData,setHomePageData] = useState<homePage>();

    useEffect(function(){
        fetchHomePage('home').then(data=>setHomePageData(data));
    },[]);

    if(!homePageData) return <div>Loading...</div>

    return (
    <div>
      <DynamicZoneRenderer blocks={homePageData.blocks} />
    </div>
  )
}

export default HomePage