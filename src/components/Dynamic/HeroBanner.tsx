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
      <div className="w-full order-1 md:order-2">
        <Image
          src={heroImage}
          alt="Hero Image"
          width={2000}
          height={2000}
        />
      </div>
      <div className="flex flex-col gap-2.5 p-5 items-start justify-center bg-normal order-2 md:order-1">
        <Heading headingPiece={data.heading.headingPiece} title={data.title} as="h1" />
        <p className="text-secondary text-base font-normal">{data.subTitle}</p>
        <Button style={data.callToAction.style}>
          {data.callToAction.bodyText}
        </Button>
      </div>
    </section>
  )
}
export default HeroBanner