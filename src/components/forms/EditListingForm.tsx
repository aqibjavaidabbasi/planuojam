"use client"

import type React from "react"
import SocialLinksSection from "./edit-sections/SocialLinksSection"
import PricingSection from "./edit-sections/PricingSection"
import ContactSection from "./edit-sections/ContactSection"
import FAQsSection from "./edit-sections/FAQsSection"
import ImagesSection from "./edit-sections/ImagesSection"
import HotDealSection from "./edit-sections/HotDealSection"
import BasicSection from "./edit-sections/BasicSection"
import VendorVenueSection from "./edit-sections/VendorVenueSection"
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
