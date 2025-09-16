"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/custom/Modal";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { createBooking, getListingBookings } from "@/services/booking";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface BookingModalProps {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  listingDocumentId: string;
  userDocumentId: string;
  onCreated?: (res: any) => void;
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
}) => {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Booking.Modal");

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
    if (end <= start) {
      const msg = t("errors.invalidRange", { default: "End time must be after start time." });
      setError(msg);
      toast.error(msg);
      return;
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
      const payload = {
        listing: listingDocumentId,
        userDocumentId,
        startDateTime: startISO,
        endDateTime: endISO,
        bookingStatus: "pending" as const,
      };
      await toast.promise(
        createBooking(payload),
        {
          loading: t("toasts.creating", { default: "Creating booking..." }),
          success: () => {
            onCreated?.(true);
            setTimeout(() => setShowModal(false), 400);
            //reset everything on success
            setStartDateTime("");
            setEndDateTime("");
            setError(null);
            return t("toasts.created", { default: "Booking created successfully." });

          },
          error: (err) => {
            if (typeof err === "string") return err;
            if (err && typeof err === "object" && "message" in err) return String((err as any).message);
            return t("toasts.failedCreate", { default: "Failed to create booking." });
          },
        }
      );
    } catch (err: any) {
      const msg = err?.message || t("toasts.failedCreate", { default: "Failed to create booking." });
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
      if (!startDateTime || !endDateTime) return;
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
    title={<span className="pr-8">Create Booking</span>}
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
          label="Start Date & Time"
          value={startDateTime}
          min={minDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
        <Input
          type="datetime-local"
          required
          label="End Date & Time"
          value={endDateTime}
          min={startDateTime || minDateTime}
          onChange={(e) => setEndDateTime(e.target.value)}
        />
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
