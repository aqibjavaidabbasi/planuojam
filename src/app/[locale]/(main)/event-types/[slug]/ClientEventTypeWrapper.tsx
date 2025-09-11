"use client";
import NoDataCard from "@/components/custom/NoDataCard";
import CategoryCard from "@/components/Dynamic/CategoryCard";
import DynamicZoneRenderer from "@/components/global/DynamicZoneRenderer";
import Button from "@/components/custom/Button";
import Heading from "@/components/custom/heading";
import Loader from "@/components/custom/Loader";
import { useEventTypes } from "@/context/EventTypesContext";
import { fetchListingsPerEvents } from "@/services/common";
import { fetchPageById } from "@/services/pagesApi";
import {
  category,
  DynamicBlocks,
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
  const [categories, setCategories] = useState<category[]>([]);
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

        // Fetch categories
        const listingsRes = await fetchListingsPerEvents(
          eventType.documentId,
          locale
        );
        const allCategories: category[] = listingsRes
          .map((listing: { category: category }) => listing?.category)
          .filter(
            (cat: { documentId: string }): cat is category =>
              !!cat && !!cat.documentId
          );
        const uniqueCategories: category[] = Array.from(
          new Map(allCategories.map((cat) => [cat.documentId, cat])).values()
        );
        setCategories(uniqueCategories);
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
  const vendorCategories = categories.filter(
    (cat) => cat.parentCategory.documentId === VENDOR_DOC_ID
  );
  const venueCategories = categories.filter(
    (cat) => cat.parentCategory.documentId === VENUE_DOC_ID
  );

  return (
    <div>
      {/* hero block on the top */}
      <DynamicZoneRenderer blocks={heroBlock} />

      {/* venue categories */}
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
          {venueCategories.length > 0 ? (
            venueCategories.map((category) => {
              return (
                <CategoryCard key={category.documentId} category={category} />
              );
            })
          ) : (
            <NoDataCard>No Data Found</NoDataCard>
          )}
        </div>
      </div>
      {/* vendor categories */}
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
          {vendorCategories.length > 0 ? (
            vendorCategories.map((category) => {
              return (
                <CategoryCard key={category.documentId} category={category} />
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
