"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { fetchListingsByUserLeastPopulated } from "@/services/listing";
import { useLocale, useTranslations } from "next-intl";
import CreatePromotionForm from "../forms/CreatePromotionForm";
import Button from "../custom/Button";
import { FaPlus } from "react-icons/fa";
import NoDataCard from "@/components/custom/NoDataCard";
import { fetchPromotionsByUser } from "@/services/promotion";
import { RootState } from "@/store";
import PromotionCard from "@/components/promotions/PromotionCard";
import { Promotion, UserListingOption } from "@/types/promotion";


export default function PromotionsTab() {
  const t = useTranslations("Profile");
  const user = useAppSelector((s: RootState) => s.auth.user);
  const [listings, setListings] = useState<UserListingOption[]>([]);
  const [openPromotionsModal, setOpenPromotionsModal] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const locale = useLocale();

  // Load user's listings for the creation form
  useEffect(() => {
    const loadListings = async () => {
      if (!user?.documentId) return;
      const data = await fetchListingsByUserLeastPopulated(String(user.documentId), "published", locale);
      console.log(data)
      const opts = data.map((l) => ({
        id: String(l.documentId),
        title: l.title ?? l.slug ?? String(l.id),
        locale: l.locale,
        documentId: l.documentId
      }));
      setListings(opts);
    };
    loadListings();
  }, [user?.documentId, locale]);

  // Load user's promotions
  const loadPromotions = async () => {
    if (!user?.documentId) return;
    setLoading(true);
    try {
      const data = await fetchPromotionsByUser(String(user.id));
      setPromotions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.documentId, locale]);

  // Compute which listings are available (no active promotion)
  const availableListings = React.useMemo(() => {
    if (!Array.isArray(listings) || listings.length === 0) return [] as UserListingOption[];

    const now = new Date();
    const activeByListingDocId = new Set<string>();

    for (const p of promotions) {
      const status = String(p?.promotionStatus || '').toLowerCase();
      const endDateStr = p?.endDate as string | undefined;
      const listingDocId = String(p?.listingDocumentId || p?.listing?.documentId || '');
      if (!listingDocId) continue;

      const hasEnded = (() => {
        if (!endDateStr) return false; // no end date means potentially ongoing
        const end = new Date(endDateStr);
        return isFinite(end.getTime()) && end < now;
      })();

      const isCompleted = status === 'completed' || status === 'ended' || status === 'finished';
      const isActive = !isCompleted && !hasEnded;
      if (isActive) activeByListingDocId.add(listingDocId);
    }

    return listings.filter(l => !activeByListingDocId.has(String(l.documentId)) && !activeByListingDocId.has(String(l.id)));
  }, [listings, promotions]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="text-xl font-semibold">{t("promotions.title")}</h2>
        <Button style="secondary" onClick={() => setOpenPromotionsModal(true)}>
          <FaPlus />
        </Button>
      </div>

      {/* Promotions content */}
      <div className="mt-6">
        {loading && <p>{t("promotions.loading")}</p>}
        {!loading && promotions.length === 0 && (
          <NoDataCard>{t("promotions.none")}</NoDataCard>
        )}
        {/* Placeholder for promotions list when available */}
        {!loading && promotions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((p) => (
              <PromotionCard key={p.documentId || p.id} promotion={p} onUpdated={loadPromotions} />
            ))}
          </div>
        )}
      </div>

      <CreatePromotionForm
        isOpen={openPromotionsModal}
        onClose={() => setOpenPromotionsModal(false)}
        listings={availableListings}
        onCreated={() => {
          setOpenPromotionsModal(false);
          // Refresh promotions after creation
          loadPromotions();
        }}
      />
    </div>
  );
}

