import MapPageClient from "./MapPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Map' });
  
  return {
    title: 'Planuojam',
    description: t('description', { default: 'Explore venues and services on our interactive map' }),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MapPage() {
  return <MapPageClient />;
}