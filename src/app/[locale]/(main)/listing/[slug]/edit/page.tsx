import { Metadata } from "next"
import { fetchListingBySlug } from "@/services/listing"
import EditListingForm from "@/components/forms/EditListingForm"
import type { ListingItem } from "@/types/pagesTypes"
import { notFound } from "next/navigation"

interface EditListingPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({ params }: EditListingPageProps): Promise<Metadata> {
  const { slug, locale } = await params

  try {
    const listing = await fetchListingBySlug(slug, locale)
    if (!listing) {
      return {
        title: "Listing Not Found"
      }
    }

    return {
      title: `Edit ${listing.title || "Listing"}`,
      description: listing.description?.substring(0, 160)
    }
  } catch {
    return {
      title: "Edit Listing"
    }
  }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { slug, locale } = await params
  // Fetch listing data only (user auth handled client-side)
  const listing = await fetchListingBySlug(slug, locale)

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EditListingForm listing={listing as ListingItem} />
    </div>
  )
}
