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

type EditTabKey = "basic" | "vv" | "deal" | "images" | "contact" | "social" | "pricing" | "faqs"

interface EditListingFormProps {
  listing: ListingItem
  onSaved?: () => void
  activeTab?: EditTabKey
}

const EditListingForm: React.FC<EditListingFormProps> = ({ listing, onSaved, activeTab }) => {

  return (
    <div>
      
        {/* Basic Details */}
        {(!activeTab || activeTab === "basic") && (
          <BasicSection listing={listing} onSaved={onSaved} />
        )}

        {/* Vendor/Venue specific */}
        {activeTab === "vv" && (
          <VendorVenueSection listing={listing} onSaved={onSaved} />
        )}

        {/* Hot Deal  */}
        {activeTab === "deal" && (
          <HotDealSection listing={listing} onSaved={onSaved} />
        )}
        {/* images */}
        {activeTab === "images" && (
          <ImagesSection listing={listing} onSaved={onSaved} />
        )}
        {/* Contact */}
        {activeTab === "contact" && (
          <ContactSection listing={listing} onSaved={onSaved} />
        )}

        {/* Social Links */}
        {activeTab === "social" && (
          <SocialLinksSection listing={listing} onSaved={onSaved} />
        )}

        {/* Pricing */}
        {activeTab === "pricing" && (
          <PricingSection listing={listing} onSaved={onSaved} />
        )}

        {/* FAQs */}
        {activeTab === "faqs" && (
          <FAQsSection listing={listing} onSaved={onSaved} />
        )}
    </div>
  )
}

export default EditListingForm
