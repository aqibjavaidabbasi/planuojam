import { postAPIWithToken, createQuery, API_URL, fetchAPIWithToken } from "./api";

export interface CreatePromotionPayload {
  listingDocumentId: string; // use documentId for listing
  listingTitle?: string; // persisted alongside listingDocumentId
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
// export async function registerPromotionClick(listingDocumentId: string, userId?: number | string) {
//   try {
//     // 1) Find ongoing promotion for this listing
//     const populate = {
//       listing: true
//     };
//     const query = createQuery(populate);
//     const filters = {
//       filters: {
//         promotionStatus: { $eq: 'ongoing' },
//         listing: { documentId: { $eq: listingDocumentId } },
//       },
//     } as Record<string, unknown>;

//     const promos = await fetchAPI('promotions', query, filters);
//     const arr = Array.isArray(promos) ? promos : [];
//     if (!arr.length) return { updated: false, reason: 'no_active_promotion' };
//     const promo = arr[0];

//     // Enforce daily limit if configured
//     const maxPerDay = typeof promo.maxClickPerDay === 'number' ? promo.maxClickPerDay : Infinity;
//     const clicks = typeof promo.clicksReceived === 'number' ? promo.clicksReceived : 0;
//     if (Number.isFinite(maxPerDay) && clicks >= maxPerDay) {
//       return { updated: false, reason: 'daily_limit_reached' };
//     }

//     const starsPerClick = typeof promo.starsPerClick === 'number' ? promo.starsPerClick : 0;
//     const prevStarsUsed = typeof promo.starsUsed === 'number' ? promo.starsUsed : 0;

//     // 2) Update promotion
//     await updatePromotion(promo.documentId, {
//       data: {
//         clicksReceived: clicks + 1,
//         starsUsed: prevStarsUsed + starsPerClick,
//       },
//     });

//     // 3) Create usage log (best-effort)
//     try {
//       await createStarUsageLog({
//         starsUsed: starsPerClick,
//         type: 'debit',
//         usedAt: new Date().toISOString(),
//         listingDocumentId,
//         promotionDocumentId: promo.documentId,
//         userId,
//       });

//     } catch { }

//     return { updated: true };
//   } catch {
//     // Silent fail – do not block UI navigation on errors
//     return { updated: false, reason: 'error' };
//   }
// }

// --- Star Usage Log ---
export type StarUsageType = "debit" | "credit" | "refund";

export async function createStarUsageLog(params: {
  starsUsed: number;
  type: StarUsageType;
  usedAt?: string;
  listingDocumentId?: string;
  listingTitle?: string;
  promotionDocumentId?: string | number;
  userId?: number | string;
}) {
  const { starsUsed, type, usedAt, listingDocumentId, listingTitle, promotionDocumentId, userId } = params;
  const data: Record<string, unknown> = {
    starsUsed,
    type,
    usedAt: usedAt ?? new Date().toISOString(),
  };
  if (listingDocumentId) data.listingDocumentId = listingDocumentId;
  if (listingTitle) data.listingTitle = listingTitle;
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

// Get promotions for a user (filters by the listing's owner's documentId)
export async function fetchPromotionsByUser(
  userDocumentId: string,
) {
  const populate = {};
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

