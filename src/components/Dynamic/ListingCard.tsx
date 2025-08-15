'use client'
import { ListingItem } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import { useState } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FaHeart } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'
import Button from '../custom/Button'
import { IoNavigateOutline } from 'react-icons/io5'
import { useRouter } from 'next/navigation'
import { useSiteSettings } from '@/context/SiteSettingsContext'

function ListingCard({ item }: { item: ListingItem }) {
  const [liked, setLiked] = useState(false)
  const router = useRouter();
  const { siteSettings } = useSiteSettings();

  return (
    <div
      className="rounded-lg bg-white relative max-w-full sm:max-w-[300px] overflow-hidden border border-border"
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

      {/* Hot Deal Badge */}
      {item.hotDeal?.enableHotDeal && (
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center transform rotate-12">
              <div className="text-center">
                <div className="text-xs font-bold">HOT</div>
                <div className="text-xs">DEAL</div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-white transform rotate-12"></div>
          </div>
        </div>
      )}

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
            <span>{item.averageRating ?? 'Unrated'}</span>
            <span>({item.ratingsCount ?? 0})</span>
          </div>
        </div>

        {/* Location, Category, Event Type */}
        <ul className="ml-4 list-disc text-sm text-secondary">
          {item.listingItem?.length > 0 && (
            <li className="truncate list-disc">
              {item.listingItem[0].__component === 'dynamic-blocks.venue' && item.listingItem[0].location
                ? `${item.listingItem[0].location.address}, ${item.listingItem[0].location.city}`
                : item.listingItem[0].__component === 'dynamic-blocks.vendor' && item.listingItem[0].serviceArea?.cities?.length > 0
                ? item.listingItem[0].serviceArea.cities.map(c => c.name).join(', ')
                : 'No location provided'}
            </li>
          )}
          {item.category?.name && <li className="truncate">{item.category.name}</li>}
        </ul>

        {/* Pricing and Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            {item.price ? (
              <>
                <span className="font-medium">Price</span>
                <span className="font-semibold text-primary">{siteSettings.currency ?  siteSettings.currency.symbol : '$'}{item.price.toLocaleString()}</span>
              </>
            ) : (
              <span>Contact for pricing</span>
            )}
          </div>
          <Button style="secondary" size="small" onClick={() => router.push(`/listing/${item.slug}`)}>
            View <IoNavigateOutline />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ListingCard