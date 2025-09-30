"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListingItem, Venue } from "@/types/pagesTypes";
import Faqitem from "@/components/Dynamic/Faqitem";
import Loader from "@/components/custom/Loader";
import ListingDetailHero from "@/components/custom/ListingDetailHero";
import VenueCard from "@/components/custom/VenueCard";
import VendorCard from "@/components/custom/VendorCard";
import ListingGallery from "@/components/custom/ListingGallery";
import StarRating from "@/components/global/StarRating";
import SocialIcon from "@/components/global/SocialIcon";
import ListingReviews from "@/components/custom/ListingReviews";
import NoDataCard from "@/components/custom/NoDataCard";
import PricingPlans from "@/components/custom/PricingPlans";
import BookingModal from "@/components/modals/BookingModal";
import ListingCalendar from "@/components/custom/ListingCalendar";
import { useAppSelector } from "@/store/hooks";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { fetchListingBySlug } from "@/services/listing";
import MapboxMap, { Location as MapLocation } from "@/components/global/MapboxMap";
import geocodeLocations from "@/utils/mapboxLocation";

export default function ListingDetailsPage() {
  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { slug } = useParams();
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const locale = useLocale();
  const t = useTranslations("Listing.Details");
  const tCommon = useTranslations("Common");
  const [detailLocation, setDetailLocation] = useState<MapLocation | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectPlanIndex, setPreselectPlanIndex] = useState<number | null>(null);
  

  // Fetch listing data
  useEffect(() => {
    async function loadListing() {
      try {
        const res = await fetchListingBySlug(String(slug), 'en');
        setListing(res);
      } catch (err) {
        console.log(err);
        setError(tCommon("errors.failedToLoad"));
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [slug, locale,tCommon]);

  
  const renderingContent = useMemo(() => {
    if (!listing) return null;
    if (locale === 'en') return listing;
    const entry = listing.localizations?.find((loc) => loc.locale === locale);
    return entry || listing;
  }, [listing, locale]) as ListingItem;

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
      if (!listing) {
        setDetailLocation(null);
        return;
      }
      // Prefer localized content for display values
      const content = renderingContent || listing;
      try {
        if (listing.type === "venue") {
          // Coordinates are taken from the base listing (usually locale-invariant)
          const venueBlockBase = (listing.listingItem || []).find(
            (i) => i.__component === "dynamic-blocks.venue"
          ) as unknown as { location?: { latitude?: number; longitude?: number; address?: string } } | undefined;
          // Prefer localized address if available
          const venueBlockLocalized = (content?.listingItem || []).find(
            (i) => i.__component === "dynamic-blocks.venue"
          ) as { location?: { address?: string } } | undefined;

          const lat = venueBlockBase?.location?.latitude;
          const lng = venueBlockBase?.location?.longitude;
          if (typeof lat === "number" && typeof lng === "number") {
            setDetailLocation({
              id: listing.id,
              name: content.title || "",
              username: listing.user?.username || "",
              description: content.description || "",
              category: { name: content.category?.name || "", type: "venue" },
              position: { lat, lng },
              address: venueBlockLocalized?.location?.address || venueBlockBase?.location?.address || "",
            });
            return;
          }
        } else if (listing.type === "vendor") {
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
  }, [listing, renderingContent]);

  if (loading) return <Loader />;

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">{error || tCommon("errors.notFound")}</p>
      </div>
    );
  }

  console.log("Rendering listing:", renderingContent);
  return (
    <div className="min-h-screen bg-background py-6 md:py-8 lg:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="my-6">
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

        <div className="grid grid-cols-4 md:grid-cols-6 gap-8">
          {/* left side */}
          <div className="col-span-4 space-y-8">
            {/* overview aka description */}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                {t("overview")}
              </h2>
              <p className="text-secondary my-4">{renderingContent.description}</p>
              {/* gallery */}
              {
                renderingContent?.portfolio && renderingContent.portfolio?.length > 0 && (
                  <ListingGallery portfolio={renderingContent.portfolio} title={renderingContent.title} />
                )
              }
          
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

            {/* availability calendar */}
            <ListingCalendar listingDocumentId={renderingContent.documentId} />
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
          </div>
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
          availablePlans={(renderingContent.pricingPackages?.plans || []).map(p => ({ name: p.name, price: p.price, features: (p.featuresList || []).map(f => f.statement) }))}
          availableAddons={renderingContent.pricingPackages?.optionalAddons || []}
          basePrice={renderingContent.price}
          defaultPlanIndex={preselectPlanIndex}
        />
      )}
    </div>
  );
}
