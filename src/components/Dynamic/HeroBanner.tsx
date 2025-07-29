'use client'
import { HeroBannerBlock } from '@/types/pagesTypes'
import React from 'react'
import EventHero from './EventHero';
import NormalBanner from './NormalBanner';
import SimpleBgHero from './SimpleBgHero';

function HeroBanner({ data }: { data: HeroBannerBlock }) {
  const imagePosition = data.imagePosition?.toLowerCase() || 'right';

  if(data.variant.includes('simple')){
    return <SimpleBgHero data={data} />
  }
  
  if (imagePosition === 'background' || data.variant === 'event') {
    return ( <EventHero data={data} /> );
  }

  return ( <NormalBanner data={data} imagePosition={imagePosition} />
  )
}
export default HeroBanner