import { Location } from '@/components/global/GoogleMap';
import { ListingItem, Vendor } from '../types/pagesTypes'; 

async function geocodeLocations(listings: ListingItem[]): Promise<Location[]> {
  const locations: Location[] = [];
  const geocoder = new google.maps.Geocoder();

  // Helper function to geocode a place name
  async function geocodePlace(placeName: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { address: placeName },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed for ${placeName}: ${status}`));
            }
          }
        );
      });
      const { lat, lng } = response[0].geometry.location;
      return { lat: lat(), lng: lng() };
    } catch (error) {
      console.error(`Error geocoding ${placeName}:`, error);
      return null;
    }
  }

  for (const listing of listings) {
    // Extract Vendor from listingItem
    const vendor = listing.listingItem.find(
      (item): item is Vendor => item.__component === 'dynamic-blocks.vendor'
    );
    if (!vendor || !vendor.serviceArea) continue; // Skip if no vendor or serviceArea
    const { countries = [], cities = [], states = [] } = vendor.serviceArea;

    // If countries are defined, create one marker per country
    if (countries.length > 0) {
      for (const country of countries) {
        const coords = await geocodePlace(country.name);
        if (!coords) continue; // Skip if geocoding fails

        // Format description with cities and states
        const cityList = cities.length > 0 ? `Cities: ${cities.map(c => c.name).join(', ')}` : '';
        const stateList = states.length > 0 ? `States: ${states.map(s => s.name).join(', ')}` : '';
        const description = [cityList, stateList].filter(Boolean).join('; ');

        locations.push({
          id: (listing.id + Math.random()),
          name: country.name,
          description: description || listing.description, // Fallback to listing description if no cities/states
          position: coords,
        });
      }
    } else {
      // No countries: create markers for cities and states
      for (const city of cities) {
        const coords = await geocodePlace(city.name);
        if (!coords) continue;

        locations.push({
        id: (listing.id + Math.random()),
          name: city.name,
          description: listing.description,
          position: coords,
        });
      }

      for (const state of states) {
        const coords = await geocodePlace(state.name);
        if (!coords) continue;

        locations.push({
        id: (listing.id + Math.random()),
          name: state.name,
          description: listing.description,
          position: coords,
        });
      }
    }
  }

  return locations;
}

export default geocodeLocations;