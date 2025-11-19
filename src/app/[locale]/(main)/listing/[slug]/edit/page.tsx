"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/store/hooks"
import type { ListingItem } from "@/types/pagesTypes"
import EditListingForm from "@/components/forms/EditListingForm"
import Button from "@/components/custom/Button"
import { IoMdArrowRoundBack } from "react-icons/io"
import { useTranslations } from "next-intl"
import { fetchListingBySlug } from "@/services/listing"
import { RootState } from "@/store"

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const listingId = params?.slug
  const { user } = useAppSelector((state: RootState) => state.auth)
  const t = useTranslations("Listing.Edit")
  const tCommon = useTranslations("Common")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listing, setListing] = useState<ListingItem | null>(null)

  useEffect(() => {
    let active = true
    async function run() {
      if (!listingId) return
      setLoading(true)
      setError(null)
      try {
        const data = await fetchListingBySlug(String(listingId), 'en')
        if (!active) return
        if (!data) {
          setError("Listing not found")
          return
        }
        setListing(data as ListingItem)
      } catch (e: unknown) {
        if (!active) return
        setError((e as Error)?.message || "Failed to load listing")
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [listingId])

  // ownership check
  const ownsListing = useMemo(() => {
    if (!listing || !user) return false
    return listing.user?.documentId === user.documentId
  }, [listing, user])

  useEffect(() => {
    if (!loading && listing) {
      if (!user?.serviceType || !ownsListing) {
        // Not authorized -> send to public view
        router.replace(`/listing/${listing.slug}`)
      }
    }
  }, [loading, listing, ownsListing, router, user?.serviceType])

  const handleSaved = async () => {
    // After a successful save from any section, refetch latest listing to update child forms' props
    if (!listingId) return
    try {
      const data = await fetchListingBySlug(String(listingId), 'en')
      if (data) setListing(data as ListingItem)
    } catch (e) {
      // noop: Sections already toast on success/failure; avoid interrupting UX here
      console.error('Failed to refetch listing after save:', e)
    }
  }

  const tabs = [
    { key: "basic", label: t("tabs.basic") },
    { key: "vv", label: t("tabs.vv") },
    { key: "deal", label: t("tabs.deal") },
    { key: "images", label: t("tabs.images") },
    { key: "contact", label: t("tabs.contact") },
    { key: "social", label: t("tabs.social") },
    { key: "pricing", label: t("tabs.pricing") },
    { key: "faqs", label: t("tabs.faqs") },
  ] as const
  type TabKey = typeof tabs[number]["key"]
  const [activeTab, setActiveTab] = useState<TabKey>("basic")

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

  return (
    <div className="container mx-auto px-4 py-8">
      {loading && <p className="min-h-[calc(100vh-200px)]">{tCommon("loading")}</p>}
      {!loading && error && <p className="text-red-600">{error}</p>}
      {!loading && !error && listing && user?.serviceType && ownsListing && (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
          <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4 w-full border-b-2 border-primary/80 py-2">
              <div className="flex items-center flex-col gap-2">
                <Button
                  onClick={() => router.push(`/profile?tab=listings`)}
                  style="ghost"
                  size="small"
                >
                  <IoMdArrowRoundBack /> {t("back")}
                </Button>
                <Button
                  onClick={() => router.push(`/listing/${listing?.slug}`)}
                  style="secondary"
                  size="small"
                >
                  {t("preview")}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-gray-500">{t("editing")}</p>
                <p className="font-semibold">{listing?.title || t("listingFallback")}</p>
              </div>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span>{t("status")}:</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs capitalize font-medium ${getStatusBadgeClass(listing?.listingStatus)}`}
                >
                  {listing?.listingStatus}
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
            <EditListingForm listing={listing} onSaved={handleSaved} activeTab={activeTab} />
          </div>
        </div>
      )}
    </div>
  )
}
