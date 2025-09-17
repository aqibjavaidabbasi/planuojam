"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { BookingItem, BookingStatusFilter, getBookings, getListingBookings, updateBooking } from "@/services/booking";
import Button from "@/components/custom/Button";
import NoDataCard from "@/components/custom/NoDataCard";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Modal from "@/components/custom/Modal";
import { FiCalendar } from "react-icons/fi";
import { RootState } from "@/store";
import { fetchSiteSettings } from "@/services/siteSettings";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return local;
}

const MyBookings: React.FC = () => {
  const user = useAppSelector((s: RootState) => s.auth.user);
  const t = useTranslations("Booking.MyBookings");
  const tCommon = useTranslations('Common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>(""); // new start datetime-local
  const [editDurationMs, setEditDurationMs] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const locale = useLocale();
  const [cancelHours, setCancelHours] = useState<number>(24);
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");

  const minDateTime = useMemo(() => {
    const now = new Date();
    const ms = 1000 * 60 * 5;
    const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${rounded.getFullYear()}-${pad(rounded.getMonth() + 1)}-${pad(rounded.getDate())}T${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
  }, []);

  useEffect(() => { 
    async function load() {
      if (!user?.documentId) return;
      try {
        setLoading(true);
        const res = await getBookings(user.documentId, locale, statusFilter);
        setItems(res || []);
      } catch (err: unknown) {
        let msg: string;
        if (typeof err === "string") {
          msg = err;
        } else if (err && typeof err === "object" && "message" in err) {
          msg = String((err).message);
        } else {
          msg = t("toasts.failedCreate", { default: "Failed to create booking." });
        }
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }   
    load();
  }, [user?.documentId, statusFilter,t,locale]);

  useEffect(() => {
    // fetch dynamic cancellation window (hours) from site settings
    (async () => {
      try {
        const settings = await fetchSiteSettings();
        const hours = settings?.data?.attributes?.bookingCancellationAllowedTime;
        if (typeof hours === 'number' && hours > 0) {
          setCancelHours(hours);
        }
      } catch {
        // ignore, fallback to default 24
      }
    })();
  }, []);

  const startEdit = (b: BookingItem) => {
    if (b.bookingStatus === 'cancelled') return; // cannot reschedule cancelled booking
    // also do not allow editing if booking already ended
    if (new Date(b.endDateTime).getTime() <= Date.now()) return;
    setEditingId(b.documentId || String(b.id));
    setEditValue(toLocalInputValue(b.startDateTime));
    const start = new Date(b.startDateTime).getTime();
    const end = new Date(b.endDateTime).getTime();
    setEditDurationMs(Math.max(0, end - start));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (b: BookingItem) => {
    try {
      setSaving(true);
      const newStartISO = new Date(editValue).toISOString();
      const newEndISO = new Date(new Date(editValue).getTime() + editDurationMs).toISOString();
      // Check availability for the listing at the new time range; allow if no bookings or only this booking occupies it
      const existing = await getListingBookings(b?.listing?.documentId as string, newStartISO, newEndISO);
      const conflict = Array.isArray(existing) && existing.some((bk: BookingItem) => bk.documentId !== b.documentId);
      if (conflict) {
        const msg = t("errors.slotUnavailable", { default: "Selected time slot is not available." });
        toast.error(msg);
        setSaving(false);
        return;
      }
      await toast.promise(
        updateBooking(b.documentId, { startDateTime: newStartISO, endDateTime: newEndISO }),
        {
          loading: t("toasts.updating", { default: "Updating booking..." }),
          success: t("toasts.updated", { default: "Booking updated." }),
          error: (err) =>
            (typeof err === "string"
              ? err
              : err?.message || t("toasts.updateFailed", { default: "Failed to update booking." })),
        }
      );
      setItems((prev) => prev.map((it) => ((it.documentId || String(it.id)) === (b.documentId) ? { ...it, startDateTime: newStartISO, endDateTime: newEndISO } : it)));
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const onCancelBooking = (b: BookingItem) => {
    setConfirmModal({ open: true, id: b.documentId });
  };

  const confirmCancel = async () => {
    const id = confirmModal.id!;
    try {
      await toast.promise(
        updateBooking(id, { bookingStatus: "cancelled" }),
        {
          loading: t("toasts.updating", { default: "Updating booking..." }),
          success: t("toasts.updated", { default: "Booking updated." }),
          error: (err) =>
            (typeof err === "string"
              ? err
              : err?.message || t("toasts.updateFailed", { default: "Failed to update booking." })),
        }
      );
      // Optimistically update to cancelled
      setItems((prev) => prev.map((it) => it.documentId === id ? { ...it, bookingStatus: "cancelled" } : it));
    } catch (err: unknown) {
      let msg: string;
      if (typeof err === "string") {
        msg = err;
      } else if (err && typeof err === "object" && "message" in err) {
        msg = String((err).message);
      } else {
        msg = t("toasts.failedCreate", { default: "Failed to create booking." });
      }
      setError(msg);
    } finally {
      setConfirmModal({ open: false });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{t("title", { default: "My Bookings" })}</h2>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-gray-600" htmlFor="statusFilter">
          {t("filters.status", { default: "Filter by status" })}
        </label>
        <select
          id="statusFilter"
          className="bg-white border border-border rounded-md h-9 px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatusFilter)}
        >
          <option value="all">{t("filters.all", { default: "All" })}</option>
          <option value="pending">{t("status.pending", { default: "Pending" })}</option>
          <option value="confirmed">{t("status.confirmed", { default: "Confirmed" })}</option>
          <option value="cancelled">{t("status.cancelled", { default: "Cancelled" })}</option>
          <option value="rejected">{t("status.rejected", { default: "Rejected" })}</option>
        </select>
      </div>

      {loading && <p>{tCommon('loading')}</p>}

      {!loading && !user && <NoDataCard>{t("messages.loginToView", { default: "Please log in to view your bookings." })}</NoDataCard>}
      {error && <NoDataCard>{error}</NoDataCard>}

      {!loading && user && items.length === 0 && (
        <NoDataCard>{t("messages.none", { default: "No bookings yet." })}</NoDataCard>
      )}
       {user && !loading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((b) => {
            const isEditing = editingId === (b.documentId || String(b.id));
            const status = b.bookingStatus as string;
            const statusChip = (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : status === "cancelled"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            );

            const listingTitle = b?.listing?.locale === 'en' ? b?.listing?.title : b?.listing?.localizations?.find(loc => loc.locale === locale)?.title;

            return (
              <li key={b.documentId || b.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">
                      {listingTitle || t("labels.listing", { default: "Listing" })}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCalendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("labels.start", { default: "Start" })}</p>
                          <p className="font-medium text-gray-800">{new Date(b.startDateTime).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <FiCalendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("labels.end", { default: "End" })}</p>
                          <p className="font-medium text-gray-800">{new Date(b.endDateTime).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">{statusChip}</div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {isEditing ? (
                    <>
                      <input
                        type="datetime-local"
                        className="border border-border rounded-md p-2"
                        min={minDateTime}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <Button style="primary" onClick={() => saveEdit(b)} disabled={saving}>
                        {saving ? t("actions.saving", { default: "Saving..." }) : t("actions.save", { default: "Save" })}
                      </Button>
                      <Button style="ghost" onClick={cancelEdit}>
                        {t("actions.cancel", { default: "Cancel" })}
                      </Button>
                    </>
                  ) : (
                    (() => {
                      const now = Date.now();
                      const startMs = new Date(b.startDateTime).getTime();
                      const endMs = new Date(b.endDateTime).getTime();
                      const hasEnded = endMs <= now;
                      const canCancel = !hasEnded && b.bookingStatus !== "cancelled" && (startMs - now) >= cancelHours * 60 * 60 * 1000;

                      if (hasEnded) {
                        return (
                          <Button style="secondary" onClick={() => {}}>
                            {t("actions.review", { default: "Review" })}
                          </Button>
                        );
                      }

                      if (b.bookingStatus === "pending" || b.bookingStatus === "confirmed") {
                        return (
                          <>
                            <Button style="secondary" onClick={() => startEdit(b)}>
                              {t("actions.reschedule", { default: "Reschedule" })}
                            </Button>
                            {canCancel && (
                              <Button style="destructive" onClick={() => onCancelBooking(b)}>
                                {t("actions.cancel", { default: "Cancel" })}
                              </Button>
                            )}
                          </>
                        );
                      }

                      // cancelled or rejected: no actions
                      return null;
                    })()
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        title={<span className="pr-8">{t("confirm.cancelTitle", { default: "Cancel this booking?" })}</span>}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button style="ghost" onClick={() => setConfirmModal({ open: false })} type="button">
              {t("actions.cancel", { default: "Cancel" })}
            </Button>
            <Button style="destructive" onClick={confirmCancel} type="button">
              {t("actions.cancel", { default: "Cancel" })}
            </Button>
          </div>
        }
      >
        <p className="text-center py-2" >{t("confirm.cancel", { default: "Are you sure you want to cancel this booking?" })}</p>
      </Modal>
    </div>
  );
};

export default MyBookings;
