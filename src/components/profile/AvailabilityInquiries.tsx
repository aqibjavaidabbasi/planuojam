"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { AvailabilityInquiry, getProviderInquiries, updateInquiryStatus } from "@/services/availabilityForm";
import NoDataCard from "@/components/custom/NoDataCard";
import AvailabilityInquiryCard from "./AvailabilityInquiryCard";
import { translateError } from "@/utils/translateError";

const AvailabilityInquiries: React.FC = () => {
  const user = useAppSelector((s) => s.auth.user);
  const t = useTranslations("Profile.AvailabilityInquiries");
  const tErrors = useTranslations("Errors");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AvailabilityInquiry[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const total = items.length;
    const isNew = items.filter((i) => i.submissionStatus === "new").length;
    const underDiscussion = items.filter((i) => i.submissionStatus === "underDiscussion").length;
    const completed = items.filter((i) => i.submissionStatus === "completed").length;
    const rejected = items.filter((i) => i.submissionStatus === "rejected").length;
    return { total, isNew, underDiscussion, completed, rejected };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.submissionStatus === statusFilter);
  }, [items, statusFilter]);

  const loadInquiries = useCallback(async () => {
    if (!user?.documentId) return;
    try {
      setLoading(true);
      const data = await getProviderInquiries(user.documentId);
      setItems(data || []);
      setError(null);
    } catch (err: unknown) {
      const msg = translateError(t, tErrors, err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.documentId, t, tErrors]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleUpdateStatus = async (documentId: string, newStatus: "underDiscussion" | "completed" | "rejected") => {
    try {
      setUpdatingId(documentId);
      await toast.promise(
        updateInquiryStatus(documentId, newStatus),
        {
          loading: t("toasts.updating"),
          success: t("toasts.updated"),
          error: (err) => translateError(t, tErrors, err),
        }
      );
      setItems((prev) => 
        prev.map((it) => it.documentId === documentId ? { ...it, submissionStatus: newStatus } : it)
      );
      // toast shown by promise
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t("title")}</h2>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
            {t("filters.status")}
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="new">{t("status.new")}</option>
            <option value="underDiscussion">{t("status.underDiscussion")}</option>
            <option value="completed">{t("status.completed")}</option>
            <option value="rejected">{t("status.rejected")}</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: t("stats.total"), value: stats.total, color: "gray" },
          { label: t("status.new"), value: stats.isNew, color: "blue" },
          { label: t("status.underDiscussion"), value: stats.underDiscussion, color: "orange" },
          { label: t("status.completed"), value: stats.completed, color: "green" },
          { label: t("status.rejected"), value: stats.rejected, color: "red" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && error && <NoDataCard>{error}</NoDataCard>}

      {!loading && !error && filteredItems.length === 0 && (
        <NoDataCard>{t("noInquiries")}</NoDataCard>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <ul className="space-y-4">
          {filteredItems.map((item) => (
            <AvailabilityInquiryCard
              key={item.documentId}
              name={item.name}
              email={item.email}
              phone={item.phone}
              message={item.message}
              status={item.submissionStatus || "new"}
              statusLabel={t(`status.${item.submissionStatus || "new"}`)}
              createdAt={item.createdAt}
              listingDocumentId={item.listingDocumentId}
              isUpdating={updatingId === item.documentId}
              onUpdateStatus={(newStatus) => handleUpdateStatus(item.documentId, newStatus)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default AvailabilityInquiries;
