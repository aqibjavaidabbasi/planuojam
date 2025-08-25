import { Location } from '@/components/global/MapboxMap';
import { ListingItem, Vendor } from '../types/pagesTypes';

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

async function geocodePlace(placeName: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const encodedPlaceName = encodeURIComponent(placeName);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedPlaceName}.json?access_token=${mapboxToken}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed for ${placeName}: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      return {
        lat,
        lng,
        address: feature.place_name || placeName,
      };
    } else {
      throw new Error(`No results found for ${placeName}`);
    }
  } catch (error) {
    console.error(`Error geocoding ${placeName}:`, error);
    return null;
  }
}

async function geocodeLocations(listings: ListingItem[]): Promise<Location[]> {
  const locations: Location[] = [];

  if (!mapboxToken) {
    console.error('Mapbox API key not found');
    return locations;
  }

  for (const listing of listings) {
    const vendor = listing.listingItem.find(
      (item): item is Vendor => item.__component === 'dynamic-blocks.vendor'
    );

    if (!vendor || !vendor.serviceArea) continue;

    const baseData = {
      username: listing.user?.username || 'Unknown',
      description: listing.description || '',
      category: {
        name: listing.category?.name || 'Uncategorized',
        type: 'vendor' as const,
      },
    };
    for (const area of vendor.serviceArea) {
      const { city, state } = area;

      const cityCoords = await geocodePlace(city.name);
      if (!cityCoords) continue;

      locations.push({
        id: Number(`${listing.id}${Math.floor(Math.random() * 10000)}`),
        name: city.name,
        position: { lat: cityCoords.lat, lng: cityCoords.lng },
        address: cityCoords.address,
        description: baseData.description,
        username: baseData.username,
        category: baseData.category,
      });

      const stateCoords = await geocodePlace(state.name);
      if (!stateCoords) continue;

      locations.push({
        id: Number(`${listing.id}${Math.floor(Math.random() * 10000)}`),
        name: state.name,
        position: { lat: stateCoords.lat, lng: stateCoords.lng },
        address: stateCoords.address,
        description: baseData.description,
        username: baseData.username,
        category: baseData.category,
      });
    }

  }
  return locations;
}

export default geocodeLocations;
