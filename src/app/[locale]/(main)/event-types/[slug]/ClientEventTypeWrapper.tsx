"use client";
import NoDataCard from "@/components/custom/NoDataCard";
import ListingCard from "@/components/Dynamic/ListingCard";
import DynamicZoneRenderer from "@/components/global/DynamicZoneRenderer";
import Button from "@/components/custom/Button";
import Heading from "@/components/custom/heading";
import Loader from "@/components/custom/Loader";
import { useEventTypes } from "@/context/EventTypesContext";
import { fetchPromotedListingsPerEvents } from "@/services/listing";
import { fetchPageById } from "@/services/pagesApi";
import {
  DynamicBlocks,
  ListingItem,
  TitleDescriptionBlock,
} from "@/types/pagesTypes";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParentCategories } from "@/context/ParentCategoriesContext";

function ClientEventTypeWrapper() {
  const { getEventTypeBySlug } = useEventTypes();
  const params = useParams();
  const  { slug } = params;
  const eventType = getEventTypeBySlug(slug as string);
  const [eventBlock, setEventBlocks] = useState<DynamicBlocks[]>([]);
  const router = useRouter();
  // Type assertion for now since we know the API returns compatible data
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const { VENDOR_DOC_ID, VENUE_DOC_ID } = useParentCategories();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (eventType && eventType.page) {
        // Fetch page data
        const pageRes = await fetchPageById(eventType.page.documentId, locale);
        setEventBlocks(pageRes.blocks);

        // Fetch listings (promoted-first)
        const listingsRes = await fetchPromotedListingsPerEvents(
          eventType.documentId,
          locale
        );
        setListings(listingsRes);
      }
      setLoading(false);
    }
    fetchData();
  }, [eventType, locale]);

  if (!eventType || loading) return <Loader />;

  if (!eventType?.page)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center border border-gray-200 flex flex-col items-center justify-center">
          <p className="p-3 rounded-md text-lg font-semibold text-red-500">
            {eventType?.eventName}
          </p>
          <p className="text-gray-700 text-lg font-medium">
            This page has not yet been created in Strapi, or if it is created,
            the link to this page is missing.
          </p>
          <Button style="ghost" onClick={() => router.push("/")}>
            Go to homepage
          </Button>
        </div>
      </div>
    );

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
  const vendorListings = listings.filter(
    (listing) => listing.category?.parentCategory?.documentId === VENDOR_DOC_ID
  );
  const venueListings = listings.filter(
    (listing) => listing.category?.parentCategory?.documentId === VENUE_DOC_ID
  );

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
                <ListingCard key={listing.documentId} item={listing} />
              );
            })
          ) : (
            <NoDataCard>No Data Found</NoDataCard>
          )}
        </div>
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
                <ListingCard key={listing.documentId} item={listing} />
              );
            })
          ) : (
            <NoDataCard>No Data Found</NoDataCard>
          )}
        </div>
      </div>

      {/* rest of the other blocks in middle */}
      <DynamicZoneRenderer blocks={restBlocks} />

      {/* faq block on the end */}
      <DynamicZoneRenderer blocks={faqBlock} />
    </div>
  );
}

export default ClientEventTypeWrapper;
