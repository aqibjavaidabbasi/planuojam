import type { ListingItem, Review, Venue } from "@/types/pagesTypes";
import { getCompleteImageUrl } from "@/utils/helpers";

type JsonLd = Record<string, unknown>;

/**
 * Build schema.org JSON-LD for a listing detail page.
 * Returns an array of blocks: a LocalBusiness (with rating/reviews) and, when present, a FAQPage.
 * Uses only fields already populated on the listing — no invented data.
 */
export function buildListingJsonLd(listing: ListingItem | null | undefined, url: string): JsonLd[] {
  if (!listing?.title) return [];
  const blocks: JsonLd[] = [];

  const images = (listing.portfolio || [])
    .map((img) => (img?.url ? getCompleteImageUrl(img.url) : null))
    .filter((u): u is string => Boolean(u));

  const venueBlock = (listing.listingItem || []).find(
    (b) => (b as { __component?: string }).__component === "dynamic-blocks.venue"
  ) as Venue | undefined;

  // LocalBusiness for both vendors and venues — universally eligible for Google review snippets.
  const main: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.title,
    url,
  };
  if (listing.description) main.description = listing.description;
  if (images.length) main.image = images;
  if (typeof listing.price === "number" && listing.price > 0) main.priceRange = String(listing.price);

  const loc = venueBlock?.location;
  // ponytail: city is a Strapi relation object at runtime though the shared type says string
  // (write paths send an id) — narrow here instead of churning the type across the edit forms.
  const rawCity = loc?.city as unknown as string | { name?: string } | null | undefined;
  const cityName = typeof rawCity === "string" ? rawCity : rawCity?.name;
  if (loc && (loc.address || cityName || loc.country)) {
    main.address = {
      "@type": "PostalAddress",
      ...(loc.address ? { streetAddress: loc.address } : {}),
      ...(cityName ? { addressLocality: cityName } : {}),
      ...(loc.country ? { addressCountry: loc.country } : {}),
    };
    if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      main.geo = { "@type": "GeoCoordinates", latitude: loc.latitude, longitude: loc.longitude };
    }
  }

  if (listing.ratingsCount > 0 && listing.averageRating > 0) {
    main.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: listing.averageRating,
      reviewCount: listing.ratingsCount,
    };
  }

  const approved = (listing.reviews || []).filter(
    (r: Review) => r?.review?.reviewStatus === "Approved"
  );
  if (approved.length) {
    main.review = approved.slice(0, 20).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.review.rating, bestRating: 5 },
      ...(r.author?.username ? { author: { "@type": "Person", name: r.author.username } } : {}),
      ...(r.review.reviewBody ? { reviewBody: r.review.reviewBody } : {}),
    }));
  }

  blocks.push(main);

  const faqItems = (listing.FAQs?.items || []).filter((f) => f?.question && f?.answer);
  if (faqItems.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return blocks;
}

// Escape "<" so user-generated content (e.g. a review containing "</script>") can't break out of the tag.
export function jsonLdToString(block: JsonLd): string {
  return JSON.stringify(block).replace(/</g, "\\u003c");
}
