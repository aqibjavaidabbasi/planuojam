import { Location } from '@/components/global/MapboxMap';
import { ListingItem, Vendor } from '../types/pagesTypes';
import toast from 'react-hot-toast';

// Build Location[] directly from vendor serviceArea coordinates without external API calls.
// Keep async signature to avoid changing existing callers.
async function geocodeLocations(listings: ListingItem[]): Promise<Location[]> {
  const locations: Location[] = [];

  for (const listing of listings) {
    const vendor = listing.listingItem.find(
      (item): item is Vendor => item.__component === 'dynamic-blocks.vendor'
    );

    if (!vendor || !vendor.serviceArea || vendor.serviceArea.length === 0) continue;

    const baseData = {
      username: listing.user?.username || 'Unknown',
      description: listing.description || '',
      category: {
        name: listing.category?.name || 'Uncategorized',
        type: 'vendor' as const,
      },
    };

    for (const area of vendor.serviceArea) {
      // Prefer provided coordinates; if missing, skip to avoid API calls
      if (typeof area.latitude !== 'number' || typeof area.longitude !== 'number') continue;

      const name = area.city?.name && area.state?.name
        ? `${area.city.name}, ${area.state.name}`
        : area.city?.name || area.state?.name || 'Service Area';

      const address = name; // We don't perform reverse geocoding; use name as address label

      locations.push({
        id: Number(`${listing.id}${Math.floor(Math.random() * 10000)}`),
        name,
        position: { lat: area.latitude, lng: area.longitude },
        address,
        description: baseData.description,
        username: baseData.username,
        category: baseData.category,
      });
    }
  }

  return locations;
}

export default geocodeLocations;

// Named helper to geocode a place using Mapbox when explicitly needed.
// Accepts either city, state, or both. Returns the first match.
export type GeocodeResult = { lat: number; lng: number; address: string };

export async function geocodePlace(city?: string, state?: string): Promise<GeocodeResult | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  if (!city && !state) {
    toast.error("Please add a city or state to get coordinates")
    return null;
  }
  if (!mapboxToken) {
    toast.error("Something went wrong! Please add coordinates manually")
    return null;
  }

  const query = [city, state].filter(Boolean).join(', ').trim();
  const encoded = encodeURIComponent(query);

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&limit=1`
    );
    if (!res.ok) {
      throw new Error("We are unable to get your location coordinates. Please add manually")
    }
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature || !Array.isArray(feature.center) || feature.center.length < 2) return null;
    const [lng, lat] = feature.center;
    return {
      lat,
      lng,
      address: feature.place_name || query,
    };
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Something went wrong! Please add coordinates manually")
    return null;
  }
}
