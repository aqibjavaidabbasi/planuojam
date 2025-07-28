'use client'
import { HeroBannerBlock } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image';
import React from 'react'
import Button from '../ui/Button';
import Heading from '../ui/heading';

function HeroBanner({ data }: { data: HeroBannerBlock }) {
  const heroImage = getCompleteImageUrl(data.heroImage.url);
  return (
    <section className="grid md:grid-cols-2 w-screen max-w-screen">
      {/* Image comes first on mobile, second on md+ */}
      <div className="w-full h-60 md:h-[400px] order-1 md:order-2 relative">
        <Image
          src={heroImage}
          alt="Hero Image"
          fill
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-col gap-2.5 p-5 md:p-10 items-center md:items-start justify-center bg-normal order-2 md:order-1">
        <Heading
          headingPiece={data.heading.headingPiece}
          as="h1"
          extraStyles='lg:!items-start lg:!justify-start'
        />
        <p className="text-secondary text-base font-normal text-center md:text-left">{data.subTitle}</p>
        <Button style={data.callToAction.style === 'primary' || data.callToAction.style === 'secondary' ? data.callToAction.style : 'primary'}
        size='large'
        >
          {data.callToAction.bodyText}
        </Button>
      </div>
    </section>
  )
}
export default HeroBanner