"use client";

import { useEffect } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

const ImagePreviewModal = ({ src, alt = "Preview Image", onClose }: Props) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-800 z-50 hover:bg-white rounded-full w-9 h-9 cursor-pointer flex items-center justify-center"
      >
        &times;
      </button>

      {/* Image Container */}
      <div
        className="relative w-full h-full max-h-screen max-w-screen flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain w-full h-full p-10 pointer-events-none select-none"
          sizes="100vw"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
