"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useLocale, useTranslations } from "next-intl";
import Select from "@/components/custom/Select";
import Button from "@/components/custom/Button";
import toast from "react-hot-toast";
import ListingCalendar from "@/components/custom/ListingCalendar";
import { fetchListingsByUser } from "@/services/listing";
import { createBooking, getListingBookings, BookingItem } from "@/services/booking";
import Input from "@/components/custom/Input";

const ProviderCalendar: React.FC = () => {
  const t = useTranslations("Profile.ProviderCalendar");
  const tCommon = useTranslations("Common");
  const user = useAppSelector((s) => s.auth.user);
  const locale = useLocale();
  const [listings, setListings] = useState<{ documentId: string; title?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const options = useMemo(() => (
    [{ label: t("selectListing.placeholder", { default: "Select a listing" }), value: "" }].concat(
      listings.map((l) => ({ label: l.title || l.documentId, value: l.documentId }))
    )
  ), [listings, t]);

  useEffect(() => {
    (async () => {
      try {
        if (!user?.documentId) return;
        const res = await fetchListingsByUser(user.documentId, undefined, locale);
        setListings((res || []).map((l) => ({ documentId: l.documentId, title: l.title })));
      } catch {
        // ignore
      }
    })();
  }, [user?.documentId, locale]);

  const onCreateManual = async () => {
    try {
      if (!user?.documentId) return;
      if (!selectedListing) {
        toast.error(t("errors.noListing", { default: "Please select a listing" }));
        return;
      }
      if (!start || !end) {
        toast.error(t("errors.noTime", { default: "Please select start and end" }));
        return;
      }
      const startISO = new Date(start).toISOString();
      const endISO = new Date(end).toISOString();
      if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
        toast.error(t("errors.invalidRange", { default: "End must be after start" }));
        return;
      }
      setLoading(true);
      // conflict check
      const existing: BookingItem[] = await getListingBookings(selectedListing, startISO, endISO, locale);
      const conflict = Array.isArray(existing) && existing.length > 0;
      if (conflict) {
        toast.error(t("errors.conflict", { default: "Selected time overlaps existing booking" }));
        setLoading(false);
        return;
      }
      await toast.promise(
        createBooking({
          listing: selectedListing,
          userDocumentId: user.documentId,
          startDateTime: startISO,
          endDateTime: endISO,
          bookingStatus: "confirmed",
          selectedPlan: null,
          selectedAddons: [],
        }, locale),
        {
          loading: t("toasts.creating", { default: "Creating booking..." }),
          success: t("toasts.created", { default: "Blocked slot added" }),
          error: (err) => (typeof err === "string" ? err : err?.message || t("toasts.failed", { default: "Failed to create" })),
        }
      );
      // Clear fields to encourage fresh selection
      setStart("");
      setEnd("");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.serviceType === null) {
    return <div className="p-4 text-gray-600">{t("notProvider", { default: "Calendar is available for providers only." })}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 mb-4">
        <div className="w-full md:w-64">
          <Select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            options={options}
          />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input type="datetime-local" label={t("fields.start", { default: "Start" })} value={start} onChange={(e) => setStart(e.target.value)} />
          <Input type="datetime-local" label={t("fields.end", { default: "End" })} value={end} onChange={(e) => setEnd(e.target.value)} />
          <Button style="primary" onClick={onCreateManual} disabled={loading || !selectedListing} extraStyles="!rounded-md !whitespace-nowrap">
            {loading ? tCommon("saving", { default: "Saving..." }) : t("actions.addBlock", { default: "Add Blocked Slot" })}
          </Button>
        </div>
      </div>

      {selectedListing ? (
        <ListingCalendar listingDocumentId={selectedListing} />
      ) : (
        <div className="p-4 text-gray-500">{t("selectListing.help")}</div>
      )}
    </div>
  );
};

export default ProviderCalendar;
