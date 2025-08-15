// components/MapInfoWindow.tsx
import React from 'react';
import { Location } from './MapboxMap'; // adjust path if needed
import { useRouter } from 'next/navigation';
import Button from '../custom/Button';

type Props = {
  selectedLocation: Location;
};

const MapInfoWindow: React.FC<Props> = ({ selectedLocation }) => {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/vendor/${selectedLocation.id}`);
  };

  return (
    <div className="w-[240px] text-sm font-sans">
      <h2 className="text-lg font-semibold text-primary">{selectedLocation.name}</h2>
      <p className="text-gray-600"><strong>User:</strong> {selectedLocation.username}</p>
      <p className="text-gray-600"><strong>Category:</strong> {selectedLocation?.category?.name}</p>
      <p className="text-gray-600"><strong>Location:</strong> {selectedLocation.address}</p>
      <p className="text-gray-700 my-1 truncate">{selectedLocation.description}</p>
      <Button style='secondary'  size='small' onClick={handleViewClick}>view</Button>
    </div>
  );
};

export default MapInfoWindow;
