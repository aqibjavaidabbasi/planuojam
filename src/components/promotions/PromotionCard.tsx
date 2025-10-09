"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/custom/Button";
import UpdatePromotionForm from "@/components/forms/UpdatePromotionForm";
import { updatePromotion, createStarUsageLog } from "@/services/promotion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { updateUserData as updateUserDataService } from "@/services/auth";
import { Promotion } from "@/types/promotion";


interface PromotionCardProps {
  promotion: Promotion;
  onUpdated?: () => void;
}

const gold = "#cc922f";

function formatDayLabel(date?: string | null) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
  } catch {
    return date;
  }
}

export default function PromotionCard({ promotion, onUpdated }: PromotionCardProps) {
  const t = useTranslations("Profile.promotions.card");
  const tP = useTranslations("Profile.promotions")
  const status = (promotion.promotionStatus || "ongoing").toUpperCase();
  // Compute success locally: (starsUsed / maxStarsLimit) * 100
  const computedSuccess = (() => {
    const used = Number(promotion.starsUsed ?? 0);
    const max = Number(promotion.maxStarsLimit ?? 0);
    if (!Number.isFinite(used) || !Number.isFinite(max) || max <= 0) return 0;
    const pct = (used / max) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  })();
  // Map success to color palette
  const successColor = (() => {
    if (computedSuccess < 25) return '#ef4444'; // red-500
    if (computedSuccess < 50) return '#eab308'; // yellow-500
    if (computedSuccess < 75) return '#3b82f6'; // blue-500
    if (computedSuccess < 90) return '#16a34a'; // green-600
    return gold; // gold for top-tier
  })();
  const locale = useLocale();
  const [openUpdate, setOpenUpdate] = useState(false);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const isEndedStatus = ["ENDED", "COMPLETED"].includes(status);
  const endDatePassed = useMemo(() => {
    if (!promotion.endDate) return false;
    const end = new Date(promotion.endDate);
    // Consider the promotion active THROUGH the end date.
    // Only mark as passed after the end date's day has fully elapsed (end of day 23:59:59.999).
    if (!isFinite(end.getTime())) return false;
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < new Date();
  }, [promotion.endDate]);

  // Auto-mark ended if end date passed but status not ended
  useEffect(() => {
    const run = async () => {
      if (endDatePassed && !isEndedStatus) {
        try {
          const id = promotion.documentId;
          if (!id) return;
          // 1) Mark promotion as ended
          await updatePromotion(id, { data: { promotionStatus: "ended" } });

          // 2) Compute refund: unspent = maxStarsLimit - starsUsed
          const maxLimit = Number(promotion.maxStarsLimit ?? 0);
          const used = Number(promotion.starsUsed ?? 0);
          const refund = Math.max(0, maxLimit - used);

          // 3) Refund to user (backend) and update Redux optimistically
          if (refund > 0 && currentUser?.id) {
            const newStars = Math.max(0, Number(currentUser.totalStars ?? 0) + refund);
            try {
              await updateUserDataService(currentUser.id, { totalStars: newStars });
              dispatch(setUser({ ...currentUser, totalStars: newStars }));
              // 4) Log refund in star-usage-log (non-blocking)
              try {
                await createStarUsageLog({
                  starsUsed: refund,
                  type: "refund",
                  promotionDocumentId: id,
                  userId: currentUser.id,
                });
              } catch (logErr) {
                console.warn("Failed to log refund in star-usage-log", logErr);
              }
            } catch (err) {
              // backend refund failed; do not update local state to avoid desync
              console.warn("Failed to refund stars on promotion end", err);
            }
          }
          onUpdated?.();
        } catch {
          // Silent fail; UI will still show as passed
        }
      }
    };
    run();
  }, [endDatePassed,
      isEndedStatus,
      promotion.id, 
      promotion.documentId, 
      onUpdated, 
      currentUser, 
      dispatch, 
      promotion.maxStarsLimit, 
      promotion.starsUsed]);

  const listingTitle = promotion?.listing?.locale === 'en' && locale === 'en'
    ? promotion?.listing?.title
    : promotion?.listing?.locale === 'lt' && locale === 'lt'
      ? promotion?.listing?.title
      : promotion?.listing?.localizations?.find((l) => l.locale === locale)?.title;

  const startLabel = formatDayLabel(promotion.startDate);
  const endLabel = formatDayLabel(promotion.endDate);

  const maxClicks = promotion.maxClickPerDay ?? 0;
  const starsPerClick = promotion.starsPerClick ?? 0;
  const starsLimit = promotion.maxStarsLimit ?? 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 gradient-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">

        {status === 'ONGOING' && <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-semibold text-sm">{status}</span>
        </div>}

        {status === 'ENDED' && <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-semibold text-sm">{status}</span>
        </div>}

        {status === 'COMPLETED' &&
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-600 font-semibold text-sm">{status}</span>
          </div>}

        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: successColor }}>{computedSuccess}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">{t("successLabel")}</div>
        </div>
      </div>

      {/* Listing Title */}
      <div className="mb-3">
        <div className="font-semibold text-gray-900">{listingTitle}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4" >

        {/* Start / End */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-1 order-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg flex gap-1 items-center justify-center">
            <p className="text-sm text-gray-500">{t("start")}</p>
            <p className="font-semibold text-gray-800">{startLabel}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg flex gap-1 items-center justify-center">
            <p className="text-sm text-gray-500">{t("end")}</p>
            <p className="font-semibold text-gray-800">{endLabel}</p>
          </div>
        </div>

        {/* Stats or Stars Used */}
        {isEndedStatus || endDatePassed ? (
          <div className="space-y-2 mb-2 order-1 flex items-center px-2">
            <div className="flex justify-between items-center w-full gap-2">
              <span className="text-gray-600">{t("starsUsed")}</span>
              <div className="flex items-center space-x-1">
                <span className="text-[16px]" style={{ color: gold }}>★</span>
                <span className="font-bold text-gray-800">{(promotion.starsUsed ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-2 order-1 px-2 flex flex-col items-center">
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-600">{t("maxDailyClicks", { default: "Max Daily Clicks" })}</span>
              <span className="font-bold text-gray-800">{maxClicks}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-600">{t("starsPerClick", { default: "Stars per Click" })}</span>
              <div className="flex items-center space-x-1">
                <span className="text-[16px]" style={{ color: gold }}>★</span>
                <span className="font-bold text-gray-800">{starsPerClick}</span>
              </div>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-600">{t("starsLimit")}</span>
              <span className="font-bold text-gray-800">{starsLimit.toLocaleString()}</span>
            </div>
          </div>
        )}

      </div>

      {!isEndedStatus && (
        <div className="flex justify-end">
          <Button style="secondary" onClick={() => setOpenUpdate(true)}>
            {tP("update")}
          </Button>
        </div>
      )}

      <UpdatePromotionForm
        isOpen={openUpdate && !isEndedStatus}
        onClose={() => setOpenUpdate(false)}
        promotionId={promotion.documentId ?? ''}
        initialValues={{
          startDate: promotion.startDate ?? undefined,
          endDate: promotion.endDate ?? undefined,
          maxClickPerDay: promotion.maxClickPerDay ?? undefined,
          starsPerClick: promotion.starsPerClick ?? undefined,
          maxStarsLimit: promotion.maxStarsLimit ?? undefined,
          promotionStatus: promotion.promotionStatus ?? undefined,
          starsUsed: promotion.starsUsed ?? undefined,
        }}
        onUpdated={onUpdated}
      />
    </div>
  );
}
