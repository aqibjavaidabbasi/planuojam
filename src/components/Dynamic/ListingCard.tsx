'use client'
import { listingItem } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FaHeart } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'
import Button from '../ui/Button'
import { IoNavigateOutline } from 'react-icons/io5'

function ListingCard({ item }: { item: listingItem }) {
  const [liked, setLiked] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div
      className="rounded-md bg-white relative max-w-full sm:max-w-[300px] overflow-hidden"
      style={{
        boxShadow:
          '2px 0px 4px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.1), 0px -2px 4px rgba(0,0,0,0.1), -2px 0px 4px rgba(0,0,0,0.1)'
      }}
    >
      {/* Heart icon */}
      <div className="absolute top-2 left-2 z-40">
        {liked ? (
          <FaHeart
            onClick={() => setLiked(false)}
            size={32}
            color="#e53e3e"
            className="cursor-pointer"
          />
        ) : (
          <CiHeart
            onClick={() => setLiked(true)}
            size={32}
            color="#e2e8f0"
            className="cursor-pointer"
          />
        )}
      </div>

      {/* Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        className="custom-swiper"
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false
        }}
      >
        {item.images?.map((img, idx) => {
          const imageUrl = getCompleteImageUrl(img.url)
          return (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-40 md:h-56 lg:h-64">
                <Image
                  src={imageUrl}
                  alt={`Venue Image ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority={idx === 0}
                />
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title and Rating */}
        <div className="flex justify-between items-center">
          <strong className="text-base md:text-lg">{item.title}</strong>
          <div className="flex gap-1 text-primary items-center text-sm">
            <span>{item.averageRating ?? 'unrated'}</span>
            <span>({item.ratingsCount ?? 0})</span>
          </div>
        </div>

        {/* Location */}
        <ul className="ml-4 list-disc text-sm text-gray-600">
          <li>{item?.listingItem?.location ?? 'No Location Provided.'}</li>
        </ul>

        {/* Pricing and Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            {item.price ? (
              <>
                <span className="font-medium">Price</span>
                <span className="font-semibold text-primary">${item.price}</span>
              </>
            ) : (
              <span>Contact for pricing</span>
            )}
          </div>
          <Button style="secondary" size="small">
            View <IoNavigateOutline />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ListingCard
