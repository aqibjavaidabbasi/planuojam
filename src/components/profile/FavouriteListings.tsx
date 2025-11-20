'use client'
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import ListingCard from "../Dynamic/ListingCard";
import NoDataCard from "../custom/NoDataCard";
import { useLocale, useTranslations } from "next-intl";
import { RootState } from "@/store";
import { FaSpinner } from "react-icons/fa";
import { fetchListingsByDocumentIds } from "@/services/listing";
import { ListingItem } from "@/types/pagesTypes";

function FavouriteListings() {
  const { items, status, error } = useAppSelector((state: RootState) => state.likedListings);
  const t = useTranslations('Profile.FavouriteListings');
  const locale = useLocale();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedIdsRef = useRef<string[]>([]);

  // Extract listing IDs from liked listings - memoized to prevent unnecessary recalculations
  const listingIds = useMemo(() => items.map(item => item.listing).filter(Boolean), [items]);

  useEffect(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (listingIds.length > 0 && status === 'succeeded') {
      // Check if we're already fetching the same IDs
      const idsChanged = JSON.stringify(listingIds.sort()) !== JSON.stringify(lastFetchedIdsRef.current.sort());
      
      if (!idsChanged && listings.length > 0) {
        return; // Already have the data
      }

      setListingsLoading(true);
      setListingsError(null);
      
      abortControllerRef.current = new AbortController();
      lastFetchedIdsRef.current = [...listingIds];

      fetchListingsByDocumentIds(listingIds, locale)
        .then((data) => {
          if (!abortControllerRef.current?.signal.aborted) {
            setListings(data);
          }
        })
        .catch((err) => {
          if (!abortControllerRef.current?.signal.aborted) {
            console.error('Error fetching listings:', err);
            setListingsError('Failed to load listings');
          }
        })
        .finally(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            setListingsLoading(false);
          }
        });
    } else if (listingIds.length === 0) {
      setListings([]);
      lastFetchedIdsRef.current = [];
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || listingsLoading) {
    return (
      <div className="p-8 flex justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || listingsError) {
    return (
      <div className="p-8">
        <NoDataCard>{error || listingsError}</NoDataCard>
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
        {listings.length > 0 ? listings.map((listing) => {
          // Create a mapping between listing and liked item for the key
          const likedItem = items.find(item => item.listing === listing.documentId);
          if (!likedItem) return null;

          if (listing.locale === 'en' && locale === 'en') {
            return <ListingCard key={likedItem.documentId} item={listing} />
          }

          const entry = listing.localizations?.find(loc => loc.locale === locale);
          if (entry) {
            return <ListingCard key={likedItem.documentId} item={entry} />
          }
          // Fallback to original listing if no localization found
          return <ListingCard key={likedItem.documentId} item={listing} />
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
