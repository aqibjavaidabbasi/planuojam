import React, { useEffect, useMemo, useState } from "react";
import NoDataCard from "../custom/NoDataCard";
import Button from "../custom/Button";
import ListingItemModal from "../modals/ListingItemModal";
import { useAppSelector } from "@/store/hooks";
import Select from "../custom/Select";
import { fetchListingsByUser } from "@/services/listing";
import type { ListingItem } from "@/types/pagesTypes";
import ListingCard from "@/components/Dynamic/ListingCard";
import { useLocale, useTranslations } from "next-intl";
import { RootState } from "@/store";

function Mylistings() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const user = useAppSelector((state: RootState) => state.auth.user);
  const t = useTranslations('Profile.MyListings');
  const tCommon = useTranslations('Common');
  const locale = useLocale()

  const statusOptions = useMemo(
    () => [
      { label: t('status.draft'), value: "draft" },
      { label: t('status.published'), value: "published" },
      { label: t('status.pending'), value: "pending review" },
      { label: t('status.archived'), value: "archived" },
    ],
    [t]
  );

  const loadListings = async () => {
    if (!user?.documentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListingsByUser(user.documentId, statusFilter, locale);
      setListings(data);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : '';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.documentId, statusFilter]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4 md:mb-6 flex flex-col gap-4 md:gap-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{t('title')}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2 truncate">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
          <div className="flex-1 sm:flex-none sm:min-w-48">
            <Select
              label={t('filterLabel')}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              options={statusOptions}
              placeholder={t('allStatuses')}
            />
          </div>
          <Button style="secondary" size="large" onClick={() => setOpen(true)} extraStyles="!whitespace-nowrap flex-shrink-0">
            {t('create')}
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm md:text-base text-gray-600">{tCommon('loading')}</p>}
      {!loading && error && <p className="text-sm md:text-base text-red-600">{error}</p>}

      {!loading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <NoDataCard>{t('empty')}</NoDataCard>
          <Button style="secondary" size="large" onClick={() => setOpen(true)}>
            {t('create')}
          </Button>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
          {listings.map((l) => (
            <ListingCard key={l.documentId} item={l} />
          ))}
        </div>
      )}

      <ListingItemModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          loadListings();
          setOpen(false);
        }}
      />
    </div>
  );
}

export default Mylistings;

