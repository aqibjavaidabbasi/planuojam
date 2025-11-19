"use client";
import { strapiImage } from "@/types/mediaTypes";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React, { useState } from "react";
import ImagePreviewModal from "../modals/ImagePreviewModal ";
import { useTranslations } from "next-intl";

function ListingGallery({
  portfolio,
  title,
  mainImageId,
}: {
  portfolio: strapiImage[];
  title: string;
  mainImageId: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const t = useTranslations("ListingGallery");

  const allImages = [...(portfolio ?? [])];
  const firstImage = allImages.find((img) => img.id === Number(mainImageId));
  const restImages = allImages.slice(1);
  const imageUrls = allImages.map((img) => getCompleteImageUrl(img.url));
  const rightImages = restImages.slice(0, 4);
  const extraCount = Math.max(0, restImages.length - 4);
  const hasRightImages = rightImages.length > 0;
  const isSingle = allImages.length === 1;

  return (
    <div className="relative w-full">
      {firstImage && (
        <div className="mb-6 flex">
          {isSingle ? (
            <div className="w-full h-[500px] bg-black rounded-lg">
              <Image
                src={getCompleteImageUrl(firstImage.url)}
                alt={title}
                width={650}
                height={500}
                onClick={() => setSelectedIndex(0)}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                priority
                fetchPriority="high"
                loading="eager"
                sizes="100vw"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Left: Main image */}
              <div className="w-full h-[500px] bg-black rounded-lg">
                <Image
                  src={getCompleteImageUrl(firstImage.url)}
                  alt={title}
                  width={650}
                  height={500}
                  onClick={() => setSelectedIndex(0)}
                  className="w-full h-full object-contain rounded-lg cursor-pointer"
                  priority
                  fetchPriority="high"
                  loading="eager"
                  sizes="100vw"
                />
              </div>

              {/* Right: Up to 4 images in a 2x2 grid */}
              {hasRightImages && (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[500px]">
                  {rightImages.map((image: strapiImage, idx: number) => {
                    const globalIndex = idx + 1; // because 0 is main image
                    const isLastCell = idx === rightImages.length - 1 && extraCount > 0 && rightImages.length === 4;
                    return (
                      <div key={idx} className="relative bg-black rounded-lg">
                        <Image
                          src={getCompleteImageUrl(image.url)}
                          alt={title}
                          width={650}
                          height={500}
                          onClick={() => setSelectedIndex(globalIndex)}
                          className="w-full h-full object-contain rounded-lg cursor-pointer"
                        />
                        {isLastCell && (
                          <button
                            onClick={() => setSelectedIndex(globalIndex)}
                            className="absolute inset-0 bg-black/50 text-white font-medium flex items-center justify-center rounded-lg"
                          >
                            {extraCount > 0
                              ? t("viewMoreWithCount", { count: extraCount })
                              : t("viewMore")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
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
