import { Location } from '@/components/global/MapboxMap';
import { ListingItem, Venue, Vendor } from '@/types/pagesTypes';
import { getListingPath } from '@/utils/routes';
import { strapiImage } from '@/types/mediaTypes';

interface CreateLocationOptions {
  listing: ListingItem;
  locale: string;
  overrides?: {
    name?: string;
    description?: string;
    title?: string;
    address?: string;
    position?: { lat: number; lng: number };
  };
}

interface VenueData {
  position: { lat: number; lng: number };
  address: string;
  capacity?: number;
}

interface VendorData {
  position: { lat: number; lng: number };
  address: string;
  name: string;
}

/**
 * Safely extracts venue data from a listing
 */
function extractVenueData(listing: ListingItem): VenueData | null {
  const venue = listing.listingItem.find(
    (item): item is Venue => item.__component === 'dynamic-blocks.venue'
  );

  if (!venue?.location) {
    return null;
  }

  const { latitude, longitude, address } = venue.location;
  
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return {
    position: { lat: latitude, lng: longitude },
    address: address || 'No address provided',
    capacity: venue.capacity,
  };
}

/**
 * Safely extracts vendor data from a listing
 */
function extractVendorData(listing: ListingItem): VendorData[] {
  const vendor = listing.listingItem.find(
    (item): item is Vendor => item.__component === 'dynamic-blocks.vendor'
  );

  if (!vendor?.serviceArea || vendor.serviceArea.length === 0) {
    return [];
  }

  return vendor.serviceArea
    .filter(area => 
      typeof area.latitude === 'number' && 
      typeof area.longitude === 'number'
    )
    .map(area => {
      const cityName = area.city?.name || 'Unknown';
      const stateName = area.state?.name || 'Unknown';
      const name = `${cityName}, ${stateName}`;
      
      return {
        position: { lat: area.latitude, lng: area.longitude },
        address: name,
        name,
      };
    });
}

/**
 * Gets the primary image for a listing
 */
function getPrimaryImage(listing: ListingItem): strapiImage {
  return (listing.portfolio && listing.portfolio.length > 0)
    ? listing.portfolio[0]
    : listing.category?.image || { url: '/noImage.jpg', mime: 'image/jpeg' };
}

/**
 * Creates Location objects from a ListingItem in a type-safe manner
 * 
 * @param options - Configuration options for location creation
 * @returns Array of Location objects (empty if no valid location data)
 */
export function createLocationFromListing(options: CreateLocationOptions): Location[] {
  const { listing, locale, overrides } = options;
  
  const primaryImage = getPrimaryImage(listing);
  const path = getListingPath(listing.slug, locale);

  // Common base data for all location objects
  const baseData = {
    username: listing.user?.username || 'Unknown',
    description: overrides?.description || listing.description || '',
    category: {
      name: listing.category?.name || 'Uncategorized',
      type: listing.type as 'vendor' | 'venue' | string,
    },
    image: primaryImage,
    videos: listing.videos,
    path,
    price: listing.price,
    averageRating: listing.averageRating,
    hotDeal: listing.hotDeal,
  };

  if (listing.type === 'venue') {
    const venueData = extractVenueData(listing);
    if (!venueData) {
      return [];
    }

    return [{
      id: listing.id,
      name: overrides?.name || listing.title || 'Unnamed Venue',
      title: overrides?.title || listing.title,
      position: overrides?.position || venueData.position,
      address: overrides?.address || venueData.address,
      maximumCapacity: venueData.capacity,
      ...baseData,
    }];
  }

  if (listing.type === 'vendor') {
    const vendorDataArray = extractVendorData(listing);
    if (vendorDataArray.length === 0) {
      return [];
    }

    return vendorDataArray.map((vendorData, index) => ({
      id: Number(`${listing.id}${index}`), // Unique ID for each service area
      name: overrides?.name || vendorData.name,
      title: overrides?.title || listing.title,
      position: overrides?.position || vendorData.position,
      address: overrides?.address || vendorData.address,
      maximumCapacity: undefined, // Vendors don't have capacity
      ...baseData,
    }));
  }

  return [];
}

/**
 * Creates a single Location object from a ListingItem (for detail pages)
 * Returns the first valid location found
 */
export function createSingleLocationFromListing(options: CreateLocationOptions): Location | null {
  const locations = createLocationFromListing(options);
  return locations.length > 0 ? locations[0] : null;
}
