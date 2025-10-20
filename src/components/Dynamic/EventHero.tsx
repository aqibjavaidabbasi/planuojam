import React from 'react'
import Heading from '../custom/heading'
import Button from '../custom/Button'
import Image from 'next/image'
import { HeroBannerBlock } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import { useRouter } from '@/i18n/navigation'

function EventHero({data}: {data: HeroBannerBlock}) {
    const heroImage = getCompleteImageUrl(data.heroImage.formats.banner?.url || data.heroImage.formats.medium?.url);
    const router = useRouter();

  return (
    <section className="relative w-screen h-80 md:h-[450px] flex items-center justify-start overflow-hidden max-w-screen">
       <Image
        src={heroImage}
        alt="Hero Image"
        fill
        priority
        className="object-cover w-full h-full"
        sizes="100vw"
      /> 
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <div className="relative z-10 flex items-center h-full w-full">
        <div
          className="max-w-lg w-full flex flex-col gap-4 items-start rounded-xl shadow-xl px-5 py-5 md:px-8 md:py-8 ml-0 md:ml-10 bg-white/30 backdrop-blur-3xl border border-white/30"
          style={{
            // fallback for glass effect if needed
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          }}
        >
          <Heading
            headingPiece={data.heading.headingPiece}
            as="h1"
            extraStyles='lg:!items-start lg:!justify-start'
          />
          <p className="text-gray-700 text-base font-normal text-left">{data.subTitle}</p>
          <Button
            style={data.callToAction.style}
            size='large'
            onClick={()=>router.push(data.callToAction.buttonUrl)}
          >
            {data.callToAction.bodyText}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default EventHero