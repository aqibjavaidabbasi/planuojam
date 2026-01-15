"use client"

import type React from "react"
import { useState } from "react"
import { ListingItem } from "@/types/pagesTypes"
import { useLocale, useTranslations } from "next-intl";
import Button from "../custom/Button";
import { IoMdArrowRoundBack } from "react-icons/io";
import { getListingPath } from "@/utils/routes";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { fetchListingBySlug } from "@/services/listing";
import ArchiveDeleteSection from "./edit-sections/ArchiveDeleteSection";

const SocialLinksSection = dynamic(() => import("./edit-sections/SocialLinksSection"));
const PricingSection = dynamic(() => import("./edit-sections/PricingSection"));
const ContactSection = dynamic(() => import("./edit-sections/ContactSection"));
const FAQsSection = dynamic(() => import("./edit-sections/FAQsSection"));
const ImagesSection = dynamic(() => import("./edit-sections/ImagesSection"));
const HotDealSection = dynamic(() => import("./edit-sections/HotDealSection"));
const BasicSection = dynamic(() => import("./edit-sections/BasicSection"));
const VendorVenueSection = dynamic(() => import("./edit-sections/VendorVenueSection"));

type EditTabKey = "basic" | "vv" | "deal" | "images" | "contact" | "social" | "pricing" | "faqs" | "archive"

interface EditListingFormProps {
  listing: ListingItem
}

function getStatusBadgeClass(s?: string) {
  switch ((s || '').toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 ring-1 ring-gray-300'
    case 'pending review':
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
    case 'published':
      return 'bg-green-100 text-green-800 ring-1 ring-green-300'
    case 'archived':
      return 'bg-slate-200 text-slate-700 ring-1 ring-slate-300'
    default:
      return 'bg-gray-100 text-gray-800 ring-1 ring-gray-300'
  }
}

const EditListingForm: React.FC<EditListingFormProps> = ({ listing }) => {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<EditTabKey>("basic")
  const [currentListing, setCurrentListing] = useState<ListingItem>(listing)
  const t = useTranslations("Listing.Edit");
  const router = useRouter()
  const listingId = listing.slug

  const tabs = [
    { key: "basic", label: t("tabs.basic") },
    { key: "vv", label: t("tabs.vv") },
    { key: "deal", label: t("tabs.deal") },
    { key: "images", label: t("tabs.images") },
    { key: "contact", label: t("tabs.contact") },
    { key: "social", label: t("tabs.social") },
    { key: "pricing", label: t("tabs.pricing") },
    { key: "faqs", label: t("tabs.faqs") },
    { key: "archive", label: t("tabs.archive") },
  ] as const

   const handleSaved = async () => {
    // After a successful save from any section, refetch latest listing to update child forms' props
    if (!listingId) return
    try {
      const data = await fetchListingBySlug(String(listingId), locale)
      if (data) setCurrentListing(data as ListingItem)
    } catch (e) {
      // noop: Sections already toast on success/failure; avoid interrupting UX here
      console.error('Failed to refetch listing after save:', e)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
      <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4 w-full border-b-2 border-primary/80 py-2">
          <div className="flex items-center flex-col gap-2">
            <Button
              onClick={() => router.push(`/profile?tab=my-listings`)}
              style="ghost"
              size="small"
            >
              <IoMdArrowRoundBack /> {t("back")}
            </Button>
            {/* show this button only if listing is published to avoid 404 errors */}
            <Link
              href={getListingPath(currentListing?.slug || '', locale)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                style="secondary"
                size="small"
              >
                {t("preview")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-gray-500">{t("editing")}</p>
            <p className="font-semibold">{currentListing?.title || t("listingFallback")}</p>
          </div>
        </div>
        <div className="mt-6 space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <span>{t("status")}:</span>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs capitalize font-medium ${getStatusBadgeClass(currentListing?.listingStatus)}`}
            >
              {currentListing?.listingStatus}
            </span>
          </p>
        </div>
        <div className="mt-6">
          <div className="flex flex-col gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`text-left px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${activeTab === t.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        {/* Tab Content */}
        {(!activeTab || activeTab === "basic") && (
          <BasicSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* Vendor/Venue specific */}
        {activeTab === "vv" && (
          <VendorVenueSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* Hot Deal  */}
        {activeTab === "deal" && (
          <HotDealSection listing={currentListing} onSaved={handleSaved} />
        )}
        {/* images */}
        {activeTab === "images" && (
          <ImagesSection listing={currentListing} onSaved={handleSaved} />
        )}
        {/* Contact */}
        {activeTab === "contact" && (
          <ContactSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* Social Links */}
        {activeTab === "social" && (
          <SocialLinksSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* Pricing */}
        {activeTab === "pricing" && (
          <PricingSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* FAQs */}
        {activeTab === "faqs" && (
          <FAQsSection listing={currentListing} onSaved={handleSaved} />
        )}

        {/* Archive/Delete */}
        {activeTab === "archive" && (
          <ArchiveDeleteSection listing={currentListing} onSaved={handleSaved} />
        )}

      </div>
    </div >
  )
}

export default EditListingForm
