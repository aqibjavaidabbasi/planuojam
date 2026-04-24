import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PublicInvoicePageClient from "./PublicInvoicePageClient";
import { fetchPublicInvoiceByToken } from "@/lib/invoicePublic";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "InvoicePublic.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = await params;
  const invoice = await fetchPublicInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  return <PublicInvoicePageClient invoice={invoice} />;
}
