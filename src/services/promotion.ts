import { postAPIWithToken, putAPI, fetchAPI, createQuery, fetchAPIWithToken } from "./api";
import { updateUserData } from "./auth";

export interface CreatePromotionPayload {
  listingDocumentId: string; // use documentId for listing
  starsUsed: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null
  maxClickPerDay?: number;
  starsPerClick?: number;
  maxStarsLimit?: number;
  successPercentage?: number;
  userDocumentId?: string; // to fill userDocId on backend
  currentUserId: number; // user simple id
  currentUserStars: number; // current stars to compute new value
}

export async function createPromotion(data: Record<string, unknown>) {

  console.log("paylaod", data)
  // Core create via Strapi
  return postAPIWithToken("promotions", data);
}

// Orchestrates: create promotion -> log star usage -> update user stars
export async function createPromotionWithStars(payload: CreatePromotionPayload) {
  const { listingDocumentId, starsUsed, startDate, endDate, maxClickPerDay, starsPerClick, maxStarsLimit, successPercentage, userDocumentId, currentUserStars } = payload;

  if (currentUserStars < starsUsed) {
    throw new Error("Insufficient stars");
  }

  // 1) Create promotion
  const promotionRes = await createPromotion({data: {
    promotionStatus: "ongoing",
    startDate: startDate,
    endDate: endDate ?? null,
    maxClickPerDay,
    starsPerClick,
    maxStarsLimit,
    successPercentage,
    listing: listingDocumentId,
    userDocId: userDocumentId,
    starsUsed: starsUsed,
  }});

  const promotion = promotionRes?.data ?? promotionRes;

  // 2) Deduct stars from user on backend
  try {
    const newStars = Math.max(0, Number(currentUserStars) - Number(starsUsed));
    if (Number.isFinite(newStars)) {
      await updateUserData(payload.currentUserId, { totalStars: newStars });
    }
  } catch (err) {
    // Do not block promotion creation on star update failure; let caller handle any UI sync if needed
    console.warn("Failed to update user stars after promotion creation", err);
  }

  return promotion;
}

// Update a promotion by numeric Strapi id
export async function updatePromotion(
  id: string | number,
  data: Record<string, unknown>,
  locale?: string,
) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';
  const baseHeaders: Record<string, string> = {};
  if (locale) {
    baseHeaders["X-Strapi-Locale"] = locale;
    baseHeaders["Content-Language"] = locale;
    baseHeaders["Accept-Language"] = locale;
  }
  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }
  const headers = Object.keys(baseHeaders).length ? baseHeaders : undefined;
  const query = locale ? `locale=${encodeURIComponent(locale)}` : undefined;

  const res = await putAPI(`promotions/${id}`, data, { headers }, query);
  return res.data;
}

// Get all promotions (optionally with locale, filters, sort, pagination)
export async function fetchAllPromotions(
  locale?: string,
  options?: {
    filters?: Record<string, unknown>;
    sort?: string[];
    pagination?: { page?: number; pageSize?: number };
    populate?: object;
  }
) {
  const { filters = {}, sort, pagination, populate = {} } = options || {};
  const additionalParams: Record<string, unknown> = {};
  if (locale) additionalParams.locale = locale;
  if (sort) additionalParams.sort = sort;
  if (pagination) additionalParams.pagination = pagination;

  const query = createQuery(populate, additionalParams);
  const data = await fetchAPI("promotions", query, Object.keys(filters).length ? { filters } : undefined);
  return Array.isArray(data) ? data : [];
}

// Get promotions for a user (filters by the listing's owner's documentId)
export async function fetchPromotionsByUser(
  userDocumentId: string,
) {
  const populate = {
    listing: {
      populate: {
        localizations: true
      }
    }
  };
  const jwt = localStorage.getItem('token') ?? ''

  const query = createQuery(populate);
  const filters = {
    filters: {
       userDocId: { $eq: userDocumentId },
    },
  };

  const data = await fetchAPIWithToken("promotions", query, filters, jwt);
  return Array.isArray(data.data) ? data.data : [];
}

// Get a single promotion by numeric Strapi id
export async function fetchPromotionById(id: string | number, locale?: string) {
  const populate = {
    listing: {
      populate: {
        localizations: true
      }
    }
  };
  const additionalParams: Record<string, unknown> = {};
  if (locale) additionalParams.locale = locale;
  const query = createQuery(populate, additionalParams);
  const data = await fetchAPI(`promotions/${id}`, query);
  return data;
}

