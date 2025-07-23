'use client'
import { listingItem } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FaHeart } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'

function ListingCard({ item }: { item: listingItem }) {

    const [liked, setLiked] = useState(false);
    const [isClient, setIsClient] = React.useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    if (!isClient) return null;

    return (
        <div className='rounded-sm bg-white relative'
            style={{
                boxShadow: '0px 0px 4px rgba(0,0,0,0.2)'
            }}
        >
            <div className='absolute top-2 left-2 z-40'>
                {liked ? (
                    <FaHeart
                        onClick={() => setLiked(false)}
                        size={36}
                        color="#e53e3e"
                        style={{ cursor: 'pointer' }}
                    />
                ) : (
                    <CiHeart
                        onClick={() => setLiked(true)}
                        size={36}
                        color="#e2e8f0"
                        style={{ cursor: 'pointer' }}
                    />
                )}
            </div>
            <Swiper
                className="view_slide"
                modules={[Navigation, Pagination]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                loop={true}
                autoplay={true}
            >
                {item.images?.map((img, idx) => {
                    const imageUrl = getCompleteImageUrl(img.url)
                    return (
                        <SwiperSlide key={idx}>
                            <div className="relative w-full h-64">
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
            <div className='p-2'>
                {/* title and ratings */}
                <div className='flex w-full items-center justify-between'>
                    <strong>{item.title}</strong>
                    <div className='flex gap-1 text-primary items-center'>
                        <span>{item.averageRating ? item.averageRating : 'unrated'} </span>
                        <span>({item.ratingsCount ?? 0})</span>
                    </div>
                </div>
                {/* location */}
                <ul className='m-2'>
                    <li className='list-disc ml-3'>{item.listingItem.location ?? 'No Location Provided.'}</li>
                </ul>

                {/* pricing */}
                <div className='flex items-center gap-2'>
                    <span className='font-medium'>Price</span>
                    <span className='font-semibold text-primary'>${item.price}</span>
                </div>
            </div>
        </div>
    )
}

export default ListingCard