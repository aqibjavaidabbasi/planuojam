"use client";
import NoDataCard from "@/components/custom/NoDataCard";
import ListingCard from "@/components/Dynamic/ListingCard";
import FiltersAndMap from "@/components/global/FiltersAndMap";
import { Location } from "@/components/global/GoogleMap";
import Loader from "@/components/ui/Loader";
import { useEventTypes } from "@/context/EventTypesContext";
import { fetchListings } from "@/services/common";
import { ListingItem, Venue } from "@/types/pagesTypes";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const PricingFilters = ["With Pricing only", "Without Pricing Only"];
const TYPE = "venue";

function ClientVenueWrapper({ venueNames }: { venueNames: string[] }) {
  const [venueList, setVenueList] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { eventTypes } = useEventTypes();
  const searchParams = useSearchParams();
  const eventTypeNames: string[] = eventTypes.map((event) => event.eventName);

  const categoryFromUrl = searchParams.get("cat");
  const eventTypeFromUrl = searchParams.get("eventType");

  const initialFilters = useMemo(() => {
    const obj: Record<string, string> = {};
    if (categoryFromUrl) obj.category = categoryFromUrl;
    if (eventTypeFromUrl) obj.eventType = eventTypeFromUrl;
    return obj;
  }, [categoryFromUrl, eventTypeFromUrl]);

  const filters = [
    {
      name: "category",
      options: venueNames,
      placeholder: "Choose a venue",
    },
    {
      name: "price",
      options: PricingFilters,
      placeholder: "Select pricing",
    },
    {
      name: "eventType",
      options: eventTypeNames,
      placeholder: "Choose event type",
    },
  ];

  useEffect(
    function () {
      setLoading(true);
      const filters = {};
      async function fetchItems() {
        if (categoryFromUrl) {
          (filters as Record<string, unknown>).category = {
            name: {
              $eq: categoryFromUrl,
            },
          };
        }
        if (eventTypeFromUrl) {
          (filters as Record<string, unknown>).eventTypes = {
            eventName: {
              $eq: eventTypeFromUrl,
            },
          };
        }
        try {
          const res = await fetchListings(TYPE, filters);
          setVenueList(res);
        } catch (err) {
          console.log(err);
        }
        setLoading(false);
      }
      fetchItems();
    },
    [categoryFromUrl, eventTypeFromUrl]
  );

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );

  function getLocationsFromVenues(venues: typeof venueList): Location[] {
    return venues
      .map((item) => {
        const venueBlock = item.listingItem.find(
          (block) => block.__component === "dynamic-blocks.venue"
        ) as Venue | undefined;

        if (!venueBlock?.location) return null;

        return {
          id: item.id,
          name: item.title || "Unnamed Venue",
          username: item.user?.username || "Unknown", // adjust if username is elsewhere
          description: item.description || "",
          category: {
            name: item.category?.name || "Uncategorized", // adjust as needed
            type: "venue",
          },
          position: {
            lat: venueBlock.location.latitude,
            lng: venueBlock.location.longitude,
          },
          address: venueBlock.location.address || "No address provided",
        };
      })
      .filter((location): location is Location => location !== null);
  }

  const locations: Location[] = getLocationsFromVenues(venueList);

  return (
    <div>
      <FiltersAndMap
        filters={filters}
        type={TYPE}
        setList={setVenueList}
        initialFilterValues={initialFilters}
        locations={locations}
      />
      <div className="flex items-center gap-5 my-10 flex-wrap">
        {venueList.length === 0 ? (
          <NoDataCard>No venues Found</NoDataCard>
        ) : (
          venueList.map((venue) => (
            <ListingCard key={venue.documentId} item={venue} />
          ))
        )}
      </div>
    </div>
  );
}

export default ClientVenueWrapper;
