"use client";
import React from 'react';
import { Location } from './MapboxMap';
import Image from 'next/image';
import { getCompleteImageUrl } from '@/utils/helpers';
import { getHotDealInfo, getUpcomingHotDealMessage } from '@/utils/hotDealHelper';

type Props = {
  selectedLocation: Location;
  labels: {
    user: string;
    category: string;
    location: string;
    view: string;
    hot: string;
    deal: string;
  };
  href: string;
  currencySymbol: string;
};

const MapInfoWindow: React.FC<Props> = ({ selectedLocation, labels, href, currencySymbol }) => {
  // Get hot deal information
  const hotDealInfo = getHotDealInfo(selectedLocation.hotDeal);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Check if there are valid YouTube videos
  const youtubeVideos = selectedLocation.videos?.map(video => ({
    ...video,
    videoId: getYouTubeId(video.url)
  })).filter(v => v.videoId) || [];

  const hasMedia = selectedLocation?.image?.url || youtubeVideos.length > 0;

  return (
    <div 
      className="text-sm font-sans bg-white rounded-lg overflow-hidden" 
      style={{ 
          width: '320px',
          boxShadow: "rgba(0, 0, 0, 0.4) -20px 20px 40px, rgba(0, 0, 0, 0.4) 20px 20px 40px, rgba(0, 0, 0, 0.25) 10px 10px 20px"
      }}
    >
      {/* Upcoming Hot Deal Banner */}
      {hotDealInfo.status === 'upcoming' && (
        <div className="bg-linear-to-r from-orange-500 to-red-500 text-white text-center text-xs font-semibold py-1">
          {getUpcomingHotDealMessage(selectedLocation.hotDeal)}
        </div>
      )}

      {/* Media container with overlays */}
      <div className="relative h-48 bg-linear-to-tr from-teal-100 to-rose-100 flex items-center justify-center overflow-hidden">
        {hasMedia ? (
          <>
            {/* Display first image or first YouTube video */}
            {selectedLocation?.image?.url && !selectedLocation.image.mime?.startsWith('video/') ? (
              <Image
                src={getCompleteImageUrl(selectedLocation.image.url)}
                alt={selectedLocation.name}
                fill
                sizes="320px"
                className="object-cover"
              />
            ) : youtubeVideos.length > 0 ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideos[0].videoId}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="text-4xl select-none">
                {selectedLocation?.category?.type === 'venue' ? '🏛️' : selectedLocation?.category?.type === 'vendor' ? '🏪' : '📍'}
              </div>
            )}
          </>
        ) : (
          <div className="text-4xl select-none">
            {selectedLocation?.category?.type === 'venue' ? '🏛️' : selectedLocation?.category?.type === 'vendor' ? '🏪' : '📍'}
          </div>
        )}

        <div className='absolute top-3 right-3 z-10 flex flex-row-reverse gap-2 items-start'>
          {hotDealInfo.status === 'active' && (
              <div className="mb-4">
                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center transform rotate-12">
                  <div className="text-center">
                    <div className="text-xs font-bold">{labels.hot}</div>
                    <div className="text-xs">{labels.deal}</div>
                  </div>
                </div>
              </div>
          )}
          {selectedLocation.price !== undefined && selectedLocation.price !== null && (
            <div className="bg-primary text-white px-3 py-1.5 rounded-md">
              <div className="text-sm font-bold">{currencySymbol}{selectedLocation.price}</div>
            </div>
          )}
        </div>

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
