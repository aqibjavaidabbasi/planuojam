import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicInvoicePageClient from "./PublicInvoicePageClient";
import { fetchPublicInvoiceByToken } from "@/lib/invoicePublic";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Invoice Download",
    description: "Download your invoice PDF.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await fetchPublicInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  return <PublicInvoicePageClient invoice={invoice} />;
}
