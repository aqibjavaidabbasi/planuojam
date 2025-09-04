"use client";

import NoDataCard from "@/components/custom/NoDataCard";
import ListingCard from "@/components/Dynamic/ListingCard";
import FiltersAndMap from "@/components/global/FiltersAndMap";
import Loader from "@/components/custom/Loader";
import { useEventTypes } from "@/context/EventTypesContext";
import { fetchChildCategories, fetchListings } from "@/services/common";
import { ListingItem, Venue } from "@/types/pagesTypes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Location } from "@/components/global/MapboxMap";
import { useLocale, useTranslations } from "next-intl";
import geocodeLocations from "@/utils/mapboxLocation";
import { useParentCategories } from "@/context/ParentCategoriesContext";

export type ListingWrapperProps = {
  serviceDocId: string;
};

function ClientListingWrapper({ serviceDocId }: ListingWrapperProps) {
  const [list, setList] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { eventTypes } = useEventTypes();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { getServiceTypeFromParentId } = useParentCategories();

  const serviceType = useMemo(() => getServiceTypeFromParentId(serviceDocId), [getServiceTypeFromParentId, serviceDocId]);
  // Fetch child categories (names) for this parent slug
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const i18nNs = serviceType === "vendor" ? "Vendors" : serviceType === "venue" ? "Venues" : undefined;
  const t = useTranslations(i18nNs);

  const eventTypeNames: string[] = eventTypes.map((event) => event.eventName);

  const categoryFromUrl = searchParams.get("cat");
  const eventTypeFromUrl = searchParams.get("eventType");

  const initialFilters = useMemo(() => {
    const obj: Record<string, string> = {};
    if (categoryFromUrl) obj.category = categoryFromUrl;
    if (eventTypeFromUrl) obj.eventType = eventTypeFromUrl;
    return obj;
  }, [categoryFromUrl, eventTypeFromUrl]);

  const placeholders = {
    chooseCategory: serviceType === "vendor" ? "filters.chooseVendor" : "filters.chooseVenue",
    selectPricing: "filters.selectPricing",
    chooseEventType: serviceType === "vendor" ? "filters.pickEventType" : "filters.chooseEventType",
    emptyList: serviceType === "vendor" ? "noVendorsFound" : "noVenuesFound",
  }

  const fetcher = useCallback(
    async (appliedFilters: Record<string, unknown>) => {
      // Delegate to service function filtered by parent slug and locale
      return await fetchListings(
        serviceType as "vendor" | "venue",
        appliedFilters,
        locale
      );
    },
    [serviceType, locale]
  );

  const translatedPricingFilters = useMemo(
    () => [
      t("filters.withPricingOnly"),
      t("filters.withoutPricingOnly"),
    ],
    [t]
  );

  const filters = useMemo(
    () => [
      {
        name: "category",
        options: categoryNames,
        placeholder: t(placeholders.chooseCategory),
      },
      {
        name: "price",
        options: translatedPricingFilters,
        placeholder: t(placeholders.selectPricing),
      },
      {
        name: "eventType",
        options: eventTypeNames,
        placeholder: t(placeholders.chooseEventType),
      },
    ],
    [categoryNames, eventTypeNames, translatedPricingFilters, t, placeholders.chooseCategory, placeholders.selectPricing, placeholders.chooseEventType]
  );

  // Fetch listings when URL filters change
  useEffect(
    function () {
      setLoading(true);
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
          const res = fetcher ? await fetcher(filters) : await fetchListings(serviceType as 'vendor' | 'venue', filters);
          console.log(res);
          setList(res);
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }
      fetchItems();
    },
    [serviceType, categoryFromUrl, eventTypeFromUrl, fetcher]
  );

  // Derive locations from current list based on type/__component
  const [locations, setLocations] = useState<Location[]>([]);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        let res: Location[] = [];
        if (serviceType === "vendor") {
          res = await geocodeLocations(list);
        } else if (serviceType === "venue") {
          res = deriveVenueLocations(list);
        } else {
          // Fallback: detect by __component on first item
          const first = list[0];
          const hasVendor = first?.listingItem?.some((b) => b.__component === "dynamic-blocks.vendor");
          res = hasVendor ? await geocodeLocations(list) : deriveVenueLocations(list);
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
  }, [list, serviceType]);

  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!serviceDocId) return;
      setLoadingCats(true);
      try {
        const cats = await fetchChildCategories(serviceDocId, locale);
        if (!canceled) {
          const names = (cats || []).map((c: { name: string; }) => c.name).filter(Boolean);
          setCategoryNames(names);
        }
      } catch (err) {
        console.error(err);
        if (!canceled) setCategoryNames([]);
      } finally {
        if (!canceled) setLoadingCats(false);
      }
    }
    run();
    return () => {
      canceled = true;
    };
  }, [serviceDocId, locale]);

  if (loading || loadingCats)
    return (
      <div>
        <Loader />
      </div>
    );

  return (
    <div>
      <FiltersAndMap
        filters={filters}
        type={serviceType as 'vendor' | 'venue'}
        setList={setList}
        initialFilterValues={initialFilters}
        locations={locations}
        fetcher={fetcher}
      />
      <div className="flex items-center gap-5 my-10 flex-wrap">
        {list.length === 0 ? (
          <NoDataCard>{t(placeholders.emptyList)}</NoDataCard>
        ) : (
          list.map((item) => <ListingCard key={item.documentId} item={item} />)
        )}
      </div>
    </div>
  );
}

export default ClientListingWrapper;

// Helpers
function deriveVenueLocations(items: ListingItem[]): Location[] {
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
      };
    })
    .filter((loc): loc is Location => loc !== null);
}
