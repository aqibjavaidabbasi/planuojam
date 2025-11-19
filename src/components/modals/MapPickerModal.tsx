"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Modal from "../custom/Modal";
import Button from "../custom/Button";
import MapboxSearch from "../global/MapboxSearch";
import { useTranslations } from "next-intl";

const DEFAULT_LAT = 55.1694;
const DEFAULT_LNG = 23.8813;

export type MapPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initial?: { lat?: number; lng?: number };
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, onClose, onSelect, initial}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initial?.lat ?? DEFAULT_LAT,
    lng: initial?.lng ?? DEFAULT_LNG,
  });

  useEffect(() => {
    if (!isOpen) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    if (!token) {
      // If no token, keep modal but disable map rendering
      console.error("Mapbox token missing");
      return;
    }
    mapboxgl.accessToken = token;

    if (!mapContainer.current) return;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [coords.lng, coords.lat],
      zoom: 12,
      attributionControl: false,
      cooperativeGestures: true,
    });

    // Controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Draggable marker
    const marker = new mapboxgl.Marker({ draggable: true, anchor: "bottom" })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapRef.current);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      setCoords({ lat: pos.lat, lng: pos.lng });
    });

    // Click to move marker
    const handleMapClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      const { lng, lat } = e.lngLat;
      setCoords({ lat, lng });
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        marker.setLngLat([lng, lat]);
      }
    };
    mapRef.current.on('click', handleMapClick);

    markerRef.current = marker;

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    // When initial changes upon opening, reset coords and marker
    if (!isOpen) return;
    const next = {
      lat: initial?.lat ?? DEFAULT_LAT,
      lng: initial?.lng ?? DEFAULT_LNG,
    };
    setCoords(next);
    if (mapRef.current) {
      mapRef.current.setCenter([next.lng, next.lat]);
      if (markerRef.current) markerRef.current.setLngLat([next.lng, next.lat]);
    }
  }, [initial, isOpen]);

  const handlePlaceSelect = (place: { geometry: { location: { lat: number; lng: number } } } | null) => {
    if (!place) return;
    const { lat, lng } = place.geometry.location;
    setCoords({ lat, lng });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
      if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
    }
  };

  const t = useTranslations("Modals.MapPicker")

  const footer = (
    <div className="flex flex-col md:flex-row items-start md:items-center  justify-start md:justify-between gap-3">
      <div className="text-sm text-gray-600">
        <span className="font-medium">
          {t("lat")}  
        </span> {coords.lat.toFixed(6)}
        <span className="mx-2">|</span>
        <span className="font-medium">
          {t("lng")}  
        </span> {coords.lng.toFixed(6)}
      </div>
      <div className="ml-auto flex gap-2">
        <Button style="ghost" onClick={onClose}>{t("cancel")}</Button>
        <Button style="primary" onClick={() => onSelect(coords.lat, coords.lng)}>{t("useThisLocation")}</Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" footer={footer}>
      <div className="flex flex-col gap-3 p-5">
        <MapboxSearch onPlaceSelect={handlePlaceSelect} />
        <div className="w-full h-[60vh] border rounded-lg overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>
    </Modal>
  );
};

export default MapPickerModal;
