"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

type MediaItem = {
  type: 'image' | 'youtube';
  url: string;
  videoId?: string | null;
};

type Props = {
  media: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
};

const ImagePreviewModal = ({ media, initialIndex = 0, onClose }: Props) => {
  const [index, setIndex] = useState<number>(initialIndex);

  const hasPrev = index > 0;
  const hasNext = index < media.length - 1;
  const goPrev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1);
  }, [hasNext]);

  const currentItem = media[index];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-800 z-50 hover:bg-white rounded-full w-9 h-9 cursor-pointer flex items-center justify-center "
        aria-label="Close"
      >
        &times;
      </button>

      {/* Image Container */}
      <div
        className="relative w-full h-full max-h-screen max-w-screen flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Arrow */}
        {hasPrev && (
          <button
            aria-label="Previous image"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center text-2xl cursor-pointer"
          >
            <FaAnglesLeft />
          </button>
        )}
        {/* Right Arrow */}
        {hasNext && (
          <button
            aria-label="Next image"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center text-2xl cursor-pointer"
          >
            <FaAnglesRight />
          </button>
        )}

        {/* Render Image or YouTube Video */}
        {currentItem.type === 'image' ? (
          <Image
            src={currentItem.url}
            alt={`Preview Image ${index + 1} of ${media.length}`}
            fill
            className="object-contain w-full h-full p-10 pointer-events-none select-none"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-10">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentItem.videoId}`}
              title={`Preview Video ${index + 1} of ${media.length}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="max-w-full max-h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewModal;
