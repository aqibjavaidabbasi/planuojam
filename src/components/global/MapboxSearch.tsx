'use client';

import React, { useState, useEffect, useRef } from 'react';
import Input from '../custom/Input';
import { useTranslations } from 'next-intl';

interface MapboxSearchProps {
  onPlaceSelect: (place: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_name: string;
  } | null) => void;
}

const MapboxSearch = ({ onPlaceSelect }: MapboxSearchProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    center: [number, number];
    place_name: string;
    text: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  const t = useTranslations('MapboxSearch');

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox API key not found');
      return;
    }

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.features || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, mapboxToken]);

  const handleSuggestionClick = (suggestion: {
    center: [number, number];
    place_name: string;
    text: string;
  }) => {
    const [lng, lat] = suggestion.center;
    onPlaceSelect({
      geometry: {
        location: {
          lat,
          lng,
        },
      },
      place_name: suggestion.place_name,
    });
    setQuery(suggestion.place_name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value) {
      onPlaceSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        placeholder={t('placeholder')}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm font-medium text-gray-800">
                {suggestion.text}
              </div>
              <div className="text-xs text-gray-500">
                {suggestion.place_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && query.length >= 3 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">{t('noResults')}</div>
        </div>
      )}
    </div>
  );
};

export default MapboxSearch;
