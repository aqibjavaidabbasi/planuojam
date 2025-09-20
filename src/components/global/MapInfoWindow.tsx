"use client";
// components/MapInfoWindow.tsx
import React from 'react';
import { Location } from './MapboxMap'; // adjust path if needed
import Button from '../custom/Button';

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
    if (typeof window !== 'undefined') {
      window.location.assign(href);
    }
  };

  return (
    <div className="w-[240px] text-sm font-sans">
      <h2 className="text-lg font-semibold text-primary">{selectedLocation.name}</h2>
      <p className="text-gray-600"><strong>{labels.user}:</strong> {selectedLocation.username}</p>
      <p className="text-gray-600"><strong>{labels.category}:</strong> {selectedLocation?.category?.name}</p>
      <p className="text-gray-600"><strong>{labels.location}:</strong> {selectedLocation.address}</p>
      <p className="text-gray-700 my-1 truncate">{selectedLocation.description}</p>
      <Button style='secondary'  size='small' onClick={handleViewClick}>{labels.view}</Button>
    </div>
  );
};

export default MapInfoWindow;
