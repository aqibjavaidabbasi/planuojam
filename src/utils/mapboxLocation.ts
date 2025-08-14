import { Location } from '@/components/global/MapboxMap';
import { ListingItem, Vendor } from '../types/pagesTypes';

async function geocodeLocations(listings: ListingItem[]): Promise<Location[]> {
  const locations: Location[] = [];
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  if (!mapboxToken) {
    console.error('Mapbox API key not found');
    return locations;
  }

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

  for (const listing of listings) {
    const vendor = listing.listingItem.find(
      (item): item is Vendor => item.__component === 'dynamic-blocks.vendor'
    );

    if (!vendor || !vendor.serviceArea) continue;

    const { countries = [], cities = [], states = [] } = vendor.serviceArea;

    const baseData = {
      username: listing.user?.username || 'Unknown',
      description: listing.description || '',
      category: {
        name: listing.category?.name || 'Uncategorized',
        type: 'vendor' as const,
      },
    };

    if (countries.length > 0) {
      for (const country of countries) {
        const coords = await geocodePlace(country.name);
        if (!coords) continue;

        const cityList = cities.length > 0 ? `Cities: ${cities.map(c => c.name).join(', ')}` : '';
        const stateList = states.length > 0 ? `States: ${states.map(s => s.name).join(', ')}` : '';
        const fullDescription = [cityList, stateList].filter(Boolean).join('; ') || baseData.description;

        locations.push({
          id: Number(`${listing.id}${Math.floor(Math.random() * 10000)}`), // Ensuring unique id
          name: country.name,
          position: { lat: coords.lat, lng: coords.lng },
          address: coords.address,
          description: fullDescription,
          username: baseData.username,
          category: baseData.category,
        });
      }
    } else {
      for (const place of [...cities, ...states]) {
        const coords = await geocodePlace(place.name);
        if (!coords) continue;

        locations.push({
          id: Number(`${listing.id}${Math.floor(Math.random() * 10000)}`),
          name: place.name,
          position: { lat: coords.lat, lng: coords.lng },
          address: coords.address,
          description: baseData.description,
          username: baseData.username,
          category: baseData.category,
        });
      }
    }
  }

  return locations;
}

export default geocodeLocations;
