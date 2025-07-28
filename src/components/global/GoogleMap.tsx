// app/components/GoogleMap.tsx
'use client';

import { useState, useEffect, CSSProperties } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';

const mapContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

const LATITUDE = 55.1694;
const LONGITUDE = 23.8813;

const defaultCenter = {
  lat: LATITUDE,
  lng: LONGITUDE,
};

// Dummy data for markers
const dummyLocations = [
  {
    id: 1,
    name: 'Coffee Shop',
    position: { lat: LATITUDE + 0.01, lng: LONGITUDE + 0.01 },
    description: 'A cozy coffee shop with great lattes.',
  },
  {
    id: 2,
    name: 'City Park',
    position: { lat: LATITUDE - 0.01, lng: LONGITUDE - 0.01 },
    description: 'A beautiful park for a relaxing walk.',
  },
  {
    id: 3,
    name: 'Library',
    position: { lat: LATITUDE + 0.015, lng: LONGITUDE - 0.015 },
    description: 'A quiet place to read and study.',
  },
];

type MapProps = {
  selectedPlace: google.maps.places.PlaceResult | null;
};

const Map = ({ selectedPlace }: MapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<(typeof dummyLocations)[0] | null>(null);

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // When the selected place changes, move the map
  useEffect(() => {
    if (map && selectedPlace?.geometry?.location) {
      map.panTo(selectedPlace.geometry.location);
      map.setZoom(15);
    }
  }, [selectedPlace, map]);

  return (
    <div className="relative w-full h-0 pb-[56.25%]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={6}
        onLoad={onLoad}
      >
        {dummyLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            title={location.name}
            onClick={() => setSelectedLocation(location)}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={selectedLocation.position}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="p-2">
              <h3 className="font-bold">{selectedLocation.name}</h3>
              <p>{selectedLocation.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default Map;
