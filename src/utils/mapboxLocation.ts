import { Location } from '@/components/global/MapboxMap';
import { ListingItem, Vendor } from '../types/pagesTypes';
import { getListingPath } from './routes';

// Build Location[] directly from vendor serviceArea coordinates without external API calls.
// Keep async signature to avoid changing existing callers.
async function geocodeLocations(listings: ListingItem[], locale?: string): Promise<Location[]> {
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

    const primaryImage = (listing.portfolio && listing.portfolio.length > 0)
      ? listing.portfolio[0]
      : listing.category?.image;

    // Build listing path using centralized helper and current locale
    const path = getListingPath(listing.slug, locale);

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
        title: listing.title,
        position: { lat: area.latitude, lng: area.longitude },
        address,
        description: baseData.description,
        username: baseData.username,
        category: baseData.category,
        image: primaryImage,
        path,
      });
    }
  }

  return locations;
}

export default geocodeLocations;

export type GeocodeResult = { lat: number; lng: number; address: string };

export async function geocodePlace(city?: string, state?: string): Promise<GeocodeResult | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  if (!city && !state) {
    throw new Error('Errors.Map.addCityOrState');
  }
  if (!mapboxToken) {
    throw new Error('Errors.Map.addCoordinatesManually');
  }

  const query = [city, state].filter(Boolean).join(', ').trim();
  const encoded = encodeURIComponent(query);

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&limit=1`
    );
    if (!res.ok) {
      throw new Error('Errors.Map.unableToGetCoordinates');
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
    // Let callers decide how to display/translate the error
    if (err instanceof Error) throw err;
    throw new Error('Errors.Map.addCoordinatesManually');
  }
}
