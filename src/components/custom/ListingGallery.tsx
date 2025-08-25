"use client";
import { strapiImage } from "@/types/common";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import ImagePreviewModal from "../modals/ImagePreviewModal ";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

function ListingGallery({
  images,
  portfolio,
  title,
}: {
  images: strapiImage[];
  portfolio: strapiImage[];
  title: string;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = [...images, ...(portfolio ?? [])];

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          nextEl: ".custom-next",
          prevEl: ".custom-prev",
        }}
        pagination={{ clickable: true }}
        className="w-[75%] md:w-[85%] lg:w-[95%] h-44 mb-6 rounded-lg shadow-sm px-8"
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
            breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 8,
          },
          590: {
            slidesPerView: 2,
            spaceBetween: 12,
          },
          992 : {
            slidesPerView: 3,
            spaceBetween: 16,
          },
        }}
      >
        {allImages.map((image: strapiImage, index: number) => (
          <SwiperSlide key={index} className="px-1">
            <Image
              src={getCompleteImageUrl(image.url)}
              alt={title}
              width={400}
              height={400}
              onClick={() => setSelectedImage(getCompleteImageUrl(image.url))}
              className="w-full h-full object-cover rounded-lg aspect-square cursor-pointer"
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Swiper Nav Buttons */}
      <button className="custom-prev swiper-button">
        <FaAnglesLeft />
      </button>
      <button className="custom-next swiper-button">
        <FaAnglesRight />
      </button>

      {selectedImage && (
        <ImagePreviewModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

export default ListingGallery;
