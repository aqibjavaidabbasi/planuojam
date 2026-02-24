import { Metadata } from "next"
import { fetchListingBySlugNoCacheFromApi } from "@/services/listing"
import EditListingForm from "@/components/forms/EditListingForm"
import type { ListingItem } from "@/types/pagesTypes"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

interface EditListingPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({ params }: EditListingPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'Listing' })

  try {
    const listing = await fetchListingBySlugNoCacheFromApi(slug, locale)
    if (!listing) {
      return {
        title: t('notFound', { default: "Listing Not Found" }),
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    return {
      title: t('editTitle', { title: listing.title || "Listing" }),
      description: listing.description?.substring(0, 160) || t('editDescription', { default: "Edit your listing details" }),
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch {
    return {
      title: t('editTitle', { title: "Listing" }),
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { slug, locale } = await params
  // Fetch listing data only (user auth handled client-side)
  const listing = await fetchListingBySlugNoCacheFromApi(slug, locale)

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EditListingForm listing={listing as ListingItem} />
    </div>
  )
}
