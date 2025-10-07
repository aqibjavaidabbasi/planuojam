import { postAPIWithToken, putAPI } from "./api";

export interface CreatePromotionPayload {
  listingDocumentId: string; // use documentId for listing
  starsUsed: number;
  promotionTitle?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null
  maxClickPerDay?: number;
  starsPerClick?: number;
  currentUserId: number; // user simple id
  currentUserStars: number; // current stars to compute new value
}

export async function createPromotion(data: Record<string, unknown>) {
  // Core create via Strapi
  return postAPIWithToken("promotions", data);
}

// Orchestrates: create promotion -> log star usage -> update user stars
export async function createPromotionWithStars(payload: CreatePromotionPayload) {
  const { listingDocumentId, starsUsed, promotionTitle, startDate, endDate, maxClickPerDay, starsPerClick, currentUserStars } = payload;

  if (!listingDocumentId || !starsUsed || starsUsed <= 0) {
    throw new Error("listingId and positive starsUsed are required");
  }
  if (currentUserStars < starsUsed) {
    throw new Error("Insufficient stars");
  }

  // 1) Create promotion
  const promotionRes = await createPromotion({
    promotionTitle: promotionTitle,
    promotionStatus: "ongoing",
    startDate: startDate,
    endDate: endDate ?? null,
    maxClickPerDay,
    starsPerClick,
    listing: listingDocumentId,
  });

  const promotion = promotionRes?.data ?? promotionRes;
  const promotionId: number | undefined = promotion?.id ?? promotionRes?.id;
  if (!promotionId) {
    throw new Error("Failed to create promotion");
  }

  return promotion;
}
