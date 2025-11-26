"use client";
import dynamic from "next/dynamic";
const FiltersAndMap = dynamic(()=>import("@/components/global/FiltersAndMap"),{ssr:false})
const ListingCard  = dynamic(()=>import("@/components/Dynamic/ListingCard"))
const NoDataCard = dynamic(()=>import("@/components/custom/NoDataCard"),{ssr:false})
import { useEventTypes } from "@/context/EventTypesContext";
import { ListingItem, Venue } from "@/types/pagesTypes";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Location } from "@/components/global/MapboxMap";
import { useLocale, useTranslations } from "next-intl";
import geocodeLocations from "@/utils/mapboxLocation";
import { fetchSortedListingsWithMeta } from "@/services/listing";
import LoadMoreButton from "@/components/custom/LoadMoreButton";
import { getListingPath } from "@/utils/routes";

export type ListingWrapperProps = {
  service: string;
  initialList?: ListingItem[];
  initialFilters?: Record<string, string>;
  initialCategoryNames?: string[];
  initialPagination?: { page: number; pageSize: number; pageCount: number; total: number };
};

function ClientListingWrapper({ service, initialList, initialFilters: initialFiltersFromServer, initialCategoryNames, initialPagination }: ListingWrapperProps) {
  const [list, setList] = useState<ListingItem[]>(initialList || []);
  const { localizedEventTypes } = useEventTypes();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const categoryNames = useMemo(() => initialCategoryNames || [], [initialCategoryNames]);
  // Get translations based on service type
  const vendorsT = useTranslations("Vendors");
  const venuesT = useTranslations("Venues");

  const eventTypeNames: string[] = localizedEventTypes.map((event) => event.eventName);

  const categoryFromUrl = searchParams.get("cat");
  const eventTypeFromUrl = searchParams.get("eventType");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(initialPagination?.total ?? (Array.isArray(initialList) ? initialList.length : 0));
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const currentFiltersRef = useRef<Record<string, unknown>>({});
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
    if (initialPagination?.pageSize) setPageSize(initialPagination.pageSize);
    if (initialPagination?.page) setPage(initialPagination.page);
    if (initialPagination?.total !== undefined) setTotal(initialPagination.total);
  }, [initialPagination]);

  const initialFilters = useMemo(() => {
    if (initialFiltersFromServer && Object.keys(initialFiltersFromServer).length) return initialFiltersFromServer;
    const obj: Record<string, string> = {};
    if (categoryFromUrl) obj.category = categoryFromUrl;
    if (eventTypeFromUrl) obj.eventType = eventTypeFromUrl;
    return obj;
  }, [categoryFromUrl, eventTypeFromUrl, initialFiltersFromServer]);

  // Helper function to get the correct translation based on service type
  const getTranslation = useCallback((key: string) => {
    return service === "vendor" ? vendorsT(key) : venuesT(key);
  }, [service, vendorsT, venuesT]);

  const placeholders = useMemo(() => ({
    chooseCategory: service === "vendor" ? "filters.chooseVendor" : "filters.chooseVenue",
    selectPricing: "filters.selectPricing",
    chooseEventType: service === "vendor" ? "filters.pickEventType" : "filters.chooseEventType",
    emptyList: service === "vendor" ? "noVendorsFound" : "noVenuesFound",
  }), [service]);

  // Small wrapper to animate items when they are newly appended
  const AnimatedListItem: React.FC<{ isNew: boolean; children: React.ReactNode }> = ({ isNew, children }) => {
    const [entered, setEntered] = useState(!isNew);
    useEffect(() => {
      if (isNew) {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
      }
    }, [isNew]);
    return (
      <div className={`transition-all duration-300 ease-out will-change-transform ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {children}
      </div>
    );
  };

  type PaginatedResp = { data: ListingItem[]; meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
  const fetcher = useCallback(
    async (appliedFilters: Record<string, unknown>) => {
      const filtersChanged = JSON.stringify(appliedFilters || {}) !== JSON.stringify(currentFiltersRef.current || {});
      const usedPage = filtersChanged ? 1 : page;
      const usedPageSize = pageSize;
      const resp: PaginatedResp = await fetchSortedListingsWithMeta(
        service as 'vendor' | 'venue',
        appliedFilters,
        locale,
        { page: usedPage, pageSize: usedPageSize }
      );
      const meta = resp.meta?.pagination;
      if (meta) {
        if (typeof meta.total === 'number') setTotal(meta.total);
        if (typeof meta.pageSize === 'number') setPageSize(meta.pageSize);
        if (filtersChanged && typeof meta.page === 'number') setPage(meta.page);
      }
      const nextFilters = appliedFilters || {};
      setCurrentFilters(nextFilters);
      currentFiltersRef.current = nextFilters;
      return Array.isArray(resp.data) ? resp.data : [];
    },
    [service, locale, page, pageSize]
  );

  const translatedPricingFilters = useMemo(
    () => [
      getTranslation("filters.withPricingOnly"),
      getTranslation("filters.withoutPricingOnly"),
    ],
    [getTranslation]
  );

  const filters = useMemo(
    () => [
      {
        name: "category",
        options: categoryNames,
        placeholder: getTranslation(placeholders.chooseCategory),
      },
      {
        name: "price",
        options: translatedPricingFilters,
        placeholder: getTranslation(placeholders.selectPricing),
      },
      {
        name: "eventType",
        options: eventTypeNames,
        placeholder: getTranslation(placeholders.chooseEventType),
      },
    ],
    [categoryNames, eventTypeNames, translatedPricingFilters, getTranslation, placeholders]
  );

  // Fetch listings when URL filters change
  useEffect(
    function () {
      const hasServerList = Array.isArray(initialList) && initialList.length > 0;
      // On first render, if server provided initial list and current URL matches initialFilters, skip client fetch
      const urlMatchesInitial = (
        (!initialFiltersFromServer?.category || initialFiltersFromServer.category === categoryFromUrl) &&
        (!initialFiltersFromServer?.eventType || initialFiltersFromServer.eventType === eventTypeFromUrl)
      );
      const shouldSkip = hasServerList && urlMatchesInitial;
      if (shouldSkip) return;
      const filters = {} as Record<string, unknown>;
      async function fetchItems() {
        if (categoryFromUrl) {
          filters.category = {
            name: {
              $eq: categoryFromUrl,
            },
          };
        }
        if (eventTypeFromUrl) {
          filters.eventTypes = {
            eventName: {
              $eq: eventTypeFromUrl,
            },
          };
        }
        try {
          const res = await fetcher(filters);
          setList(res);
        } catch (err) {
          console.error(err);
        }
      }
      fetchItems();
    },
    [service, categoryFromUrl, eventTypeFromUrl, fetcher, locale, initialList, initialFiltersFromServer, initialPagination]
  );

  // Derive locations from current list based on type/__component
  const [locations, setLocations] = useState<Location[]>([]);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        let res: Location[] = [];
        if (service === "vendor") {
          res = await geocodeLocations(list, locale);
        } else if (service === "venue") {
          res = deriveVenueLocations(list, locale);
        } else {
          // Fallback: detect by __component on first item
          const first = list[0];
          const hasVendor = first?.listingItem?.some((b) => b.__component === "dynamic-blocks.vendor");
          res = hasVendor ? await geocodeLocations(list, locale) : deriveVenueLocations(list, locale);
        }
        if (mounted) setLocations(res || []);
      } catch (e) {
        console.error(e);
        if (mounted) setLocations([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [list, service, locale]);

  

  return (
    <div className="py-2">
      <FiltersAndMap
        filters={filters}
        type={service as 'vendor' | 'venue'}
        setList={setList}
        initialFilterValues={initialFilters}
        locations={locations}
        fetcher={fetcher}
      />
      <div className="flex justify-center gap-5 my-10 flex-wrap lg:max-w-[1700px] mx-auto px-4">
        {list.length === 0 ? (
          <NoDataCard>{getTranslation(placeholders.emptyList)}</NoDataCard>
        ) : (
          list.map((item) => (
            <AnimatedListItem key={String(item.documentId)} isNew={newIds.has(String(item.documentId))}>
              <ListingCard item={item} />
            </AnimatedListItem>
          ))
        )}
      </div>
      {list.length < (total || 0) && (
        <div className="flex items-center justify-center my-6">
          <LoadMoreButton
            onClick={async () => {
              if (isLoadingMore) return;
              setIsLoadingMore(true);
              try {
                const nextPage = (Number.isFinite(page as number) ? page : 1) + 1;
                const resp = await fetchSortedListingsWithMeta(
                  service as 'vendor' | 'venue',
                  currentFilters,
                  locale,
                  { page: nextPage, pageSize }
                );
                const newItems = Array.isArray(resp?.data) ? (resp.data as ListingItem[]) : [];
                const meta = resp?.meta?.pagination;
                if (meta && typeof meta.total === 'number') setTotal(meta.total);
                if (newItems.length) {
                  // Determine which items are actually new compared to current list
                  const existingIds = new Set(list.map((it) => String(it.documentId)));
                  const actuallyNew = newItems.filter((it) => !existingIds.has(String(it.documentId)));
                  const addedIds = new Set(actuallyNew.map((it) => String(it.documentId)));
                  if (addedIds.size) {
                    setNewIds(addedIds);
                    setTimeout(() => setNewIds(new Set()), 600);
                  }
                  setList((prev) => {
                    const combined = [...prev, ...newItems];
                    const seen = new Set<string>();
                    return combined.filter((it) => {
                      const key = String(it.documentId);
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                  });
                  setPage(nextPage);
                }
              } finally {
                setIsLoadingMore(false);
              }
            }}
            disabled={list.length >= (total || 0)}
            loading={isLoadingMore}
          />
        </div>
      )}
    </div>
  );
}

export default ClientListingWrapper;

// Helpers
function getListingItemUrl(listing: ListingItem, locale?: string): string {
  if (!listing) return '#';
  if (listing.listingItem.length === 0) return '#';
  return getListingPath(listing.slug, locale);
}

function deriveVenueLocations(items: ListingItem[], locale?: string): Location[] {
  return items
    .map((item) => {
      const venueBlock = item.listingItem.find(
        (block) => block.__component === "dynamic-blocks.venue"
      ) as Venue | undefined;
      if (!venueBlock?.location) return null;
      if (
        typeof venueBlock.location.latitude !== "number" ||
        typeof venueBlock.location.longitude !== "number"
      )
        return null;

      const primaryImage = (item.portfolio && item.portfolio.length > 0)
        ? item.portfolio[0]
        : item.category?.image;

      return {
        id: item.id,
        name: item.title || "Unnamed Venue",
        username: item.user?.username || "Unknown",
        description: item.description || "",
        category: {
          name: item.category?.name || "Uncategorized",
          type: "venue",
        },
        position: {
          lat: venueBlock.location.latitude,
          lng: venueBlock.location.longitude,
        },
        address: venueBlock.location.address || "No address provided",
        image: primaryImage,
        path: getListingItemUrl(item, locale),
      };
    })
    .filter((loc): loc is Location => loc !== null);
}
