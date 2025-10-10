"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { EnrichedBooking, BookingStatusFilter, getProviderBookingsWithUsers, updateBooking } from "@/services/booking";
import NoDataCard from "@/components/custom/NoDataCard";
import Button from "@/components/custom/Button";
import Modal from "@/components/custom/Modal";
import { FiCalendar } from "react-icons/fi";
import BookingDetailsModal, { BookingDetails } from "@/components/modals/BookingDetailsModal";
import { useRouter } from "@/i18n/navigation";

function toLocal(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

const ManageBookings: React.FC = () => {
  const user = useAppSelector((s) => s.auth.user);
  const t = useTranslations("Booking.MyBookings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EnrichedBooking[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id?: string; action?: "confirm" | "cancel" }>({ open: false });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; booking?: BookingDetails }>({ open: false });

  const isProvider = useMemo(() => user?.serviceType !== null, [user?.serviceType]);
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const router = useRouter();

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((b) => b.bookingStatus === "pending").length;
    const confirmed = items.filter((b) => b.bookingStatus === "confirmed").length;
    const cancelled = items.filter((b) => b.bookingStatus === "cancelled").length;
    const rejected = items.filter((b) => b.bookingStatus === "rejected").length;
    return { total, pending, confirmed, cancelled, rejected };
  }, [items]);

  useEffect(() => {
    async function load() {
      if (!user?.documentId) return;
      try {
        setLoading(true);
        const data = await getProviderBookingsWithUsers(user.documentId, 'en', statusFilter);
        setItems(data || []);
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
  }, [user?.documentId, statusFilter, t]);

  const onAccept = (b: EnrichedBooking) => {
    setConfirmModal({ open: true, id: b.documentId, action: "confirm" });
  };

  const onReject = async (b: EnrichedBooking) => {
    setConfirmModal({ open: true, id: b.documentId, action: "cancel" });
  };

  const confirmReject = async () => {
    const id = confirmModal.id!;
    try {
      setRejectingId(id);
      await toast.promise(
        updateBooking(id, { bookingStatus: "rejected" }),
        {
          loading: t("toasts.updating", { default: "Updating booking..." }),
          success: t("toasts.updated", { default: "Booking updated." }),
          error: (err) => (typeof err === "string" ? err : err?.message || t("toasts.updateFailed", { default: "Failed to update booking." })),
        }
      );
      setItems((prev) => prev.map((it) => (it.documentId === id ? { ...it, bookingStatus: "rejected" } as EnrichedBooking : it)));
    } finally {
      setRejectingId(null);
      setConfirmModal({ open: false });
    }
  };

  const confirmAccept = async () => {
    const id = confirmModal.id!;
    try {
      setProcessingId(id);
      await toast.promise(
        updateBooking(id, { bookingStatus: "confirmed" }),
        {
          loading: t("toasts.updating", { default: "Updating booking..." }),
          success: t("toasts.updated", { default: "Booking updated." }),
          error: (err) => (typeof err === "string" ? err : err?.message || t("toasts.updateFailed", { default: "Failed to update booking." })),
        }
      );
      setItems((prev) => prev.map((it) => (it.documentId === id ? { ...it, bookingStatus: "confirmed" } as EnrichedBooking : it)));
    } finally {
      setProcessingId(null);
      setConfirmModal({ open: false });
    }
  };

  if (!isProvider) {
    return <NoDataCard>{t("messages.loginToView", { default: "Please log in to view your bookings." })}</NoDataCard>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{t("title", { default: "My Bookings" })} — {t("manage")}</h2>

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
          <option value="completed">{t("status.completed", { default: "Completed" })}</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t("stats.total", { default: "Total" })}</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t("stats.pending", { default: "Pending" })}</p>
          <p className="text-2xl font-semibold">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t("stats.confirmed", { default: "Confirmed" })}</p>
          <p className="text-2xl font-semibold">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t("stats.cancelled", { default: "Cancelled" })}</p>
          <p className="text-2xl font-semibold">{stats.cancelled}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t("stats.rejected", { default: "Rejected" })}</p>
          <p className="text-2xl font-semibold">{stats.rejected}</p>
        </div>
      </div>

      {loading && <p>{t("toasts.updating", { default: "Loading..." })}</p>}
      {error && <NoDataCard>{error}</NoDataCard>}

      {!loading && items.length === 0 && <NoDataCard>{t("messages.none", { default: "No bookings yet." })}</NoDataCard>}

      {!loading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((b: EnrichedBooking) => {
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
                        : status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                }`}
              >
                {t("status." + status)}
              </span>
            );

            const listingTitle = b?.listing?.locale === 'en' ? b?.listing?.title : b?.listing?.localizations?.find(loc => loc.locale === locale)?.title;

            return (
              <li key={b.documentId} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">
                      {listingTitle || t("labels.listing", { default: "Listing" })}
                    </h3>

                    {b?.userInfo && (
                      <div className="text-sm text-gray-500 mb-2">
                        {b.userInfo.username} • {" "}
                        <a href={`mailto:${b.userInfo.email}`} className="hover:underline">{b.userInfo.email}</a>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCalendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("labels.start", { default: "Start" })}</p>
                          <p className="font-medium text-gray-800">{toLocal(b.startDateTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <FiCalendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("labels.end", { default: "End" })}</p>
                          <p className="font-medium text-gray-800">{toLocal(b.endDateTime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">{statusChip}</div>
                </div>

                <div className="flex items-center gap-1.5 mt-4">
                  <Button
                    style="ghost"
                    extraStyles="!whitespace-nowrap"
                    onClick={() => {
                      const details: BookingDetails = {
                        bookingStatus: b.bookingStatus,
                        startDateTime: b.startDateTime,
                        endDateTime: b.endDateTime,
                        selectedPlan: b.selectedPlan,
                        selectedAddons: b.selectedAddons,
                      };
                      setDetailsModal({ open: true, booking: details });
                    }}
                  >
                    {t("actions.viewDetails", { default: "View Details" })}
                  </Button>
                  {(() => {
                    const customerUserId: number | undefined = b?.userInfo?.id as number | undefined;
                    if (customerUserId) {
                      return (
                        <Button
                          style="primary"
                          extraStyles="!rounded-md"
                          onClick={() => router.push(`/profile?tab=messages&withUser=${customerUserId}`)}
                        >
                          {t("actions.message", { default: "Message" })}
                        </Button>
                      );
                    }
                    return null;
                  })()}
                  {b.bookingStatus === "pending" && (
                    <>
                      <Button style="primary" disabled={processingId === b.documentId} onClick={() => onAccept(b)}>
                        {processingId === b.documentId ? t("actions.saving", { default: "Saving..." }) : t("actions.accept", { default: "Accept" })}
                      </Button>
                      <Button style="destructive" disabled={rejectingId === b.documentId} onClick={() => onReject(b)}>
                        {rejectingId === b.documentId ? t("actions.saving", { default: "Saving..." }) : t("actions.reject", { default: "Reject" })}
                      </Button>
                    </>
                  )}
                  {/* Provider can mark as completed after end time has passed if not cancelled/rejected/completed */}
                  {(() => {
                    const now = Date.now();
                    const endMs = new Date(b.endDateTime).getTime();
                    const canMarkCompleted = endMs <= now && !["cancelled", "rejected", "completed"].includes(b.bookingStatus);
                    if (!canMarkCompleted) return null;
                    return (
                      <Button
                        style="primary"
                        extraStyles="!whitespace-nowrap"
                        onClick={async () => {
                          try {
                            await toast.promise(
                              updateBooking(b.documentId, { bookingStatus: "completed" }),
                              {
                                loading: t("toasts.updating", { default: "Updating booking..." }),
                                success: t("toasts.updated", { default: "Booking marked as completed." }),
                                error: (err) => (typeof err === "string" ? err : err?.message || t("toasts.updateFailed", { default: "Failed to update booking." })),
                              }
                            );
                            setItems((prev) => prev.map((it) => (it.documentId === b.documentId ? { ...it, bookingStatus: "completed" } : it)));
                          } catch {
                            // toast already shown
                          }
                        }}
                      >
                        {t("actions.markCompleted", { default: "Mark as Completed" })}
                      </Button>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        title={
          <span className="pr-8">
            {confirmModal.action === "confirm"
              ? t("confirm.acceptTitle", { default: "Accept booking?" })
              : t("confirm.rejectTitle", { default: "Reject booking?" })}
          </span>
        }
        footer={
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button style="ghost" onClick={() => setConfirmModal({ open: false })} type="button">
              {t("actions.cancel", { default: "Cancel" })}
            </Button>
            {confirmModal.action === "confirm" ? (
              <Button style="primary" onClick={confirmAccept} type="button" disabled={processingId === confirmModal.id}>
                {processingId === confirmModal.id ? t("actions.saving", { default: "Saving..." }) : t("actions.accept", { default: "Accept" })}
              </Button>
            ) : (
              <Button style="destructive" onClick={confirmReject} type="button" disabled={rejectingId === confirmModal.id}>
                {rejectingId === confirmModal.id ? t("actions.saving", { default: "Saving..." }) : t("actions.reject", { default: "Reject" })}
              </Button>
            )}
          </div>
        }
      >
        <p>
          {confirmModal.action === "confirm"
            ? t("confirm.accept", { default: "Are you sure you want to accept this booking? Only accept if you can manage it." })
            : t("confirm.reject", { default: "Are you sure you want to reject (cancel) this booking?" })}
        </p>
      </Modal>
      <BookingDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false })}
        booking={detailsModal.booking || {}}
      />
    </div>
  );
};

export default ManageBookings;
