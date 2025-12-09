"use client";
import React from 'react';
import { Location } from './MapboxMap';
import Image from 'next/image';
import { getCompleteImageUrl } from '@/utils/helpers';

type Props = {
  selectedLocation: Location;
  labels: {
    user: string;
    category: string;
    location: string;
    view: string;
  };
  href: string;
  currencySymbol: string;
};

const MapInfoWindow: React.FC<Props> = ({ selectedLocation, labels, href, currencySymbol }) => {
console.log(selectedLocation)
  return (
    <div className="text-sm font-sans bg-white rounded-lg overflow-hidden" style={{ width: '320px' }}>
      {/* Media container with overlays */}
      <div className="relative h-48 bg-gradient-to-tr from-teal-100 to-rose-100 flex items-center justify-center overflow-hidden">
        {selectedLocation?.image?.url ? (
          selectedLocation.image.mime?.startsWith('video/') ? (
            <video
              src={getCompleteImageUrl(selectedLocation.image.url)}
              className="w-full h-full object-cover"
              controls
              muted
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={getCompleteImageUrl(selectedLocation.image.url)}
              alt={selectedLocation.name}
              fill
              sizes="320px"
              className="object-cover"
            />
          )
        ) : (
          <div className="text-4xl select-none">
            {selectedLocation?.category?.type === 'venue' ? '🏛️' : selectedLocation?.category?.type === 'vendor' ? '🏪' : '📍'}
          </div>
        )}

        {/* Price Badge - Top Right */}
        {selectedLocation.price !== undefined && selectedLocation.price !== null && (
          <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1.5 rounded-md">
            <div className="text-sm font-bold">{currencySymbol}{selectedLocation.price}</div>
          </div>
        )}

        {/* Capacity Badge - Top Left */}
        {selectedLocation.maximumCapacity !== undefined && selectedLocation.maximumCapacity !== null && (
          <div className="absolute top-3 left-3 bg-white/90 text-gray-800 px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm">
            <div className="text-xs font-semibold flex items-center gap-1">
              <span>👥</span>
              <span>{selectedLocation.maximumCapacity}</span>
            </div>
          </div>
        )}

        {/* Rating Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-white px-2.5 py-1 rounded-md flex items-center gap-1.5">
          {selectedLocation.averageRating !== undefined && selectedLocation.averageRating !== null && selectedLocation.averageRating > 0 ? (
            <>
              <span className="text-yellow-500 text-lg leading-none">⭐</span>
              <span className="font-semibold text-gray-800">{selectedLocation.averageRating.toFixed(1)}</span>
            </>
          ) : (
            <span className="text-xs text-gray-600 font-medium">Unrated</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
          {selectedLocation.title || selectedLocation.name}
        </h2>

        {/* Address */}
        <div className="text-sm text-gray-700 mb-4 flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">📍</span>
          <span className="line-clamp-2">{selectedLocation.address}</span>
        </div>

        {/* View Button */}
        <a 
          href={href} 
          className="block w-full text-center bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-md transition-colors" 
          target='_blank'
        >
          {labels.view}
        </a>
      </div>
    </div>
  );
};

export default MapInfoWindow;
