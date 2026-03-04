"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Promotion } from "@/types/promotion";

interface PromotionCardProps {
  promotion: Promotion;
  onUpdated?: () => void; // kept for compatibility, unused
}

function formatDayLabel(date: string | null | undefined, locale: string) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, { month: "long", day: "2-digit" }).format(d);
  } catch {
    return date;
  }
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
  const t = useTranslations("Profile.promotions.card");
  const locale = useLocale();
  const status = (promotion.promotionStatus || "ongoing").toUpperCase();

  const listingTitle = promotion.listingTitle;

  const startLabel = formatDayLabel(promotion.startDate, locale);
  const endLabel = formatDayLabel(promotion.endDate, locale);

  const starsLimit = promotion.maxStarsLimit ?? 0;
  const statusKey = (promotion.promotionStatus || 'ongoing').toString().toLowerCase();
  const statusLabel = t(`status.${statusKey}`);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 gradient-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        {status === 'ONGOING' && <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-semibold text-sm">{statusLabel}</span>
        </div>}

        {status === 'ENDED' && <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-semibold text-sm">{statusLabel}</span>
        </div>}

        {status === 'COMPLETED' && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-600 font-semibold text-sm">{statusLabel}</span>
          </div>
        )}
      </div>

      {/* Listing Title */}
      <div className="mb-3">
        <div className="font-semibold text-gray-900">{listingTitle}</div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        
        {/* Stars purchased */}
        <div className="flex gap-2.5 items-center">
          <span className="text-gray-600">{t("starsLimit")}</span>
          <span className="font-bold text-gray-800">{starsLimit.toLocaleString()}</span>
        </div>

        {/* Start / End */}
        <div className="flex items-center gap-1">
            <p className="font-semibold text-gray-800 whitespace-nowrap">{startLabel} {"-"}</p>
            <p className="font-semibold text-gray-800 whitespace-nowrap">{endLabel}</p>
        </div>

      </div>

    </div>
  );
}
