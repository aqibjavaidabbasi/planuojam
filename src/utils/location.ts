import { Location } from '@/components/global/GoogleMap';
import { ListingItem, Vendor } from '../types/pagesTypes';

async function geocodeLocations(listings: ListingItem[]): Promise<Location[]> {
  const locations: Location[] = [];
  const geocoder = new google.maps.Geocoder();

  async function geocodePlace(placeName: string): Promise<{ lat: number; lng: number; address: string } | null> {
    try {
      const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: placeName }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed for ${placeName}: ${status}`));
          }
        });
      });

      const result = response[0];
      const location = result.geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng(),
        address: result.formatted_address || placeName,
      };
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
