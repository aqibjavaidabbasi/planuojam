import { LISTING_ITEM_POP_STRUCTURE } from "@/utils/ListingItemStructure";
import { createQuery, deleteAPI, fetchAPI, fetchAPIWithToken, postAPIWithToken, putAPI } from "./api";
import { getUsersByDocumentIds, MinimalUserInfo } from "./auth";
import { triggerNotificationEmail } from "@/utils/emailTrigger";
import { ListingItem } from "@/types/pagesTypes";

// Types for booking entities kept minimal to avoid tight coupling
export interface BookingPayload {
  listing: string; // listing documentId
  userDocumentId: string; // user documentId (no relation)
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  bookingStatus?: "pending" | "confirmed" | "cancelled" | "rejected" | "completed";
  // Optional pricing selections
  selectedPlan?: {
    name?: string;
    price?: number;
    features?: { statement: string }[];
  } | null;
  selectedAddons?: { statement: string; price?: number }[] | null;
}

// Public version for fetching bookings on listing details page without requiring auth
export async function getListingBookingsPublic(
  listingDocumentId: string,
  startISO?: string,
  endISO?: string,
  locale?: string
): Promise<BookingItem[]> {
  try {
    const populate = { 
      listing: { populate: "*" },
      selectedPlan: { 
        populate: {
          features: { populate: "*" }
        }
      },
      selectedAddons: { populate: "*" }
    };
    let filters: Record<string, unknown> = {
      filters: {
        listing: { documentId: { $eq: listingDocumentId } },
        bookingStatus: { $ne: "cancelled" },
      },
    };
    if (startISO && endISO) {
      filters = {
        filters: {
          $and: [
            { listing: { documentId: { $eq: listingDocumentId } } },
            { bookingStatus: { $ne: "cancelled" } },
            { startDateTime: { $lt: endISO } },
            { endDateTime: { $gt: startISO } },
          ],
        },
      };
    }
    const query = createQuery(populate, locale ? { locale } : {});
    const res = await fetchAPI("bookings", query, filters);
    return Array.isArray(res) ? (res as BookingItem[]) : [];
  } catch (err) {
    // Surface no data on public errors; page should gracefully render empty calendar
    console.error(err);
    return [];
  }
}


export interface BookingItem {
  id: number;
  documentId: string;
  startDateTime: string;
  endDateTime: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "rejected" | "completed";
  listing?: ListingItem;
  // Optional pricing selections saved with the booking
  selectedPlan?: {
    name?: string;
    price?: number;
    features?: { statement: string }[];
  } | null;
  selectedAddons?: { statement: string; price?: number }[] | null;
}

export type BookingStatusFilter = "pending" | "confirmed" | "cancelled" | "rejected" | "completed" | "all";

export type EnrichedBooking = BookingItem & {
  userInfo: MinimalUserInfo | null;
};

// Get bookings for a provider (owner of listings) and enrich with user info
export async function getProviderBookingsWithUsers(
  providerDocumentId: string,
  locale?: string,
  status?: BookingStatusFilter
): Promise<EnrichedBooking[]> {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("Errors.Booking.noAuth");

    // Populate listing (which includes its user relation); filter by listing.user.documentId
    const populate = {
      listing: {
        populate: LISTING_ITEM_POP_STRUCTURE
      },
      selectedPlan: { 
        populate: {
          features: { populate: "*" }
        }
      },
      selectedAddons: { populate: "*" }
    };
    const baseFilters: Record<string, unknown> = {
      filters: { listing: { user: { documentId: { $eq: providerDocumentId } } } },
    };
    if (status && status !== "all") {
      baseFilters.filters = {
        $and: [
          { listing: { user: { documentId: { $eq: providerDocumentId } } } },
          { bookingStatus: { $eq: status } },
        ],
      };
    }
    const query = createQuery(populate, locale ? { locale } : {});
    const res = await fetchAPIWithToken("bookings", query, baseFilters, jwt);
    const bookings: BookingItem[] = Array.isArray(res?.data) ? (res.data as BookingItem[]) : [];

    // Collect unique booking.userDocumentId values to fetch user info
    const userDocIds: string[] = Array.from(
      new Set(
        (bookings as Array<{ userDocumentId?: unknown }>)
          .map((b) => b.userDocumentId)
          .filter((id): id is string => typeof id === "string" && !!id)
      )
    );

    const users: MinimalUserInfo[] = await getUsersByDocumentIds(userDocIds);
    const usersMap = new Map(users.map((u) => [u.documentId, u]));

    // Enrich bookings
    const enriched: EnrichedBooking[] = (bookings || []).map((b) => ({
      ...b,
      userInfo: usersMap.get((b as unknown as { userDocumentId?: string }).userDocumentId || "") || null,
    }));
    return enriched;
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.loadProviderFailed");
  }
}

// Create a booking
export async function createBooking(data: BookingPayload, locale?: string) {
  // Send body with data wrapper; populate listing only
  const populate = {
    listing: { populate: "*" },
    selectedPlan: { 
      populate: {
        features: { populate: "*" }
      }
    },
    selectedAddons: { populate: "*" }
  };
  // Important: Strapi uses query param ?locale=xx for localized creation
  const query = createQuery(populate, locale ? { locale } : {});
  try {
    const body: Record<string, unknown> = { data };
    const res = await postAPIWithToken("bookings", body, {}, query);

    // TRIGGER EMAIL NOTIFICATIONS
    const created = res?.data;
    if (created && created.listing) {
      const listingTitle = created.listing.title || "Your Listing";
      const providerEmail = created.listing.user?.email;

      if (providerEmail) {
        triggerNotificationEmail('booking_provider', providerEmail, {
          username: created.listing.user?.username || "Service Provider",
          listingTitle,
          bookingDate: new Date(data.startDateTime).toLocaleString(),
        }, `New Booking Received: ${listingTitle}`, created.listing.user?.preferredLanguage || 'en');
      }
    }

    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.createFailed");
  }
}

// Get bookings for a specific listing; optionally check for overlap of [startDateTime, endDateTime); excludes cancelled by default
export async function getListingBookings(
  listingDocumentId: string,
  startISO?: string,
  endISO?: string,
  locale?: string
): Promise<BookingItem[]> {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("Errors.Booking.noAuth");

    const populate = { 
      listing: { populate: "*" },
      selectedPlan: { 
        populate: {
          features: { populate: "*" }
        }
      },
      selectedAddons: { populate: "*" }
    };
    // Base filters
    let filters: Record<string, unknown> = {
      filters: {
        listing: { documentId: { $eq: listingDocumentId } },
        bookingStatus: { $ne: "cancelled" },
      },
    };
    // If start/end provided, find any booking where (existing.start < end) AND (existing.end > start)
    if (startISO && endISO) {
      filters = {
        filters: {
          $and: [
            { listing: { documentId: { $eq: listingDocumentId } } },
            { bookingStatus: { $ne: "cancelled" } },
            { startDateTime: { $lt: endISO } },
            { endDateTime: { $gt: startISO } },
          ],
        },
      };
    }
    const query = createQuery(populate, locale ? { locale } : {});
    const res = await fetchAPIWithToken("bookings", query, filters, jwt);
    return Array.isArray(res?.data) ? (res.data as BookingItem[]) : [];
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.loadListingFailed");
  }
}

// Get bookings; if userId provided, filter by that user documentId
export async function getBookings(
  userDocumentId?: string,
  locale?: string,
  status?: BookingStatusFilter
): Promise<BookingItem[]> {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("Errors.Booking.noAuth");

    const populate = {
      listing: { populate: "*" },
      selectedPlan: { 
        populate: {
          features: { populate: "*" }
        }
      },
      selectedAddons: { populate: "*" }
    }
    const baseFilters: Record<string, unknown> = {};
    if (userDocumentId) {
      baseFilters.filters = { userDocumentId: { $eq: userDocumentId } };
    }
    if (status && status !== "all") {
      baseFilters.filters = baseFilters.filters
        ? { $and: [baseFilters.filters, { bookingStatus: { $eq: status } }] }
        : { bookingStatus: { $eq: status } };
    }
    const query = createQuery(populate, locale ? { locale } : {});
    const res = await fetchAPIWithToken("bookings", query, baseFilters, jwt);
    return Array.isArray(res?.data) ? (res.data as BookingItem[]) : [];
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.loadFailed");
  }
}

// Update a booking by id (document id)
export async function updateBooking(id: string, data: Partial<BookingPayload>) {
  try {
    const body: Record<string, unknown> = { data };
    const query = createQuery({}, { locale: "en" });
    const res = await putAPI(`bookings/${id}`, body, {}, query);
    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.updateFailed");
  }
}

// Delete a booking by id (document id)
export async function deleteBooking(id: string) {
  try {
    const res = await deleteAPI(`bookings/${id}`);
    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Errors.Booking.deleteFailed");
  }
}

