'use client'
import HeroBanner from '@/components/homepage/HeroBanner';
import { fetchHomePage } from '@/services/pagesApi'
import { homePage } from '@/types/pagesTypes';
import React, { useEffect, useState } from 'react'

function HomePage() {
    const [homePageData,setHomePageData] = useState<homePage>();

    useEffect(function(){
        fetchHomePage().then(data=>setHomePageData(data));
    },[]);

    if(!homePageData) return <div>Loading...</div>

    console.log(homePageData)

    return (
    <div>
      <HeroBanner />
    </div>
  )
}

export default HomePage