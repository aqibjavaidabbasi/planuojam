import React from 'react'
import Heading from '../custom/heading'
import Button from '../custom/Button'
import Image from 'next/image'
import { HeroBannerBlock } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import { useRouter } from '@/i18n/navigation'

interface NormalBannerProps {
    data: HeroBannerBlock;
    imagePosition: string;
}

function NormalBanner({data, imagePosition}: NormalBannerProps) {
    const heroImage = getCompleteImageUrl(data.heroImage.url);
    const router = useRouter()
    // Both: image comes first on mobile
    const imageOrder = imagePosition === 'left' ? 'order-1 md:order-1' : 'order-1 md:order-2';
    const contentOrder = imagePosition === 'left' ? 'order-2 md:order-2' : 'order-2 md:order-1';

    return (
    <section className="grid md:grid-cols-2 w-screen max-w-screen lg:max-w-[1700px] mx-auto">
    {/* Image comes first on mobile, order depends on imagePosition on desktop */}
    <div className={`w-full h-60 md:h-[400px] relative ${imageOrder}`}>
      <Image
        src={heroImage}
        alt="Hero Image"
        fill
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
    <div className={`flex flex-col gap-2.5 p-5 md:p-10 items-center md:items-start justify-center bg-background ${contentOrder}`}>
      <Heading
        headingPiece={data.heading.headingPiece}
        as="h1"
        extraStyles='lg:!items-start lg:!justify-start'
      />
      <p className="text-secondary text-base font-normal text-center md:text-left">{data.subTitle}</p>
      <Button
        style={data.callToAction.style}
        size='large'
        onClick={()=>router.push(data.callToAction.buttonUrl)}
      >
        {data.callToAction.bodyText}
      </Button>
    </div>
  </section>
  )
}

export default NormalBanner