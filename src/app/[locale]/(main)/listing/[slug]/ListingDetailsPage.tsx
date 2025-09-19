"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListingItem } from "@/types/pagesTypes";
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
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { fetchListingBySlug } from "@/services/listing";

export default function ListingDetailsPage() {
  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { slug } = useParams();
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const locale = useLocale();
  const t = useTranslations("Listing.Details");
  const tCommon = useTranslations("Common");
  

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

  if (loading) return <Loader />;

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">{error || tCommon("errors.notFound")}</p>
      </div>
    );
  }

  let renderingContent;
  if (listing.locale === 'en') renderingContent = listing;
  else if (listing.locale !== 'en') {
    const entry = listing.localizations.find(loc => loc.locale === 'en');
    renderingContent = entry || listing; // Fallback to original if no 'en' localization
  }else {
    renderingContent = listing
  }

  console.log(renderingContent)


  return (
    <div className="min-h-screen bg-background py-6 md:py-8 lg:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="my-6">
          <ListingDetailHero
            category={renderingContent.category?.name}
            title={renderingContent.title}
            username={renderingContent.user?.username}
            contact={renderingContent.contact}
            price={renderingContent.price}
            hotDeal={renderingContent.hotDeal}
            websiteLink={renderingContent.websiteLink}
            listingDocumentId={renderingContent.documentId}
            bookingDurationType={(() => {
              const venue = (renderingContent.listingItem || []).find((i) => i.__component === "dynamic-blocks.venue") as unknown as { bookingDurationType?: string } | undefined;
              const t = venue?.bookingDurationType;
              return t === "Per Day" || t === "Per Hour" ? t : undefined;
            })()}
            bookingDuration={(() => {
              const venue = (renderingContent.listingItem || []).find((i) => i.__component === "dynamic-blocks.venue") as unknown as { bookingDuration?: number } | undefined;
              return typeof venue?.bookingDuration === "number" ? venue?.bookingDuration : undefined;
            })()}
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
                renderingContent.portfolio && renderingContent.portfolio.length > 0 && (
                <ListingGallery
                portfolio={renderingContent.portfolio}
                title={renderingContent.title}
              />
                )
              }
          
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
                    key={event.documentId}
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
                    {renderingContent.hotDeal.discount.discountType
                      .toLowerCase()
                      .includes("flat")
                      ? `${t("flatRate")}: ${renderingContent.hotDeal.discount.flatRatePrice}`
                      : `${renderingContent.hotDeal.discount.percentage}% ${t("percentOff")}`}
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
    </div>
  );
}
