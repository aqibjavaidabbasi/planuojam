'use client'
import React from 'react'
import Image from 'next/image'
import Heading from '../custom/heading'
import Button from '../custom/Button'
import { HeroBannerBlock } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'

function SimpleBgHero({ data }: { data: HeroBannerBlock }) {
  const heroImage = getCompleteImageUrl(data.heroImage.url)

  return (
    <section className="relative w-full h-80 md:h-[450px] flex items-center justify-center overflow-hidden max-w-screen lg:max-w-[1700px] mx-auto">
      <Image
        src={heroImage}
        alt="Hero Image"
        fill
        priority
        className="object-cover w-full h-full"
        sizes="100vw"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Centered text content */}
      <div className="relative z-10 text-center px-4">
        <Heading
          headingPiece={data.heading.headingPiece}
          as="h1"
          extraStyles="justify-center text-white"
        />
        {data.subTitle && (
          <p className="mt-2 text-base md:text-lg text-gray-200 font-light">
            {data.subTitle}
          </p>
        )}
        {data.callToAction?.bodyText && (
          <div className="mt-4">
            <Button
              style={data.callToAction.style}
              size="large"
            >
              {data.callToAction.bodyText}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export default SimpleBgHero
