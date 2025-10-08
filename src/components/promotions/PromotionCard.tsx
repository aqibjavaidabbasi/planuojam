"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UserListingOption } from "../profile/PromotionsTab";
import Button from "@/components/custom/Button";
import UpdatePromotionForm from "@/components/forms/UpdatePromotionForm";
import { updatePromotion } from "@/services/promotion";

type Promotion = {
  id?: number | string;
  documentId?: string;
  promotionStatus?: "ongoing" | "completed" | "ended";
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  maxClickPerDay?: number | null;
  starsPerClick?: number | null;
  maxStarsLimit?: number | null;
  successPercentage?: number | null; // 0-100
  listing?: UserListingOption;
  starsUsed?: number | null;
};

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
  const success = Math.max(0, Math.min(100, Number(promotion.successPercentage ?? 0)));
  const locale = useLocale();
  const [openUpdate, setOpenUpdate] = useState(false);

  const isEndedStatus = ["ENDED", "COMPLETED"].includes(status);
  const endDatePassed = useMemo(() => {
    if (!promotion.endDate) return false;
    const end = new Date(promotion.endDate);
    return isFinite(end.getTime()) && end < new Date();
  }, [promotion.endDate]);

  // Auto-mark ended if end date passed but status not ended
  useEffect(() => {
    const run = async () => {
      if (endDatePassed && !isEndedStatus) {
        try {
          const id = promotion.id ?? promotion.documentId;
          if (!id) return;
          await updatePromotion(id, { data: { promotionStatus: "ended" } });
          onUpdated?.();
        } catch (e) {
          // Silent fail; UI will still show as passed
        }
      }
    };
    run();
  }, [endDatePassed, isEndedStatus, promotion.id, promotion.documentId, onUpdated]);

  const listingTitle = promotion?.listing?.locale === 'en' && locale ===  'en' 
  ? promotion?.listing?.title 
  : promotion?.listing?.locale === 'lt' && locale === 'lt' 
  ? promotion?.listing?.title 
  : promotion?.listing?.localizations?.find((l) => l.locale === locale)?.title;

  const startLabel = formatDayLabel(promotion.startDate);
  const endLabel = formatDayLabel(promotion.endDate);

  const maxClicks = promotion.maxClickPerDay ?? 0;
  const starsPerClick = promotion.starsPerClick ?? 0;
  const starsLimit = promotion.maxStarsLimit ?? 0;

  console.log(promotion)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 gradient-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-semibold text-sm">{status}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: gold }}>{success}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">{t("successLabel", { default: "Success" })}</div>
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
        <div className="space-y-2 mb-2 order-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("starsUsed", { default: "Stars Used" })}</span>
            <div className="flex items-center space-x-1">
              <span className="text-[16px]" style={{ color: gold }}>★</span>
              <span className="font-bold text-gray-800">{(promotion.starsUsed ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-2 order-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("maxDailyClicks", { default: "Max Daily Clicks" })}</span>
            <span className="font-bold text-gray-800">{maxClicks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("starsPerClick", { default: "Stars per Click" })}</span>
            <div className="flex items-center space-x-1">
              <span className="text-[16px]" style={{ color: gold }}>★</span>
              <span className="font-bold text-gray-800">{starsPerClick}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("starsLimit", { default: "Stars Limit" })}</span>
            <span className="font-bold text-gray-800">{starsLimit.toLocaleString()}</span>
          </div>
        </div>
      )}

      </div>

      <div className="flex justify-end">
        <Button style="secondary" onClick={() => setOpenUpdate(true)}>
          {tP("update", { default: "Update" })}
        </Button>
      </div>

      <UpdatePromotionForm
        isOpen={openUpdate}
        onClose={() => setOpenUpdate(false)}
        promotionId={promotion.id ?? promotion.documentId ?? 0}
        initialValues={{
          startDate: promotion.startDate ?? undefined,
          endDate: promotion.endDate ?? undefined,
          maxClickPerDay: promotion.maxClickPerDay ?? undefined,
          starsPerClick: promotion.starsPerClick ?? undefined,
          maxStarsLimit: promotion.maxStarsLimit ?? undefined,
          successPercentage: promotion.successPercentage ?? undefined,
          promotionStatus: promotion.promotionStatus ?? undefined,
        }}
        onUpdated={onUpdated}
      />
    </div>
  );
}
