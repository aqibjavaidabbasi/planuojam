"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { fetchListingsByUser } from "@/services/listing";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import { useTranslations } from "next-intl";
import { createPromotionWithStars } from "@/services/promotion";

interface UserListingOption {
  id: string; // listing documentId for relations
  title: string;
}

export default function PromotionsTab() {
  const t = useTranslations("Profile");
  const user = useAppSelector((s) => s.auth.user);
  const [listings, setListings] = useState<UserListingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [starsUsed, setStarsUsed] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [maxClickPerDay, setMaxClickPerDay] = useState<string>("");
  const [starsPerClick, setStarsPerClick] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const canCreate = useMemo(() => {
    const stars = Number(starsUsed || 0);
    return !!selectedListingId && stars > 0 && (user?.totalStars ?? 0) >= stars;
  }, [selectedListingId, starsUsed, user?.totalStars]);

  useEffect(() => {
    const load = async () => {
      if (!user?.documentId) return;
      try {
        const data = await fetchListingsByUser(String(user.documentId), "all");
        const opts = data.map((l) => ({ id: String(l.documentId), title: l.title ?? l.slug ?? String(l.id) }));
        setListings(opts);
      } catch (e) {
        console.warn(e);
      }
    };
    load();
  }, [user?.documentId]);

  const handleCreate = async () => {
    setMessage("");
    try {
      setLoading(true);
      const stars = Number(starsUsed);
      const res = await createPromotionWithStars({
        listingDocumentId: selectedListingId,
        starsUsed: stars,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        maxClickPerDay: maxClickPerDay ? Number(maxClickPerDay) : undefined,
        starsPerClick: starsPerClick ? Number(starsPerClick) : undefined,
        currentUserId: Number(user?.id),
        currentUserStars: Number(user?.totalStars ?? 0),
      });
      setMessage(t("promotions.created", { default: "Promotion created successfully" }));
      // optimistic update of user stars if present in response
      if (res?.data?.totalStars != null) {
        // Do nothing here; global state update would typically happen via a separate action.
      }
      setStarsUsed("");
      setSelectedListingId("");
      setStartDate("");
      setEndDate("");
      setMaxClickPerDay("");
      setStarsPerClick("");
    } catch (e: any) {
      setMessage(e?.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">{t("promotions.title", { default: "Promotions" })}</h2>
      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("promotions.selectListing", { default: "Select Listing" })}
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={selectedListingId}
            onChange={(e) => setSelectedListingId(e.target.value)}
          >
            <option value="">{t("promotions.choose", { default: "Choose..." })}</option>
            {listings.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("promotions.starsToSpend", { default: "Stars to spend" })}
          </label>
          <Input
            type="number"
            min={1}
            value={starsUsed}
            onChange={(e: any) => setStarsUsed(e.target.value)}
            placeholder={t("promotions.starsPlaceholder", { default: "e.g. 10" })}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("promotions.starsAvailable", { default: "Available" })}: {user?.totalStars ?? 0}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("promotions.startDate", { default: "Start Date" })}</label>
            <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("promotions.endDate", { default: "End Date" })}</label>
            <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("promotions.maxClickPerDay", { default: "Max Clicks Per Day" })}</label>
            <Input type="number" min={1} value={maxClickPerDay} onChange={(e: any) => setMaxClickPerDay(e.target.value)} placeholder="10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("promotions.starsPerClick", { default: "Stars Per Click" })}</label>
            <Input type="number" min={1} value={starsPerClick} onChange={(e: any) => setStarsPerClick(e.target.value)} placeholder="1" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button style="primary" disabled={!canCreate || loading} onClick={handleCreate}>
            {loading ? t("promotions.creating", { default: "Creating..." }) : t("promotions.create", { default: "Create Promotion" })}
          </Button>
        </div>

        {message && (
          <div className={`text-sm mt-2 ${message.toLowerCase().includes('success') ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
