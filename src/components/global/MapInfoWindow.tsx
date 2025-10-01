"use client";
import React from 'react';
import { Location } from './MapboxMap';
import Button from '../custom/Button';
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
};

const MapInfoWindow: React.FC<Props> = ({ selectedLocation, labels, href }) => {
  const handleViewClick = () => {
    if (typeof window !== 'undefined') window.location.assign(href);
  };

  return (
    <div className="text-sm font-sans bg-white/95">
      {/* Image container */}
      <div className="m-4 h-40 rounded-xl overflow-hidden relative bg-gradient-to-tr from-teal-100 to-rose-100 flex items-center justify-center">
        {Boolean((selectedLocation)?.image?.url) ? (
          // Use a standard img to avoid Next.js image domain constraints inside the map popup
          <Image
            src={getCompleteImageUrl(selectedLocation?.image?.url)}
            alt={selectedLocation.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
          />
        ) : (
          <div className="text-4xl select-none">
            {selectedLocation?.category?.type === 'venue' ? '🏛️' : selectedLocation?.category?.type === 'vendor' ? '🏪' : '📍'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-1 gap-2">
        {/* Header: title and category badge (replaces price in v3) */}
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800 leading-snug pr-2 truncate">
            {selectedLocation.name}
          </h2>
          {selectedLocation?.category?.name && (
            <span className="shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 text-[11px] px-2 py-1 leading-none">
              {selectedLocation.category.name}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="text-gray-600 text-[13px] mb-3 flex items-center gap-1.5">
          <span className="leading-none">📍</span>
          <span className="truncate" title={selectedLocation.address}>{selectedLocation.address}</span>
        </div>

        {/* Features grid (2x2 like v3, adapted to our data) */}
        <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-700 mb-3 col-span-2">
          <div className="bg-gray-50 rounded-md px-2 py-1.5">
            <div className="font-medium text-gray-800">{labels.user}</div>
            <div className="truncate">{selectedLocation.username}</div>
          </div>
          <div className="bg-gray-50 rounded-md px-2 py-1.5">
            <div className="font-medium text-gray-800">{labels.category}</div>
            <div className="truncate">{selectedLocation?.category?.type || '-'}</div>
          </div>
        </div>

        {/* Description */}
        {selectedLocation.description && (
          <p className="text-[13px] text-gray-700 mb-3 line-clamp-2 col-span-2">
            {selectedLocation.description}
          </p>
        )}

        <Button
          style="primary"
          size="small"
          extraStyles="col-span-2"
          onClick={handleViewClick}
        >
          {labels.view}
        </Button>
      </div>
    </div>
  );
};

export default MapInfoWindow;
