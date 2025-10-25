"use client";
import NoDataCard from "@/components/custom/NoDataCard";
import ListingCard from "@/components/Dynamic/ListingCard";
import DynamicZoneRenderer from "@/components/global/DynamicZoneRenderer";
import Heading from "@/components/custom/heading";
import React from "react";
import { DynamicBlocks, ListingItem, TitleDescriptionBlock } from "@/types/pagesTypes";

type Props = {
  eventBlocks: DynamicBlocks[];
  listings: ListingItem[];
  vendorParentId: string;
  venueParentId: string;
};

function ClientEventTypeWrapper({ eventBlocks, listings, vendorParentId, venueParentId }: Props) {
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
  const vendorListings = listings.filter(
    (listing) => listing.category?.parentCategory?.documentId === vendorParentId
  );
  const venueListings = listings.filter(
    (listing) => listing.category?.parentCategory?.documentId === venueParentId
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
