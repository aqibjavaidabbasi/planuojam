"use client"

import type React from "react"
import dynamic from "next/dynamic";

const SocialLinksSection = dynamic(() => import("./edit-sections/SocialLinksSection"));
const PricingSection = dynamic(() => import("./edit-sections/PricingSection"));
const ContactSection = dynamic(() => import("./edit-sections/ContactSection"));
const FAQsSection = dynamic(() => import("./edit-sections/FAQsSection"));
const ImagesSection = dynamic(() => import("./edit-sections/ImagesSection"));
const HotDealSection = dynamic(() => import("./edit-sections/HotDealSection"));
const BasicSection = dynamic(() => import("./edit-sections/BasicSection"));
const VendorVenueSection = dynamic(() => import("./edit-sections/VendorVenueSection"));
import { ListingItem } from "@/types/pagesTypes"
import { useLocale } from "next-intl";

type EditTabKey = "basic" | "vv" | "deal" | "images" | "contact" | "social" | "pricing" | "faqs"

interface EditListingFormProps {
  listing: ListingItem
  onSaved?: () => void
  activeTab?: EditTabKey
}

const EditListingForm: React.FC<EditListingFormProps> = ({ listing, onSaved, activeTab }) => {
  const locale = useLocale()

  let renderingListing: ListingItem;
  if (locale === 'en') {
    renderingListing = listing
  } else {
    renderingListing = listing.localizations.find(l => l.locale === locale) || listing
  }

  return (
    <div>
      
        {/* Basic Details */}
        {(!activeTab || activeTab === "basic") && (
          <BasicSection listing={renderingListing} onSaved={onSaved} />
        )}

        {/* Vendor/Venue specific */}
        {activeTab === "vv" && (
          <VendorVenueSection listing={renderingListing} onSaved={onSaved} />
        )}

        {/* Hot Deal  */}
        {activeTab === "deal" && (
          <HotDealSection listing={renderingListing} onSaved={onSaved} />
        )}
        {/* images */}
        {activeTab === "images" && (
          <ImagesSection listing={renderingListing} onSaved={onSaved} />
        )}
        {/* Contact */}
        {activeTab === "contact" && (
          <ContactSection listing={renderingListing} onSaved={onSaved} />
        )}

        {/* Social Links */}
        {activeTab === "social" && (
          <SocialLinksSection listing={renderingListing} onSaved={onSaved} />
        )}

        {/* Pricing */}
        {activeTab === "pricing" && (
          <PricingSection listing={renderingListing} onSaved={onSaved} />
        )}

        {/* FAQs */}
        {activeTab === "faqs" && (
          <FAQsSection listing={renderingListing} onSaved={onSaved} />
        )}
    </div>
  )
}

export default EditListingForm
