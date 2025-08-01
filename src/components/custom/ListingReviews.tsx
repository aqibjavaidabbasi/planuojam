"use client";
import { Review } from "@/types/pagesTypes";
import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import StarRating from "../global/StarRating";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

function ListingReviews({ reviews }: { reviews: Review[] }) {
  const approvedReviews = reviews.filter(
    (review: Review) => review.review.reviewStatus === "Approved"
  );

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className="w-full relative">
      <Swiper
        modules={[Navigation, Autoplay]}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 8,
          },
          992 : {
            slidesPerView: 2,
            spaceBetween: 16,
          },
        }}
        className="w-[75%] md:w-[85%] lg:w-[95%]"
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        onBeforeInit={(swiper) => {
          // @ts-expect-error: Swiper navigation params type does not match ref type
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error: Swiper navigation params type does not match ref type
          swiper.params.navigation.nextEl = nextRef.current;
        }}
      >
        {approvedReviews.map((review: Review, index: number) => (
          <SwiperSlide key={index}>
            <div className="p-4 border border-border rounded-lg shadow-sm grid grid-cols-2 justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(${Math.floor(
                      Math.random() * 360
                    )}, 70%, 60%)`,
                  }}
                >
                  <span className="text-white font-bold text-lg">
                    {review.author.username?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <p className="text-secondary font-semibold">
                  {review.author.username}
                </p>
              </div>
              <div className="flex items-center gap-2.5 justify-end">
                <StarRating rating={review.review.rating} />
                <p className="text-secondary">{review.review.rating}/5</p>
              </div>
              <p className="text-secondary col-span-2 mt-3">
                {review.review.reviewBody}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <button className="custom-prev swiper-button">
        <FaAnglesLeft />
      </button>
      <button className="custom-next swiper-button">
        <FaAnglesRight />
      </button>
    </div>
  );
}

export default ListingReviews;
