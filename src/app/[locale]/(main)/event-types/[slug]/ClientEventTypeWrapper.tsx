"use client";
import NoDataCard from "@/components/custom/NoDataCard";
import ListingCard from "@/components/Dynamic/ListingCard";
import DynamicZoneRenderer from "@/components/global/DynamicZoneRenderer";
import Heading from "@/components/custom/heading";
import LoadMoreButton from "@/components/custom/LoadMoreButton";
import React, { useCallback, useEffect, useState } from "react";
import { DynamicBlocks, ListingItem, TitleDescriptionBlock } from "@/types/pagesTypes";
import { fetchPromotedListingsPerEventsWithMeta } from "@/services/listing";

type Props = {
  eventBlocks: DynamicBlocks[];
  listingsVenueInitial: ListingItem[];
  listingsVendorInitial: ListingItem[];
  vendorParentId: string;
  venueParentId: string;
  venuePagination?: { page: number; pageSize: number; pageCount: number; total: number };
  vendorPagination?: { page: number; pageSize: number; pageCount: number; total: number };
  eventTypeId?: string;
  locale: string;
};

function ClientEventTypeWrapper({
  eventBlocks,
  listingsVenueInitial,
  listingsVendorInitial,
  vendorParentId,
  venueParentId,
  venuePagination,
  vendorPagination,
  eventTypeId,
  locale
}: Props) {
  const eventBlock = Array.isArray(eventBlocks) ? eventBlocks : [];

  // derived states for better data management
  const heroBlock = eventBlock.filter(
    (block) => block.__component === "dynamic-blocks.hero-banner"
  );
  const faqBlock = eventBlock.filter(
    (block) => block.__component === "dynamic-blocks.faqs"
  );
  const restBlocks = eventBlock.filter(
    (block) =>
      ![
        "dynamic-blocks.faqs",
        "dynamic-blocks.hero-banner",
        "general.title-description",
      ].includes(block.__component)
  );
  const titleDescriptionBlocks = eventBlock.filter(
    (block) => block.__component === "general.title-description"
  );
  function isVenueBlock(block: TitleDescriptionBlock) {
    return block.listingType === "venue";
  }

  function isVendorBlock(block: TitleDescriptionBlock) {
    return block.listingType === "vendor";
  }

  const venueTitleBlock = titleDescriptionBlocks.find(isVenueBlock);
  const vendorTitleBlock = titleDescriptionBlocks.find(isVendorBlock);
  const [venueListings, setVenueListings] = useState<ListingItem[]>(Array.isArray(listingsVenueInitial) ? listingsVenueInitial : []);
  const [vendorListings, setVendorListings] = useState<ListingItem[]>(Array.isArray(listingsVendorInitial) ? listingsVendorInitial : []);
  const [venuePage, setVenuePage] = useState<number>(venuePagination?.page || 1);
  const [venuePageSize, setVenuePageSize] = useState<number>(venuePagination?.pageSize || 5);
  const [venueTotal, setVenueTotal] = useState<number>(venuePagination?.total || (Array.isArray(listingsVenueInitial) ? listingsVenueInitial.length : 0));
  const [vendorPage, setVendorPage] = useState<number>(vendorPagination?.page || 1);
  const [vendorPageSize, setVendorPageSize] = useState<number>(vendorPagination?.pageSize || 5);
  const [vendorTotal, setVendorTotal] = useState<number>(vendorPagination?.total || (Array.isArray(listingsVendorInitial) ? listingsVendorInitial.length : 0));
  const [newVenueIds, setNewVenueIds] = useState<Set<string>>(new Set());
  const [newVendorIds, setNewVendorIds] = useState<Set<string>>(new Set());

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

  const loadMoreVenue = useCallback(async () => {
    if (!eventTypeId) return;
    const resp = await fetchPromotedListingsPerEventsWithMeta(
      eventTypeId,
      locale,
      { page: (Number.isFinite(venuePage as number) ? venuePage : 1) + 1, pageSize: venuePageSize },
      { category: { parentCategory: { documentId: venueParentId } } }
    );
    const meta = resp?.meta?.pagination;
    if (meta && typeof meta.total === 'number') setVenueTotal(meta.total);
    if (meta && typeof meta.pageSize === 'number') setVenuePageSize(meta.pageSize);
    const newItems = Array.isArray(resp?.data) ? (resp.data as ListingItem[]) : [];
    if (newItems.length) {
      const existingIds = new Set(venueListings.map((l) => String(l.documentId)));
      const actuallyNew = newItems.filter((it) => !existingIds.has(String(it.documentId)));
      const addedIds = new Set(actuallyNew.map((it) => String(it.documentId)));
      if (addedIds.size) {
        setNewVenueIds(addedIds);
        setTimeout(() => setNewVenueIds(new Set()), 600);
      }
      setVenueListings((prev) => {
        const combined = [...prev, ...newItems];
        const seen = new Set<string>();
        return combined.filter((it) => {
          const key = String(it.documentId);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setVenuePage((p) => p + 1);
    }
  }, [eventTypeId, locale, venuePage, venuePageSize, venueListings, venueParentId]);

  const loadMoreVendor = useCallback(async () => {
    if (!eventTypeId) return;
    const resp = await fetchPromotedListingsPerEventsWithMeta(
      eventTypeId,
      locale,
      { page: (Number.isFinite(vendorPage as number) ? vendorPage : 1) + 1, pageSize: vendorPageSize },
      { category: { parentCategory: { documentId: vendorParentId } } }
    );
    const meta = resp?.meta?.pagination;
    if (meta && typeof meta.total === 'number') setVendorTotal(meta.total);
    if (meta && typeof meta.pageSize === 'number') setVendorPageSize(meta.pageSize);
    const newItems = Array.isArray(resp?.data) ? (resp.data as ListingItem[]) : [];
    if (newItems.length) {
      const existingIds = new Set(vendorListings.map((l) => String(l.documentId)));
      const actuallyNew = newItems.filter((it) => !existingIds.has(String(it.documentId)));
      const addedIds = new Set(actuallyNew.map((it) => String(it.documentId)));
      if (addedIds.size) {
        setNewVendorIds(addedIds);
        setTimeout(() => setNewVendorIds(new Set()), 600);
      }
      setVendorListings((prev) => {
        const combined = [...prev, ...newItems];
        const seen = new Set<string>();
        return combined.filter((it) => {
          const key = String(it.documentId);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setVendorPage((p) => p + 1);
    }
  }, [eventTypeId, locale, vendorPage, vendorPageSize, vendorListings, vendorParentId]);

  return (
    <div>
      {/* hero block on the top */}
      <DynamicZoneRenderer blocks={heroBlock} />

      {/* venue listings */}
      <div className="w-full py-5 md:py-10 px-3 md:px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center gap-2">
          {venueTitleBlock?.heading?.headingPiece && (
            <Heading headingPiece={venueTitleBlock.heading.headingPiece} />
          )}
          {venueTitleBlock?.sectionDescription && (
            <p className="text-center">{venueTitleBlock.sectionDescription}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          {venueListings.length > 0 ? (
            venueListings.map((listing) => {
              return (
                <AnimatedListItem key={String(listing.documentId)} isNew={newVenueIds.has(String(listing.documentId))}>
                  <ListingCard item={listing} />
                </AnimatedListItem>
              );
            })
          ) : (
            <NoDataCard>No Data Found</NoDataCard>
          )}
        </div>
        {venueListings.length < (venueTotal || 0) && (
          <div className="flex items-center justify-center my-6">
            <LoadMoreButton onClick={loadMoreVenue} />
          </div>
        )}
      </div>
      {/* vendor listings */}
      <div className="w-full py-5 md:py-10 px-3 md:px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center gap-2">
          {vendorTitleBlock?.heading?.headingPiece && (
            <Heading
              extraStyles="!text-center"
              headingPiece={vendorTitleBlock.heading.headingPiece}
            />
          )}
          {vendorTitleBlock?.sectionDescription && (
            <p className="text-center">{vendorTitleBlock.sectionDescription}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          {vendorListings.length > 0 ? (
            vendorListings.map((listing) => {
              return (
                <AnimatedListItem key={String(listing.documentId)} isNew={newVendorIds.has(String(listing.documentId))}>
                  <ListingCard item={listing} />
                </AnimatedListItem>
              );
            })
          ) : (
            <NoDataCard>No Data Found</NoDataCard>
          )}
        </div>
        {vendorListings.length < (vendorTotal || 0) && (
          <div className="flex items-center justify-center my-6">
            <LoadMoreButton onClick={loadMoreVendor} />
          </div>
        )}
      </div>

      {/* rest of the other blocks in middle */}
      <DynamicZoneRenderer blocks={restBlocks} />

      {/* faq block on the end */}
      <DynamicZoneRenderer blocks={faqBlock} />
    </div>
  );
}

export default ClientEventTypeWrapper;
