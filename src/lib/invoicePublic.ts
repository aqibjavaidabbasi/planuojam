import QueryString from "qs";
import type { PublicInvoiceData } from "@/types/invoice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export async function fetchPublicInvoiceByToken(
  publicToken: string
): Promise<PublicInvoiceData | null> {
  const query = QueryString.stringify(
    {
      filters: {
        publicToken: {
          $eq: publicToken,
        },
      },
      fields: [
        "documentId",
        "invoiceNumber",
        "amount",
        "currency",
        "invoiceStatus",
        "periodStart",
        "periodEnd",
        "buyerName",
        "buyerEmail",
        "buyerAddress",
        "listingTitle",
        "SubscriptionTitle",
        "sellerCompanyName",
        "sellerAddress",
        "sellerCompanyId",
        "sellerVatNumber",
        "userDocumentId",
        "listingDocId",
        "hostedUrl",
        "publicToken",
      ],
      pagination: {
        page: 1,
        pageSize: 1,
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${API_URL}/api/invoices?${query}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  return payload?.data?.[0] ?? null;
}
