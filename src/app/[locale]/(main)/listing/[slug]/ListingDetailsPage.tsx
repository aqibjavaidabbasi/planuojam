"use client";
import dynamic from "next/dynamic";
const ListingGallery = dynamic(() => import("@/components/custom/ListingGallery"));
const MapboxMap = dynamic(() => import("@/components/global/MapboxMap"), { ssr: false });
const ListingCalendar = dynamic(() => import("@/components/custom/ListingCalendar"), { ssr: false });
const BookingModal = dynamic(() => import("@/components/modals/BookingModal"), { ssr: false });
const ListingDetailHero = dynamic(()=>import("@/components/custom/ListingDetailHero"))
const Faqitem = dynamic(() => import("@/components/Dynamic/Faqitem"), { ssr: false });
const VenueCard = dynamic(() => import("@/components/custom/VenueCard"), { ssr: false });
const VendorCard = dynamic(() => import("@/components/custom/VendorCard"), { ssr: false });
const StarRating = dynamic(() => import("@/components/global/StarRating"), { ssr: false });
const SocialIcon = dynamic(() => import("@/components/global/SocialIcon"), { ssr: false });
const ListingReviews = dynamic(() => import("@/components/custom/ListingReviews"), { ssr: false });
const NoDataCard = dynamic(() => import("@/components/custom/NoDataCard"), { ssr: false });
const PricingPlans = dynamic(() => import("@/components/custom/PricingPlans"), { ssr: false });

import { useEffect, useMemo, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListingItem, Venue } from "@/types/pagesTypes";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";
import geocodeLocations from "@/utils/mapboxLocation";
import { Location as MapLocation } from "@/components/global/MapboxMap";
import { notFound } from "next/navigation";
import { RootState } from "@/store";

export default function ListingDetailsPage({ initialListing, locale }: { initialListing: ListingItem; locale: string }) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const t = useTranslations("Listing.Details");
  const [detailLocation, setDetailLocation] = useState<MapLocation | null>(null);
  const user = useAppSelector((s: RootState) => s.auth.user);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectPlanIndex, setPreselectPlanIndex] = useState<number | null>(null);
  const tSchedule = useTranslations("Listing.Details");

  const renderingContent = useMemo(() => {
    if (!initialListing) return null;
    if (locale === 'en') return initialListing;
    const entry = initialListing.localizations?.find((loc) => loc.locale === locale);
    return entry || initialListing;
  }, [initialListing, locale]) as ListingItem;

  // typed access to venue block (if listing type is venue)
  const venueBlock = useMemo(() => {
    if (!renderingContent) return undefined;
    const vb = (renderingContent.listingItem || []).find(
      (i) => (i as { __component?: string }).__component === "dynamic-blocks.venue"
    ) as Venue | undefined;
    return vb;
  }, [renderingContent]);

  // Compute a single map location for this listing
  useEffect(() => {
    async function computeLocation() {
      if (!initialListing) {
        setDetailLocation(null);
        return;
      }
      // Prefer localized content for display values
      const content = initialListing;
      try {
        if (initialListing.type === "venue") {
          // Coordinates are taken from the base listing (usually locale-invariant)
          const venueBlockBase = (initialListing.listingItem || []).find(
            (i) => i.__component === "dynamic-blocks.venue"
          ) as unknown as { location?: { latitude?: number; longitude?: number; address?: string } } | undefined;
          // Prefer localized address if available
          const venueBlockLocalized = (content?.listingItem || []).find(
            (i) => i.__component === "dynamic-blocks.venue"
          ) as { location?: { address?: string } } | undefined;

          const lat = venueBlockBase?.location?.latitude;
          const lng = venueBlockBase?.location?.longitude;
          if (typeof lat === "number" && typeof lng === "number") {

            const primaryImage = (initialListing.portfolio && initialListing.portfolio.length > 0)
              ? initialListing.portfolio[0]
              : initialListing.category?.image;
            const path = (() => {
              if (!initialListing) return "#";
              if (initialListing.listingItem.length === 0) return "#";
              if (initialListing.locale === "en") return `/listing/${initialListing.slug}`;
              const entry = initialListing.localizations.find((loc) => loc.locale === "en");
              return entry ? `/listing/${entry.slug}` : "#";
            })();
            setDetailLocation({
              id: initialListing.id,
              name: content.title || "",
              username: initialListing.user?.username || "",
              description: content.description || "",
              category: { name: content.category?.name || "", type: "venue" },
              position: { lat, lng },
              address: venueBlockLocalized?.location?.address || venueBlockBase?.location?.address || "",
              image: primaryImage,
              path,
            });
            return;
          }
        } else if (initialListing.type === "vendor") {
          // Geocode vendor using localized content for better display/address coherency
          const res = await geocodeLocations([content as ListingItem]);
          const first = res?.[0] || null;
          if (first) {
            setDetailLocation({
              ...first,
              name: content.title || first.name,
              description: content.description || first.description,
              category: { name: content.category?.name || first.category?.name || "", type: "vendor" },
            });
          } else {
            setDetailLocation(null);
          }
          return;
        }
        setDetailLocation(null);
      } catch (e) {
        console.error(e);
        setDetailLocation(null);
      }
    }
    computeLocation();
  }, [initialListing]);


  if(!renderingContent) notFound();

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">

        {/* gallery */}
        {
          renderingContent?.portfolio && renderingContent.portfolio?.length > 0 && (
            <ListingGallery 
              portfolio={renderingContent.portfolio} 
              title={renderingContent.title || "Listing Gallery"} 
              mainImageId={renderingContent.mainImageId || ""}
            />
          )
        }

        <div className="grid grid-cols-4 md:grid-cols-6 gap-8">
          {/* left side */}

          <div className="col-span-4 space-y-8">
            {/* hero section moved to right */}
            <section className="">
              <ListingDetailHero
                category={renderingContent.category?.name}
                title={renderingContent.title}
                username={renderingContent.user?.username}
                vendorUserId={renderingContent?.user?.id}
                contact={renderingContent.contact}
                websiteLink={renderingContent.websiteLink}
                price={renderingContent.price}
                hotDeal={renderingContent.hotDeal}
                onOpenBooking={(idx) => {
                  setPreselectPlanIndex(typeof idx === 'number' ? idx : null);
                  setShowBookingModal(true);
                }}
              />
            </section>
            {/* overview aka description */}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                {t("overview")}
              </h2>
              <p className="text-secondary my-4">{renderingContent.description}</p>
            </div>
            {/* location map */}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t("location")}</h2>
              {detailLocation ? (
                <div className="h-[45vh] max-h-[400px] md:h-[50vh] md:max-h-[600px] lg:h-[60vh] lg:max-h-[800px]">
                  <MapboxMap locations={[detailLocation]} />
                </div>
              ) : (
                <NoDataCard>{t("noLocation")}</NoDataCard>
              )}
            </div>
          </div>

          {/* right side */}
          <div className="space-y-6 col-span-4 md:col-span-2">
            {/* rating component */}
            {renderingContent.averageRating && (
              <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                <div className="flex items-start lg:items-center flex-row md:flex-col lg:flex-row justify-between md:justify-start lg:justify-between" >
                  <p className="text-lg font-semibold" >{t("rating")}: </p>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={renderingContent.averageRating} />
                    <p className="text-base lg:text-lg text-secondary">
                      {renderingContent.averageRating}/5 ({renderingContent.ratingsCount})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* listing item details card*/}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <div className="flex items-center gap-2.5 flex-wrap">
                {renderingContent.eventTypes.map((event) => (
                  <span
                    key={event.id}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {event.eventName}
                  </span>
                ))}
              </div>
              {renderingContent.listingItem.map((item, index) => (
                <div key={index} className="my-4">
                  {renderingContent.type === "venue" &&
                    item.__component === "dynamic-blocks.venue" && (
                      <VenueCard item={item} />
                    )}
                  {renderingContent.type === "vendor" &&
                    item.__component === "dynamic-blocks.vendor" && (
                      <VendorCard item={item} />
                    )}
                </div>
              ))}
            </div>

            {/* Hot Deal Section */}
            {renderingContent.hotDeal && renderingContent.hotDeal.enableHotDeal && (
              <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {t("hotDeal")}
                </h2>
                <div className="p-3 md:p-4 lg:p-6 bg-primary/10 rounded-lg shadow-sm">
                  <p className="text-secondary">
                    {renderingContent.hotDeal.discount?.discountType
                      .toLowerCase()
                      .includes("flat")
                      ? `${t("flatRate")}: ${renderingContent.hotDeal.discount.flatRatePrice}`
                      : `${renderingContent.hotDeal.discount?.percentage}% ${t("percentOff")}`}
                  </p>
                  <p className="text-secondary">{renderingContent.hotDeal.dealNote}</p>
                  <p className="text-secondary">
                    {t("valid")}:{" "}
                    {new Date(renderingContent.hotDeal.startDate).toLocaleDateString()} -{" "}
                    {new Date(renderingContent.hotDeal.lastDate).toLocaleDateString()}
                  </p>
                </div>
              </section>
            )}

            {/* Social Links Section */}
            {renderingContent.socialLinks &&
              renderingContent.socialLinks.socialLink.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                  <h2 className="text-base font-semibold text-black mb-2 capitalize">
                    {renderingContent.socialLinks.optionalSectionTitle}
                  </h2>
                  <SocialIcon socialLink={renderingContent.socialLinks.socialLink} />
                </section>
              )}

            {/* Working Schedule Section */}
            {renderingContent.workingSchedule && renderingContent.workingSchedule.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {tSchedule("workingScheduleTitle", { default: "Working Schedule" })}
                </h2>
                {(() => {
                  const daysOrder = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
                  const schedule = (renderingContent.workingSchedule || []);
                  const byDay: Record<string, {start: string; end: string}[]> = {};
                  for (const d of daysOrder) byDay[d] = [];
                  schedule.forEach(w => {
                    const key = (w?.day || "").toLowerCase();
                    if (byDay[key]) byDay[key].push({ start: w.start, end: w.end });
                  });
                  return (
                    <div className="divide-y">
                      {daysOrder.map((d) => {
                        const label = tSchedule(`days.${d}`, { default: d.charAt(0).toUpperCase() + d.slice(1) });
                        const windows = byDay[d];
                        const isClosed = !windows || windows.length === 0;
                        return (
                          <div className="py-2 flex items-start justify-between gap-3" key={d}>
                            <div className="font-medium text-gray-800 min-w-28">{label}</div>
                            <div className="text-gray-700 flex-1">
                              {isClosed ? (
                                <span className="text-gray-500">{tSchedule("workingScheduleClosed", { default: "Closed" })}</span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {windows.map((w, i) => (
                                    <span key={i} className="inline-block rounded bg-gray-50 border border-gray-200 px-2 py-0.5 text-sm">{w.start} – {w.end}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            )}
          </div>
        </div>

        <div id="availability" className="mt-6">
          {/* availability calendar */}
          <ListingCalendar listingDocumentId={renderingContent.documentId} workingSchedule={renderingContent.workingSchedule || []} />
        </div>

        {/* Reviews Section */}
        <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">{t("reviews")}</h2>
          {renderingContent.reviews && renderingContent.reviews.length > 0 ? (
            <ListingReviews reviews={renderingContent.reviews} />
          ) : (
            <NoDataCard>{t("noReviews")}</NoDataCard>
          )}
        </section>

        {/* Pricing Section */}
        {renderingContent.pricingPackages && (
          <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {renderingContent.pricingPackages.sectionTitle}
            </h2>
            <div className="flex justify-center items-center">
              {renderingContent.pricingPackages.plans.map((plan, index) => (
                <PricingPlans
                  key={index}
                  plan={plan}
                  optionalAddons={renderingContent.pricingPackages?.optionalAddons}
                  planIndex={index}
                  onSelectPlan={(i) => {
                    setPreselectPlanIndex(i);
                    setShowBookingModal(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* FAQs section */}
        {renderingContent.FAQs && renderingContent.FAQs.items.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">{t("faqs")}</h2>
            <div className="max-w-xl mx-auto">
              {renderingContent.FAQs.items.map((faq, i) => {
                const isOpen = openIndexes.includes(i);
                return (
                  <Faqitem
                    key={faq.id || i}
                    idx={i}
                    faq={faq}
                    isOpen={isOpen}
                    setOpenIndexes={setOpenIndexes}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
      {/* Booking Modal at page level */}
      {renderingContent && (
        <BookingModal
          showModal={showBookingModal}
          setShowModal={setShowBookingModal}
          listingDocumentId={renderingContent.documentId}
          userDocumentId={user?.documentId || ""}
          bookingDurationType={venueBlock?.bookingDurationType as ("Per Day" | "Per Hour") | undefined}
          bookingDuration={venueBlock?.bookingDuration}
          workingSchedule={renderingContent.workingSchedule || []}
          availablePlans={(renderingContent.pricingPackages?.plans || []).map(p => ({ name: p.name, price: p.price, features: (p.featuresList || []).map(f => f.statement) }))}
          availableAddons={renderingContent.pricingPackages?.optionalAddons || []}
          basePrice={renderingContent.price}
          defaultPlanIndex={preselectPlanIndex}
        />
      )}
    </div>
  );
}
