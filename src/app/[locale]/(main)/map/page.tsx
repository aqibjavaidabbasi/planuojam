import MapPageClient from "./MapPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Map' });
  const title = process.env.NEXT_PUBLIC_SITE_NAME || 'Planuojam';
  const description = t('description', { default: 'Explore venues and services on our interactive map' });
  const url = `${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/${locale}/map`;

  return {
    title,
    description,
    // This page doesn't go through getSeoMetadata (it has no Strapi SEO entry), so
    // canonical/OG are set here — without them the page was indexable but self-referenceless.
    alternates: { canonical: url },
    openGraph: { title, description, url },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Map' });

  return (
    <>
      <h1 className="lg:max-w-425 mx-auto px-4 pt-6 text-2xl md:text-3xl font-semibold text-primary">
        {t('title')}
      </h1>
      <MapPageClient />
    </>
  );
}