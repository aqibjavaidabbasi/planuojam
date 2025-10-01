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
  portfolio,
  title,
}: {
  portfolio: strapiImage[];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const allImages = [...(portfolio ?? [])];
  const firstImage = allImages[0];
  const restImages = allImages.slice(1);
  const imageUrls = allImages.map((img) => getCompleteImageUrl(img.url));

  return (
    <div className="relative w-full">
      {firstImage && (
        <div className="w-full mb-6">
          <Image
            src={getCompleteImageUrl(firstImage.url)}
            alt={title}
            width={1600}
            height={500}
            onClick={() => setSelectedIndex(0)}
            className="w-full h-[500px] object-cover rounded-lg cursor-pointer"
            priority
          />
        </div>
      )}

      {restImages.length > 0 && (
        <>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation={{
              nextEl: ".custom-next",
              prevEl: ".custom-prev",
            }}
            pagination={{ clickable: true }}
            className="w-full h-44 mb-6 px-8"
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
              992: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
            }}
          >
            {restImages.map((image: strapiImage, index: number) => (
              <SwiperSlide key={index} className="px-1">
                <Image
                  src={getCompleteImageUrl(image.url)}
                  alt={title}
                  width={400}
                  height={400}
                  onClick={() => setSelectedIndex(index + 1)}
                  className="w-full h-full object-cover rounded-lg aspect-square cursor-pointer"
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
        </>
      )}

      {selectedIndex !== null && (
        <ImagePreviewModal
          images={imageUrls}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}

export default ListingGallery;
