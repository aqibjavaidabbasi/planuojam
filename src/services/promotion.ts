import { postAPIWithToken, fetchAPI, createQuery, fetchAPIWithToken, API_URL } from "./api";
import { updateUserData } from "./auth";

export interface CreatePromotionPayload {
  listingDocumentId: string; // use documentId for listing
  startDate?: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null
  maxClickPerDay?: number;
  starsPerClick?: number;
  maxStarsLimit: number;
  userDocumentId?: string; // to fill userDocId on backend
  currentUserId: number; // user simple id
  currentUserStars: number; // current stars to compute new value
}


// Register a click on a listing's ongoing promotion (frontend-side orchestration)
// - Finds ongoing promotion for listing by listingDocumentId
// - Increments clicksReceived and starsUsed by starsPerClick
// - Creates a star-usage-log entry of type 'debit'
export async function registerPromotionClick(listingDocumentId: string, userId?: number | string) {
  try {
    // 1) Find ongoing promotion for this listing
    const populate = {
      listing: true
    };
    const query = createQuery(populate);
    const filters = {
      filters: {
        promotionStatus: { $eq: 'ongoing' },
        listing: { documentId: { $eq: listingDocumentId } },
      },
    } as Record<string, unknown>;

    const promos = await fetchAPI('promotions', query, filters);
    const arr = Array.isArray(promos) ? promos : [];
    if (!arr.length) return { updated: false, reason: 'no_active_promotion' };
    const promo = arr[0];

    // Enforce daily limit if configured
    const maxPerDay = typeof promo.maxClickPerDay === 'number' ? promo.maxClickPerDay : Infinity;
    const clicks = typeof promo.clicksReceived === 'number' ? promo.clicksReceived : 0;
    if (Number.isFinite(maxPerDay) && clicks >= maxPerDay) {
      return { updated: false, reason: 'daily_limit_reached' };
    }

    const starsPerClick = typeof promo.starsPerClick === 'number' ? promo.starsPerClick : 0;
    const prevStarsUsed = typeof promo.starsUsed === 'number' ? promo.starsUsed : 0;

    // 2) Update promotion
    await updatePromotion(promo.documentId, {
      data: {
        clicksReceived: clicks + 1,
        starsUsed: prevStarsUsed + starsPerClick,
      },
    });

    // 3) Create usage log (best-effort)
    try {
      await createStarUsageLog({
        starsUsed: starsPerClick,
        type: 'debit',
        usedAt: new Date().toISOString(),
        listingDocumentId,
        promotionDocumentId: promo.documentId,
        userId,
      });

    } catch { }

    return { updated: true };
  } catch {
    // Silent fail – do not block UI navigation on errors
    return { updated: false, reason: 'error' };
  }
}

// --- Star Usage Log ---
export type StarUsageType = "debit" | "credit" | "refund";

export async function createStarUsageLog(params: {
  starsUsed: number;
  type: StarUsageType;
  usedAt?: string;
  listingDocumentId?: string;
  promotionDocumentId?: string | number;
  userId?: number | string;
}) {
  const { starsUsed, type, usedAt, listingDocumentId, promotionDocumentId, userId } = params;
  const data: Record<string, unknown> = {
    starsUsed,
    type,
    usedAt: usedAt ?? new Date().toISOString(),
  };
  if (listingDocumentId) data.listing = listingDocumentId;
  if (promotionDocumentId) data.promotion = promotionDocumentId;
  if (userId) data.users_permissions_user = userId;

  const url = `${API_URL}/api/star-usage-logs`;
  const mergedHeaders = {
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: mergedHeaders,
    body: JSON.stringify({data}),
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
        `Strapi API POST error! status: ${response.status}`
    );
  }
  const json = await response.json()
  return json;
}

export async function createPromotion(data: Record<string, unknown>) {
  // Core create via Strapi
  return postAPIWithToken("promotions", data);
}

// Orchestrates: create promotion -> log star usage -> update user stars
export async function createPromotionWithStars(payload: CreatePromotionPayload) {
  const { listingDocumentId, startDate, endDate, maxClickPerDay, starsPerClick, maxStarsLimit, userDocumentId, currentUserStars } = payload;

  if (currentUserStars < maxStarsLimit) {
    throw new Error("errors.inSufficientStars");
  }

  // 1) Create promotion
  const promotionRes = await createPromotion({
    data: {
      promotionStatus: "ongoing",
      startDate: startDate,
      endDate: endDate ?? null,
      maxClickPerDay,
      starsPerClick,
      maxStarsLimit,
      listing: listingDocumentId,
      userDocId: userDocumentId,
    }
  });

  const promotion = promotionRes?.data ?? promotionRes;

  // 2) Deduct stars from user on backend
  try {
    const newStars = Math.max(0, Number(currentUserStars) - Number(maxStarsLimit));
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
) {

  const url = `${API_URL}/api/promotions/${id}`;
  const mergedHeaders = {
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method: "PUT",
    headers: mergedHeaders,
    body: JSON.stringify(data),
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
      `Strapi API PUT error! status: ${response.status}`
    );
  }
  const json = await response.json()
  return json;
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

