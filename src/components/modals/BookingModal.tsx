"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/custom/Modal";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { createBooking, getListingBookings } from "@/services/booking";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Select from "@/components/custom/Select";
import { translateError } from "@/utils/translateError";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface BookingModalProps {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  listingDocumentId: string;
  userDocumentId: string;
  onCreated?: (res: unknown) => void;
  bookingDurationType?: "Per Day" | "Per Hour";
  bookingDuration?: number;
  workingSchedule?: { day: Day; start: string; end: string }[];
  availablePlans?: Array<{
    name: string;
    price: number;
    features?: string[];
  }>;
  availableAddons?: Array<{ statement: string; price: number }>;
  basePrice?: number;
  // When provided, the dropdown will default to this plan index when the modal opens
  defaultPlanIndex?: number | null;
}

function toISOFromLocal(dateTimeLocal: string) {
  // dateTimeLocal format: "yyyy-MM-ddTHH:mm"
  const dt = new Date(dateTimeLocal);
  return dt.toISOString();
}

const BookingModal: React.FC<BookingModalProps> = ({
  showModal,
  setShowModal,
  listingDocumentId,
  userDocumentId,
  onCreated,
  bookingDurationType,
  bookingDuration,
  workingSchedule = [],
  availablePlans = [],
  availableAddons = [],
  basePrice,
  defaultPlanIndex,
}) => {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Booking.Modal");
  const tErrors = useTranslations('Errors');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [selectedAddonIdxSet, setSelectedAddonIdxSet] = useState<Set<number>>(new Set());

  // When modal opens, set default plan selection if provided. Reset when it closes.
  useEffect(() => {
    if (showModal) {
      if (typeof (defaultPlanIndex as number | null) === 'number') {
        setSelectedPlanIndex(defaultPlanIndex as number);
      }
    } else {
      // reset basic fields on close to avoid stale state when re-opening
      setSelectedPlanIndex(null);
      setSelectedAddonIdxSet(new Set());
      setStartDateTime("");
      setEndDateTime("");
      setError(null);
      setSlotAvailable(null);
    }
  }, [showModal, defaultPlanIndex]);

  const minDateTime = useMemo(() => {
    const now = new Date();
    // round to nearest 5 minutes for nicer UX
    const ms = 1000 * 60 * 5;
    const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${rounded.getFullYear()}-${pad(rounded.getMonth() + 1)}-${pad(rounded.getDate())}T${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
    return local;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const hasMaxDuration =
      (bookingDurationType === "Per Day" || bookingDurationType === "Per Hour") &&
      typeof bookingDuration === "number" &&
      bookingDuration > 0;

    if (!startDateTime || !endDateTime) {
      const msg = t("errors.requiredDateTime", { default: "Please select a date and time." });
      setError(msg);
      toast.error(msg);
      return;
    }
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (start.getTime() < Date.now()) {
      const msg = t("errors.futureOnly", { default: "Please choose a future date and time." });
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!end || end <= start) {
      const msg = t("errors.invalidRange", { default: "End time must be after start time." });
      setError(msg);
      toast.error(msg);
      return;
    }

    // Enforce maximum allowed duration when configured
    if (hasMaxDuration) {
      const diffMs = end.getTime() - start.getTime();
      const limitMs = (bookingDurationType === "Per Hour")
        ? (bookingDuration || 0) * 60 * 60 * 1000
        : (bookingDuration || 0) * 24 * 60 * 60 * 1000;
      if (diffMs > limitMs) {
        const msg = t("errors.invalidRange", { default: `Selected duration exceeds the maximum of ${bookingDuration} ${bookingDurationType === 'Per Hour' ? 'hour(s)' : 'day(s)'} allowed.` });
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    // Validate against working schedule
    const dowToKey = (d: number): Day => {
      return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d] as Day;
    }
    const timeToMinutes = (dt: Date) => dt.getHours() * 60 + dt.getMinutes();
    const withinSchedule = (dt: Date) => {
      const key = dowToKey(dt.getDay());
      const mins = timeToMinutes(dt);
      const windows = (workingSchedule || []).filter(w => w.day === key);
      if (windows.length === 0) return false;
      return windows.some(w => {
        const [sh, sm] = (w.start || "").split(":").map(Number);
        const [eh, em] = (w.end || "").split(":").map(Number);
        if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return false;
        const s = sh * 60 + sm; const e2 = eh * 60 + em;
        return mins >= s && mins <= e2;
      });
    };
    const sameDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();
    if (bookingDurationType === "Per Hour") {
      // Must be within working windows and on same day
      if (!sameDay || !withinSchedule(start) || !withinSchedule(end)) {
        const msg = t("errors.invalidRange", { default: "Selected time must be within working hours on the same day." });
        setError(msg);
        toast.error(msg);
        return;
      }
    } else if (bookingDurationType === "Per Day") {
      // Basic rule: start and end should fall within working windows of their respective days
      if (!withinSchedule(start) || !withinSchedule(end)) {
        const msg = t("errors.invalidRange", { default: "Start and end must be within working hours." });
        setError(msg);
        toast.error(msg);
        return;
      }
      // Optional: ensure every intermediate day has at least one window
      const dayMs = 24 * 60 * 60 * 1000;
      const daysBetween = Math.floor((end.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / dayMs);
      if (daysBetween > 0) {
        const checkDate = new Date(start);
        for (let i = 0; i <= daysBetween; i++) {
          if (i > 0) checkDate.setDate(checkDate.getDate() + 1);
          // Require at least one window that day
          const key = dowToKey(checkDate.getDay());
          const windows = (workingSchedule || []).filter(w => w.day === key);
          if (windows.length === 0) {
            const msg = t("errors.invalidRange", { default: "Booking overlaps a day without working hours." });
            setError(msg);
            toast.error(msg);
            return;
          }
        }
      }
    }

    try {
      setSubmitting(true);
      const startISO = toISOFromLocal(startDateTime);
      const endISO = toISOFromLocal(endDateTime);
      // Check slot availability for this listing + range
      const slots = await getListingBookings(listingDocumentId, startISO, endISO);
      if (Array.isArray(slots) && slots.length > 0) {
        const msg = t("errors.slotUnavailable", { default: "Selected time slot is not available." });
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      // Build selected plan and addons for payload
      let selectedPlan: { name?: string; price?: number; features?: Array<{ statement: string }> } | undefined;
      if (selectedPlanIndex !== null && availablePlans[selectedPlanIndex]) {
        const pl = availablePlans[selectedPlanIndex];
        selectedPlan = {
          name: pl.name,
          price: pl.price,
          features: (pl.features || []).map((f) => ({ statement: f })),
        };
      } else if (typeof basePrice === 'number') {
        selectedPlan = {
          name: t('defaultPlan', { default: 'Default' }),
          price: basePrice,
          features: [],
        };
      }

      const selectedAddons = Array.from(selectedAddonIdxSet)
        .sort((a, b) => a - b)
        .map((idx) => availableAddons[idx])
        .filter(Boolean)
        .map((a) => ({ statement: a.statement, price: a.price }));

      const payload = {
        listing: listingDocumentId,
        userDocumentId,
        startDateTime: startISO,
        endDateTime: endISO,
        bookingStatus: "pending" as const,
        selectedPlan,
        selectedAddons,
      };
      await toast.promise(
        createBooking(payload, 'en'),
        {
          loading: t("toasts.creating", { default: "Creating booking..." }),
          success: () => {
            onCreated?.(true);
            setTimeout(() => setShowModal(false), 400);
            //reset everything on success
            setStartDateTime("");
            setEndDateTime("");
            setError(null);
            setSelectedPlanIndex(null);
            setSelectedAddonIdxSet(new Set());
            return t("toasts.created", { default: "Booking created successfully." });

          },
          error: (err) => translateError(t, tErrors, err, 'toasts.failedCreate'),
        }
      );
    } catch (err: unknown) {
      const msg = translateError(t, tErrors, err, 'toasts.failedCreate');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-check slot availability when both start and end provided
  useEffect(() => {
    let cancelled = false;
    async function check() {
      setSlotAvailable(null);
      if (!startDateTime) return;
      if (!endDateTime) return;
      setChecking(true);
      try {
        const startISO = toISOFromLocal(startDateTime);
        const endISO = toISOFromLocal(endDateTime);
        const slots = await getListingBookings(listingDocumentId, startISO, endISO);
        if (!cancelled) setSlotAvailable(!(Array.isArray(slots) && slots.length > 0));
      } catch {
        if (!cancelled) setSlotAvailable(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [listingDocumentId, startDateTime, endDateTime]);

  return (
    <Modal 
    isOpen={showModal} 
    onClose={() => setShowModal(false)} 
    title={<span className="pr-8">{t('title', { default: 'Create Booking' })}</span>}
    footer={
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button style="ghost" onClick={() => setShowModal(false)} type="button">
          {t("actions.cancel", { default: "Cancel" })}
        </Button>
        <Button style="primary" type="submit" form="booking-form" disabled={submitting}>
          {submitting ? t("actions.creating", { default: "Creating..." }) : t("actions.create", { default: "Create Booking" })}
        </Button>
      </div>
    }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4" id="booking-form">
        <Input
          type="datetime-local"
          required
          label={t('fields.start', { default: 'Start Date & Time' })}
          value={startDateTime}
          min={minDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
        <Input
          type="datetime-local"
          required
          label={t('fields.end', { default: 'End Date & Time' })}
          value={endDateTime}
          min={startDateTime || minDateTime}
          max={(() => {
            const hasMax = (bookingDurationType === 'Per Day' || bookingDurationType === 'Per Hour') && (bookingDuration || 0) > 0;
            if (!hasMax || !startDateTime) return undefined as unknown as string;
            const d = new Date(startDateTime);
            if (bookingDurationType === 'Per Hour') d.setHours(d.getHours() + (bookingDuration || 0));
            if (bookingDurationType === 'Per Day') d.setDate(d.getDate() + (bookingDuration || 0));
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          })()}
          onChange={(e) => setEndDateTime(e.target.value)}
        />
        {availablePlans && availablePlans.length > 0 && (
          <Select
            label={t('fields.plan', { default: 'Select Plan' })}
            required={false}
            value={selectedPlanIndex !== null ? String(selectedPlanIndex) : ""}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedPlanIndex(v === "" ? null : Number(v));
            }}
            options={availablePlans.map((p, idx) => ({ value: String(idx), label: `${p.name} — ${p.price}` }))}
            placeholder={t('placeholders.selectPlan', { default: 'Select a plan (optional)' }) as string}
          />
        )}

        {availableAddons && availableAddons.length > 0 && (
          <div>
            <div className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider">
              {t('fields.addons', { default: 'Optional Addons' })}
            </div>
            <div className="flex flex-col gap-2">
              {availableAddons.map((a, idx) => {
                const checked = selectedAddonIdxSet.has(idx);
                return (
                  <label key={idx} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedAddonIdxSet((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(idx);
                          else next.delete(idx);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm text-gray-800">{a.statement} — {a.price}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {checking && (
          <div className="text-sm text-gray-600">{t("actions.checking", { default: "Checking availability..." })}</div>
        )}
        {slotAvailable === false && (
          <div className="text-red-600 text-sm">{t("errors.slotUnavailable", { default: "Selected time slot is not available." })}</div>
        )}

        {error && (
          <div className="text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default BookingModal;
