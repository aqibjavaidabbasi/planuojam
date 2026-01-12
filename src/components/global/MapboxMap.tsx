"use client";

import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapInfoWindow from "./MapInfoWindow";
import { useLocale, useTranslations } from "next-intl";
import { strapiImage } from "@/types/mediaTypes";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { HotDeal } from "@/utils/hotDealHelper";

const LATITUDE = 55.1694;
const LONGITUDE = 23.8813;

export interface Location {
  id: number;
  name: string;
  title?: string;
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
  videos?: { url: string }[];
  path: string; // precomputed navigation path matching ListingCard
  price?: number;
  averageRating?: number;
  maximumCapacity?: number;
  hotDeal?: HotDeal;
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
  const tMap = useTranslations('Map.infoWindow');
  const tCard = useTranslations('Dynamic.ListingCard');
  const locale = useLocale();
  const [mapError, setMapError] = useState(false);
  const { siteSettings } = useSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    if (!mapContainer.current) {
      console.log("Map container not ready");
      return;
    }
    const containerEl = mapContainer.current;

    // Prevent double-initialization (e.g., in React Strict Mode) and ensure empty container
    if (map.current) {
      return;
    }
    // Ensure the container is completely empty before creating the map
    try {
      while (containerEl.firstChild) {
        containerEl.removeChild(containerEl.firstChild);
      }
    } catch { }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    if (!mapboxToken) {
      console.error("Mapbox API key not found");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      // Initialize map immediately
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [LONGITUDE, LATITUDE],
        zoom: 6,
        attributionControl: false,
        cooperativeGestures: true, //uses ctrl/command for zooming
      });
    } catch (error) {
      console.error("Failed to initialize Mapbox map:", error);
      setMapError(true);
      return;
    }

    // Ensure browser does not try to treat touch as scroll on the map surface
    try {
      const canvas = map.current.getCanvas();
      const canvasContainer = map.current.getCanvasContainer();
      if (canvas) {
        canvas.style.touchAction = 'none';
      }
      if (canvasContainer) {
        canvasContainer.style.touchAction = 'none';
      }
    } catch { }

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
        map.current = null;
      }
      // Also clear any remaining nodes inside the container to keep it empty
      try {
        while (containerEl.firstChild) {
          containerEl.removeChild(containerEl.firstChild);
        }
      } catch { }
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

      // Remove existing markers and their popups
      const existingMarkers = document.querySelectorAll('.mapbox-marker');
      existingMarkers.forEach(marker => {
        try {
          // Check if marker has an associated popup and close it first
          const markerElement = marker as { _popup?: mapboxgl.Popup };
          const popup = markerElement._popup;
          if (popup) {
            popup.remove();
          }
          
          if (marker.parentNode) {
            marker.remove();
          }
        } catch (error) {
          // Ignore errors during cleanup (node might already be removed)
          console.warn('Marker cleanup error:', error);
        }
      });

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
            // Only create root if it doesn't exist yet
            if (!root) {
              root = ReactDOM.createRoot(popupContainer);
              const href = `${baseUrl}/${locale}${location.path || ''}`;
              root.render(
                <MapInfoWindow
                  selectedLocation={location}
                  labels={{
                    user: tMap('user'),
                    category: tMap('category'),
                    location: tMap('location'),
                    view: tMap('view'),
                    hot: tCard('hot'),
                    deal: tCard('deal'),
                  }}
                  href={href}
                  currencySymbol={siteSettings?.currency?.symbol || '$'}
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
                try { 
                  toUnmount.unmount(); 
                } catch (error) {
                  // Ignore errors during cleanup (node might already be removed)
                  console.warn('Popup cleanup error:', error);
                }
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
      map.current.once('load', addMarkers);
    }
  }, [locations, tMap, tCard, locale, siteSettings.currency, baseUrl]);

  // Move map when selected place changes
  useEffect(() => {
    if (map.current && selectedPlace?.geometry?.location) {
      map.current.flyTo({
        center: [selectedPlace.geometry.location.lng, selectedPlace.geometry.location.lat],
        zoom: 15,
      });
    }
    if (map.current && locations.length === 1) {
      map.current.flyTo({
        center: [locations[0].position.lng, locations[0].position.lat],
        zoom: 15,
      });
    }
  }, [selectedPlace, locations]);

  return (
    <div className="w-full h-full relative border border-gray-200 rounded-lg overflow-hidden" style={{ overscrollBehavior: 'contain' }}>
      {mapError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Map Unavailable</p>
            <p className="text-sm">WebGL is not supported or disabled in this browser.</p>
          </div>
        </div>
      ) : (
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  );
};

export default MapboxMap;
