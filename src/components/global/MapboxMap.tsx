"use client";

import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapInfoWindow from "./MapInfoWindow";
import { useLocale, useTranslations } from "next-intl";

const LATITUDE = 55.1694;
const LONGITUDE = 23.8813;

export interface Location {
  id: number;
  name: string;
  username: string;
  description: string;
  category: {
    name: string;
    type: "vendor" | "venue" | string;
  };
  position: {
    lat: number;
    lng: number;
  };
  address: string;
}

type MapProps = {
  selectedPlace?: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  } | null;
  locations: Location[];
};

const MapboxMap = ({ selectedPlace, locations }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const t = useTranslations('Map.infoWindow');
  const locale = useLocale();

  useEffect(() => {
    if (!mapContainer.current) {
      console.log("Map container not ready");
      return;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    if (!mapboxToken) {
      console.error("Mapbox API key not found");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map immediately
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [LONGITUDE, LATITUDE],
      zoom: 6,
      attributionControl: false,
      cooperativeGestures: true, //uses ctrl/command for zooming
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }), "top-left");

    // Add attribution
    map.current.addControl(new mapboxgl.AttributionControl(), "bottom-left");

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current) {
      console.log("Map not ready for markers");
      return;
    }

    // Wait for map to be loaded
    const addMarkers = () => {
      if (!map.current) return;

      // Remove existing markers
      const existingMarkers = document.querySelectorAll('.mapbox-marker');
      existingMarkers.forEach(marker => marker.remove());

      locations.forEach((location) => {
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker cursor-pointer';
        markerEl.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cc922f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        `;

        // Create popup using React component
        const popupContainer = document.createElement('div');
        let root: ReactDOM.Root | null = null;
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContainer)
          .on('open', () => {
            if (!root) {
              root = ReactDOM.createRoot(popupContainer);
              const hrefBase = location?.category?.type === 'venue' ? 'venue' : 'vendor';
              const href = `/${locale}/${hrefBase}/${location.id}`;
              root.render(
                <MapInfoWindow 
                  selectedLocation={location}
                  labels={{
                    user: t('user'),
                    category: t('category'),
                    location: t('location'),
                    view: t('view'),
                  }}
                  href={href}
                />
              );
            }
          })
          .on('close', () => {
            if (root) {
              root.unmount();
              root = null;
            }
          });

        // Add marker to map
        if (map.current) {
          new mapboxgl.Marker(markerEl)
            .setLngLat([location.position.lng, location.position.lat])
            .setPopup(popup)
            .addTo(map.current);
        }
      });
    };

    // Wait for map to be loaded before adding markers
    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [locations, t, locale]);

  // Move map when selected place changes
  useEffect(() => {
    if (map.current && selectedPlace?.geometry?.location) {
      map.current.flyTo({
        center: [selectedPlace.geometry.location.lng, selectedPlace.geometry.location.lat],
        zoom: 15,
      });
    }
  }, [selectedPlace]);

  return (
    <div className="w-full h-full relative border border-gray-200 rounded-lg overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
    </div>
  );
};

export default MapboxMap;
