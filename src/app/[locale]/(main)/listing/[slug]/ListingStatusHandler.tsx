"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ListingItem } from "@/types/pagesTypes";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";

interface ListingStatusHandlerProps {
  listing: ListingItem | null;
  locale: string;
  children: React.ReactNode;
}

export default function ListingStatusHandler({ listing, locale, children }: ListingStatusHandlerProps) {
  const t = useTranslations("Listing.Details.status");
  const user = useAppSelector((s: RootState) => s.auth.user);
  
  const isOwner = user?.documentId === listing?.user?.documentId;

  if (!listing) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 pt-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              {t("notFound")}
            </h1>
            <p className="text-gray-600 mb-8">
              {t("notFoundDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/${locale}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {t("goHome")}
              </Link>
              <Link 
                href={`/${locale}/search`}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {t("browseListings")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if listing is not published
  if (listing.listingStatus !== 'published') {
    // Allow owners to view their draft listings
    if (listing.listingStatus === 'draft' && isOwner) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 pt-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              {listing.listingStatus === 'draft' ? t("draft") : 
               listing.listingStatus === 'archived' ? t("archived") : 
               t("unavailable")}
            </h1>
            <p className="text-gray-600 mb-8">
              {listing.listingStatus === 'draft' ? t("draftDescription") :
               listing.listingStatus === 'archived' ? t("archivedDescription") :
               t("unavailableDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/${locale}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {t("goHome")}
              </Link>
              <Link 
                href={`/${locale}/search`}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {t("browseListings")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If listing is published, render the children
  return <>{children}</>;
}
