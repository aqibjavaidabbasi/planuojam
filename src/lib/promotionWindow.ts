import type { Promotion } from "@/types/promotion";

type PromotionWindow = Pick<Promotion, "expiresAt" | "endDate"> & { promotionStatus?: string };

// Single source of truth for "has this promotion run out", shared by every dashboard view.
export function hasPromotionEnded(promotion: PromotionWindow, now: Date = new Date()): boolean {
  if (promotion?.expiresAt) return Date.parse(promotion.expiresAt) <= now.getTime();
  if (!promotion?.endDate) return false;
  // ponytail: legacy date-only rows; the backend backfills them, drop this once none are left.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  return promotion.endDate < today;
}

export function isPromotionActive(promotion: PromotionWindow, now: Date = new Date()): boolean {
  const status = String(promotion?.promotionStatus || "").toLowerCase();
  if (status === "completed" || status === "ended" || status === "finished") return false;
  return !hasPromotionEnded(promotion, now);
}
