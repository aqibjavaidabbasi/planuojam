"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListingItem } from "@/types/pagesTypes";
import { fetchListingItemPerSlug } from "@/services/pagesApi";
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

export default function ListingDetailsPage() {
  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { slug } = useParams();
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  // Fetch listing data
  useEffect(() => {
    async function loadListing() {
      try {
        const res = await fetchListingItemPerSlug(String(slug));
        setListing(res);
      } catch (err) {
        console.log(err);
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [slug]);

  if (loading) return <Loader />;

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-secondary">{error || "Listing not found"}</p>
      </div>
    );
  }

  // Handle not found
  if (!listing.slug) {
    notFound();
  }

  console.log(listing);

  return (
    <div className="min-h-screen bg-background py-6 md:py-8 lg:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="my-6">
          <ListingDetailHero
            category={listing.category?.name}
            title={listing.title}
            username={listing.user?.username}
            contact={listing.contact}
            price={listing.price}
            hotDeal={listing.hotDeal}
            websiteLink={listing.websiteLink}
          />
        </section>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-8">
          {/* left side */}
          <div className="col-span-4 space-y-8">
            {/* overview aka description */}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                Overview
              </h2>
              <p className="text-secondary my-4">{listing.description}</p>
              {/* gallery */}
              <ListingGallery
                portfolio={listing.portfolio}
                title={listing.title}
              />
            </div>
          </div>

          {/* right side */}
          <div className="space-y-6 col-span-4 md:col-span-2">
            {/* rating component */}
            {listing.averageRating && (
              <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                <div className="flex items-start lg:items-center flex-row md:flex-col lg:flex-row justify-between md:justify-start lg:justify-between" >
                <p className="text-lg font-semibold" >Rating: </p>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={listing.averageRating} />
                  <p className="text-base lg:text-lg text-secondary">
                    {listing.averageRating}/5 ({listing.ratingsCount})
                  </p>
                </div>
                </div>
              </div>
            )}

            {/* listing item details card*/}
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
              <div className="flex items-center gap-2.5 flex-wrap">
                {listing.eventTypes.map((event) => (
                  <span
                    key={event.documentId}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {event.eventName}
                  </span>
                ))}
              </div>
              {listing.listingItem.map((item, index) => (
                <div key={index} className="my-4">
                  {listing.type === "venue" &&
                    item.__component === "dynamic-blocks.venue" && (
                      <VenueCard item={item} />
                    )}
                  {listing.type === "vendor" &&
                    item.__component === "dynamic-blocks.vendor" && (
                      <VendorCard item={item} />
                    )}
                </div>
              ))}
            </div>

            {/* Hot Deal Section */}
            {listing.hotDeal && listing.hotDeal.enableHotDeal && (
              <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  Hot Deal
                </h2>
                <div className="p-3 md:p-4 lg:p-6 bg-primary/10 rounded-lg shadow-sm">
                  <p className="text-secondary">
                    {listing.hotDeal.discount.discountType
                      .toLowerCase()
                      .includes("flat")
                      ? `Flat rate: ${listing.hotDeal.discount.flatRatePrice}`
                      : `${listing.hotDeal.discount.percentage}% off`}
                  </p>
                  <p className="text-secondary">{listing.hotDeal.dealNote}</p>
                  <p className="text-secondary">
                    Valid:{" "}
                    {new Date(listing.hotDeal.startDate).toLocaleDateString()} -{" "}
                    {new Date(listing.hotDeal.lastDate).toLocaleDateString()}
                  </p>
                </div>
              </section>
            )}

            {/* Social Links Section */}
            {listing.socialLinks &&
              listing.socialLinks.socialLink.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
                  <h2 className="text-base font-semibold text-black mb-2 capitalize">
                    {listing.socialLinks.optionalSectionTitle}
                  </h2>
                  <SocialIcon socialLink={listing.socialLinks.socialLink} />
                </section>
              )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">Reviews</h2>
          {listing.reviews && listing.reviews.length > 0 ? (
            <ListingReviews reviews={listing.reviews} />
          ) : (
            <NoDataCard>No Reviews yet</NoDataCard>
          )}
        </section>

        {/* Pricing Section */}
        {listing.pricingPackages && (
          <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {listing.pricingPackages.sectionTitle}
            </h2>
            <div className="flex justify-center items-center">
              {listing.pricingPackages.plans.map((plan, index) => (
                <PricingPlans
                  key={index}
                  plan={plan}
                  optionalAddons={listing.pricingPackages?.optionalAddons}
                />
              ))}
            </div>
          </section>
        )}

        {/* FAQs section */}
        {listing.FAQs && listing.FAQs.items.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6 my-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">FAQs</h2>
            <div className="max-w-xl mx-auto">
              {listing.FAQs.items.map((faq, i) => {
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
