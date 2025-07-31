"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import { notFound, useParams } from "next/navigation";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ListingItem, Review, SocialLink } from "@/types/pagesTypes";
import { strapiImage } from "@/types/common";
import { fetchListingItemPerSlug } from "@/services/pagesApi";
import { getCompleteImageUrl } from "@/utils/helpers";
import Faqitem from "@/components/Dynamic/Faqitem";
import Loader from "@/components/ui/Loader";


// Map social platform to react-icons
function getSocialIcon(platform: string) {
    switch (platform.toLowerCase()) {
        case "facebook":
            return <FaFacebook className="h-6 w-6" />;
        case "instagram":
            return <FaInstagram className="h-6 w-6" />;
        case "twitter":
            return <FaTwitter className="h-6 w-6" />;
        case "linkedin":
            return <FaLinkedin className="h-6 w-6" />;
        default:
            return null;
    }
}

export default function ListingDetailsPage() {
    const [listing, setListing] = useState<ListingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { slug } = useParams();
    const [openIndexes, setOpenIndexes] = useState<number[]>([])

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

    if (loading) return <Loader />

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

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <section className="mb-12">
                    <h1 className="text-4xl font-bold text-primary mb-4">{listing.title}</h1>
                    {listing.images.length > 0 && (
                        <Swiper
                            modules={[Navigation, Pagination]}
                            navigation
                            pagination={{ clickable: true }}
                            className="w-full h-[400px] mb-6 rounded-lg shadow-sm"
                        >
                            {listing.images.map((image: strapiImage, index: number) => (
                                <SwiperSlide key={index}>
                                    <Image
                                        src={getCompleteImageUrl(image.url)}
                                        alt={listing.title}
                                        width={400}
                                        height={400}
                                        className="w-full h-full object-cover rounded-lg"
                                        priority={index === 0}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-2xl text-secondary">
                            {listing.price ? `$${listing.price.toLocaleString()}` : "Contact for pricing"}
                        </p>
                        {listing.averageRating && <p className="text-lg text-secondary">
                            Rating: {listing.averageRating}/5 ({listing.ratingsCount} reviews)
                        </p>}
                    </div>
                    {listing.contact &&
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold text-primary">Contact</h2>
                            <p className="text-secondary">{listing.contact.email}</p>
                            <p className="text-secondary">{listing.contact.phone}</p>
                            <p className="text-secondary">{listing.contact.address}</p>
                        </div>}
                </section>

                {/* Overview Section */}
                <section className="mb-12 border-t border-border pt-6">
                    <h2 className="text-2xl font-semibold text-primary mb-4">Overview</h2>
                    <p className="text-secondary mb-4">{listing.description}</p>
                    <p className="text-secondary">Category: {listing.category.name}</p>
                    {listing.listingItem.map((item, index) => (
                        <div key={index} className="mt-4">
                            {item.__component === "dynamic-blocks.venue" ? (
                                <div>
                                    <h3 className="text-lg font-semibold text-primary">Venue Details</h3>
                                    {item.amneties && (
                                        <ul className="list-disc pl-5 text-secondary">
                                            {item.amneties.map((amenity, i) => (
                                                <li key={i}>{amenity.text}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.capacity && <p className="text-secondary">Capacity: {item.capacity}</p>}
                                    {item.location && (
                                        <p className="text-secondary">
                                            Location: {item.location.address}, {item.location.city}, {item.location.country}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-semibold text-primary">Vendor Details</h3>
                                    <p className="text-secondary">{item.about}</p>
                                    <p className="text-secondary">Experience: {item.experienceYears} years</p>
                                    {item.serviceArea && (
                                        <div>
                                            <p className="text-secondary">
                                                Service Area: {
                                                    [
                                                        item.serviceArea.countries && item.serviceArea.countries.length > 0
                                                            ? item.serviceArea.countries.map((c) => c.name).join(", ")
                                                            : null,
                                                        item.serviceArea.states && item.serviceArea.states.length > 0
                                                            ? item.serviceArea.states.map((s) => s.name).join(", ")
                                                            : null,
                                                        item.serviceArea.cities && item.serviceArea.cities.length > 0
                                                            ? item.serviceArea.cities.map((c) => c.name).join(", ")
                                                            : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")
                                                    || "Not specified"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </section>

                {/* Portfolio Section */}
                {listing.portfolio && (
                    <section className="mb-12 border-t border-border pt-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">Portfolio</h2>
                        <Swiper
                            modules={[Navigation, Pagination]}
                            navigation
                            pagination={{ clickable: true }}
                            className="w-full h-[300px] rounded-lg shadow-sm"
                        >
                            <SwiperSlide>
                                <Image
                                    src={getCompleteImageUrl(listing.portfolio.url)}
                                    alt="Portfolio"
                                    width={listing.portfolio.width}
                                    height={300}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            </SwiperSlide>
                        </Swiper>
                    </section>
                )}

                {/* Pricing Section */}
                {
                    listing.pricingPackages &&
                    <section className="mb-12 border-t border-border pt-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            {listing.pricingPackages.sectionTitle}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listing.pricingPackages.plans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={`p-6 rounded-lg shadow-sm border ${plan.isPopular ? "border-primary bg-primary/10" : "border-border"
                                        }`}
                                >
                                    <h3 className="text-xl font-semibold text-primary">{plan.name}</h3>
                                    <p className="text-2xl text-secondary mb-4">${plan.price.toLocaleString()}</p>
                                    {plan.isPopular && (
                                        <span className="inline-block bg-primary text-white text-sm px-2 py-1 rounded mb-4">
                                            Popular
                                        </span>
                                    )}
                                    <ul className="list-disc pl-5 text-secondary mb-4">
                                        {plan.featuresList.map((feature, i) => (
                                            <li key={i}>{feature.statement}</li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={plan.cta.buttonUrl}
                                        target="_blank"
                                        className={`inline-block px-4 py-2 rounded ${plan.cta.style === "primary"
                                            ? "bg-primary text-white"
                                            : plan.cta.style === "secondary"
                                                ? "bg-secondary text-white"
                                                : "border border-primary text-primary"
                                            }`}
                                    >
                                        {plan.cta.bodyText}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        {listing.pricingPackages.optionalAddons &&
                            listing.pricingPackages.optionalAddons.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-primary">Optional Add-ons</h3>
                                    <ul className="list-disc pl-5 text-secondary">
                                        {listing.pricingPackages.optionalAddons.map((addon, i) => (
                                            <li key={i}>
                                                {addon.statement} - ${addon.price.toLocaleString()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </section>
                }

                {/* Hot Deal Section */}
                {listing.hotDeal && listing.hotDeal.enableHotDeal && (
                    <section className="mb-12 border-t border-border pt-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">Hot Deal</h2>
                        <div className="p-6 bg-primary/10 rounded-lg shadow-sm">
                            <p className="text-secondary">{listing.hotDeal.discount.discountType.toLowerCase().includes('flat') ? `Flat rate: ${listing.hotDeal.discount.flatRatePrice}` : `${listing.hotDeal.discount.percentage}% off`}</p>
                            <p className="text-secondary">{listing.hotDeal.dealNote}</p>
                            <p className="text-secondary">
                                Valid: {new Date(listing.hotDeal.startDate).toLocaleDateString()} -{" "}
                                {new Date(listing.hotDeal.lastDate).toLocaleDateString()}
                            </p>
                        </div>
                    </section>
                )}

                {/* Social Links Section */}
                {listing.socialLinks && listing.socialLinks.socialLink.length > 0 && (
                    <section className="mb-12 border-t border-border pt-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            {listing.socialLinks.optionalSectionTitle}
                        </h2>
                        <div className="flex gap-4">
                            {listing.socialLinks.socialLink.map((link: SocialLink, index: number) => (
                                link.visible && (
                                    <Link key={index} href={link.link} target="_blank" className="text-primary">
                                        {getSocialIcon(link.platform)}
                                    </Link>
                                )
                            ))}
                        </div>
                    </section>
                )}

                {/* FAQs section */}
                {
                    listing.FAQs && listing.FAQs.items.length > 0 &&
                    <section className="mb-12 border-t border-border pt-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">FAQs</h2>
                        {
                            listing.FAQs.items.map((faq, i) => {
                                const isOpen = openIndexes.includes(i)
                                return <Faqitem
                                    key={faq.id || i}
                                    idx={i} faq={faq}
                                    isOpen={isOpen}
                                    setOpenIndexes={setOpenIndexes}
                                />
                            })
                        }
                    </section>
                }

                {/* Reviews Section */}
                <section className="mb-12 border-t border-border pt-6">
                    <h2 className="text-2xl font-semibold text-primary mb-4">Reviews</h2>
                    {listing.reviews && listing.reviews.length > 0 ? (
                        <div className="space-y-4">
                            {listing.reviews
                                .filter((review: Review) => review.review.reviewStatus === "Approved")
                                .map((review: Review, index: number) => (
                                    <div key={index} className="p-4 border border-border rounded-lg shadow-sm">
                                        <p className="text-secondary font-semibold">{review.author.username}</p>
                                        <p className="text-secondary">Rating: {review.review.rating}/5</p>
                                        <p className="text-secondary">{review.review.reviewBody}</p>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-secondary">No reviews yet</p>
                    )}
                </section>

                {/* Website Link */}
                {listing.websiteLink && (
                    <section className="mb-12 border-t border-border pt-6">
                        <Link
                            href={listing.websiteLink}
                            target="_blank"
                            className="text-primary hover:underline"
                        >
                            Visit Website
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );
}