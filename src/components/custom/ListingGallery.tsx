"use client";
import { strapiImage } from "@/types/mediaTypes";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import ImagePreviewModal from "../modals/ImagePreviewModal ";
import { useTranslations } from "next-intl";

function ListingGallery({
  portfolio,
  title,
  mediaOrder
}: {
  portfolio: strapiImage[];
  title: string;
  mediaOrder?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const t = useTranslations("ListingGallery");

  const sortedPortfolio = useMemo(() => {
    if (!mediaOrder) return portfolio || [];
    const orderMap = new Map(mediaOrder.split("-").map((id, index) => [Number(id), index]));
    
    // Sort items based on the order map. Items not in the map go to the end.
    return [...(portfolio || [])].sort((a, b) => {
        const indexA = orderMap.get(a.id);
        const indexB = orderMap.get(b.id);
        
        if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
        if (indexA !== undefined) return -1;
        if (indexB !== undefined) return 1;
        return 0; 
    });
  }, [portfolio, mediaOrder]);


  const allImages = [...(sortedPortfolio ?? [])];
  // First item is always the main one based on order
  const firstImage = allImages.length > 0 ? allImages[0] : null; 
  const restImages = allImages.slice(1);
  const imageUrls = allImages.map((img) => getCompleteImageUrl(img.url));
  const rightImages = restImages.slice(0, 4);
  const extraCount = Math.max(0, restImages.length - 4);
  const hasRightImages = rightImages.length > 0;
  const isSingle = allImages.length === 1;

  const renderMediaItem = (item: strapiImage, index: number, isMain: boolean) => { 
      const isVideo = item.mime?.startsWith("video/");
      const src = getCompleteImageUrl(item.url);
      
      const setIndex = () => setSelectedIndex(index);

      if (isVideo) {
          return (
             <div className="w-full h-full bg-black rounded-lg relative overflow-hidden group cursor-pointer" onClick={setIndex}>
                  <video 
                      src={src} 
                      className={`w-full h-full ${isMain ? (isSingle ? "object-cover" : "object-contain") : "object-cover"} rounded-lg`} 
                      muted 
                      loop 
                      playsInline
                      onMouseOver={e => e.currentTarget.play().catch(() => {})}
                      onMouseOut={e => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                  />
                  {/* Play icon overlay */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                         </svg>
                      </div>
                   </div>
             </div>
          )
      }

      return (
          <Image
            src={src}
            alt={title}
            width={650}
            height={500}
            onClick={setIndex}
            className={`w-full h-full ${isMain ? (isSingle ? "object-cover" : "object-contain") : "object-cover"} rounded-lg cursor-pointer`}
            priority={isMain}
            fetchPriority={isMain ? "high" : "auto"}
            loading={isMain ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
      )
  }

  return (
    <div className="relative w-full">
      {firstImage && (
        <div className="mb-6 flex">
          {isSingle ? (
            <div className="w-full h-[500px] bg-black rounded-lg">
                {renderMediaItem(firstImage, 0, true)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Left: Main image */}
              <div className="w-full h-[500px] bg-black rounded-lg">
                  {renderMediaItem(firstImage, 0, true)}
              </div>

              {/* Right: Up to 4 images in a 2x2 grid */}
              {hasRightImages && (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[500px]">
                  {rightImages.map((image: strapiImage, idx: number) => {
                    const globalIndex = idx + 1; // because 0 is main image
                    const isLastCell = idx === rightImages.length - 1 && extraCount > 0 && rightImages.length === 4;
                    return (
                      <div key={idx} className="relative bg-black rounded-lg w-full h-full">
                         {renderMediaItem(image, globalIndex, false)}
                        {isLastCell && (
                          <button
                            onClick={() => setSelectedIndex(globalIndex)}
                            className="absolute inset-0 bg-black/50 text-white font-medium flex items-center justify-center rounded-lg z-10"
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
          // Pass full objects if we want video support in modal later, for now just URLs
          // If the modal supports video detection by URL extension or we update it, it will work.
        />
      )}
    </div>
  );
}

export default ListingGallery;
