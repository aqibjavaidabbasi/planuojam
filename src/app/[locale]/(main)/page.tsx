import HomePage from "./HomePage";
import type { Metadata } from "next";
import { getSeoMetadata } from "@/lib/getSeoMetadata";
import { fetchFallbackSeo, resolveSeoForPageById } from "@/services/seoApi";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";


export default async function Root({ params }: { params: Promise<{ locale: string }> }) {
  const paramsData = await params;
  if (!hasLocale(routing.locales, paramsData.locale)) {
    notFound();
  }
  return <HomePage params={paramsData} />
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Home page document ID is fixed in HomePage.tsx
  const documentId = 'k97xf2g2fdn14vlubd26wupu';
  const pageUrl = `/${locale}`;
  const urlPath = pageUrl;

  const [primarySeo, fallbackSeo] = await Promise.all([
    resolveSeoForPageById({ documentId, locale }),
    fetchFallbackSeo(),
  ]);

  return getSeoMetadata(primarySeo, fallbackSeo, urlPath);
}
