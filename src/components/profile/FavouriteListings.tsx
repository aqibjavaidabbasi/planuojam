'use client'
import React from "react";
import { useAppSelector } from "@/store/hooks";
import ListingCard from "../Dynamic/ListingCard";
import NoDataCard from "../custom/NoDataCard";
import { useLocale, useTranslations } from "next-intl";
import { RootState } from "@/store";
import { FaSpinner } from "react-icons/fa";

function FavouriteListings() {
  const { items, status, error } = useAppSelector((state: RootState) => state.likedListings);
  const t = useTranslations('Profile.FavouriteListings');
  const locale = useLocale();

  if (status === 'loading') {
    return (
      <div className="p-8 flex justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <NoDataCard>{error}</NoDataCard>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-6">
        {items.length > 0 ? items.map((item) => {
          const listing = item.listing;
          if (!listing) return null;

          if (listing.locale === 'en' && locale === 'en') {
            return <ListingCard key={item.documentId} item={listing} />
          }

          const entry = listing.localizations?.find(loc => loc.locale === locale);
          if (entry) {
            return <ListingCard key={item.documentId} item={entry} />
          }
          // Fallback to original listing if no localization found
          return <ListingCard key={item.documentId} item={listing} />
        })
        : <div className="col-span-3">
            <NoDataCard>{t('empty')}</NoDataCard>
          </div>
        }
      </div>
    </div>
  );
}

export default FavouriteListings;
