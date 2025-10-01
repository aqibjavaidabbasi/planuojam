"use client";

import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapInfoWindow from "./MapInfoWindow";
import { useLocale, useTranslations } from "next-intl";
import { strapiImage } from "@/types/common";

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
  image: strapiImage;
  path: string; // precomputed navigation path matching ListingCard
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
        // Create marker element using custom SVG from public
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker cursor-pointer';
        const img = document.createElement('img');
        img.src = '/map-marker.svg'; // served from frontend/public
        img.alt = 'Marker';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.objectFit = 'contain';
        img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))';
        markerEl.appendChild(img);

        // Create popup using React component
        const popupContainer = document.createElement('div');
        let root: ReactDOM.Root | null = null;
        const popup = new mapboxgl.Popup({
          anchor: 'bottom',
          offset: 24, // push popup above the marker
          closeButton: false,
          maxWidth: '400px',
        })
          .setDOMContent(popupContainer)
          .on('open', () => {
            // Pan map upward so popup stays fully visible and not cut off
            if (map.current) {
              map.current.easeTo({
                center: [location.position.lng, location.position.lat],
                // Negative y moves the map content up, showing space above the marker for the popup
                offset: [0, 200],
                duration: 300,
              });
            }
            if (!root) {
              root = ReactDOM.createRoot(popupContainer);
              const href = `/${locale}${location.path || ''}`;
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
              // Defer unmount to avoid synchronous unmount during React render
              const toUnmount = root;
              root = null;
              setTimeout(() => {
                try { toUnmount.unmount(); } catch {}
              }, 0);
            }
          });

        // Add marker to map
        if (map.current) {
          new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
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
