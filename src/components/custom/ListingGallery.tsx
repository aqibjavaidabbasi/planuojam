"use client";
import { strapiImage } from "@/types/mediaTypes";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import ImagePreviewModal from "../modals/ImagePreviewModal ";
import { useTranslations } from "next-intl";

// Define a type for YouTube video items
type YouTubeVideoItem = {
  url: string;
  videoId: string | null;
  isYouTube: boolean;
  originalIndex: number;
};

// Combined media type
type MediaItem = strapiImage | YouTubeVideoItem;

function ListingGallery({
  portfolio,
  title,
  mediaOrder,
  videos
}: {
  portfolio: strapiImage[];
  title: string;
  mediaOrder?: string;
  videos?: { url: string }[];
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

  // Filter out videos from portfolio
  const imagesOnly = useMemo(() => {
    return sortedPortfolio.filter(media => !media.mime?.startsWith('video/'));
  }, [sortedPortfolio]);

  // YouTube video processing
  const youtubeVideos = useMemo(() => {
    if (!videos) return [];
    
    return videos.map((video, idx) => {
      // Extract YouTube video ID from URL
      const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };
      
      const videoId = getYouTubeId(video.url);
      
      return {
        ...video,
        videoId,
        isYouTube: true,
        originalIndex: idx
      };
    }).filter(v => v.videoId); // Only include valid YouTube videos
  }, [videos]);

  // Combine images and YouTube videos
  const allMedia = useMemo(() => {
    return [...imagesOnly, ...youtubeVideos];
  }, [imagesOnly, youtubeVideos]);

  const firstItem = allMedia.length > 0 ? allMedia[0] : null; 
  const restItems = allMedia.slice(1);
  const rightItems = restItems.slice(0, 4);
  const extraCount = Math.max(0, restItems.length - 4);
  const hasRightItems = rightItems.length > 0;
  const isSingle = allMedia.length === 1;

  const renderMediaItem = (item: MediaItem, index: number, isMain: boolean) => { 
      const setIndex = () => handlePreview(index);

      // Handle YouTube videos
      if ('isYouTube' in item && item.isYouTube) {
          return (
             <div className="w-full h-full bg-black rounded-lg relative overflow-hidden group cursor-pointer" onClick={setIndex}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${item.videoId}`}
                    title={`${title} - YouTube Video ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={`w-full h-full ${isMain ? (isSingle ? "object-cover" : "object-contain") : "object-cover"} rounded-lg pointer-events-none`}
                  />
                  {/* Invisible overlay to capture clicks */}
                  <div className="absolute inset-0 bg-transparent cursor-pointer" />
             </div>
          )
      }

      // Handle regular images
      const src = getCompleteImageUrl(item.url);
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

  // Create media items for preview modal (images and videos)
  const mediaItems = useMemo(() => {
    const imageItems = imagesOnly.map((img) => ({
      type: 'image' as const,
      url: getCompleteImageUrl(img.url)
    }));
    
    const videoItems = youtubeVideos
      .filter(video => video.videoId) // Only include videos with valid IDs
      .map((video) => ({
        type: 'youtube' as const,
        url: video.url,
        videoId: video.videoId!
      }));
    
    return [...imageItems, ...videoItems];
  }, [imagesOnly, youtubeVideos]);

  const handlePreview = (index: number) => {
    // Always open in preview modal (both images and videos)
    setSelectedIndex(index);
  };

  return (
    <div className="relative w-full">
      {firstItem && (
        <div className="mb-6 flex">
          {isSingle ? (
            <div className="w-full h-[500px] bg-black rounded-lg">
                {renderMediaItem(firstItem, 0, true)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Left: Main item */}
              <div className="w-full h-[500px] bg-black rounded-lg">
                  {renderMediaItem(firstItem, 0, true)}
              </div>

              {/* Right: Up to 4 items in a 2x2 grid */}
              {hasRightItems && (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[500px]">
                  {rightItems.map((item: MediaItem, idx: number) => {
                    const globalIndex = idx + 1; // because 0 is main item
                    const isLastCell = idx === rightItems.length - 1 && extraCount > 0 && rightItems.length === 4;
                    return (
                      <div key={idx} className="relative bg-black rounded-lg w-full h-full">
                         {renderMediaItem(item, globalIndex, false)}
                        {isLastCell && (
                          <button
                            onClick={() => handlePreview(globalIndex)}
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
          media={mediaItems}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}

export default ListingGallery;
