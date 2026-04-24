"use client";

import { useRef, useState } from "react";
import Button from "@/components/custom/Button";
import InvoicePdfTemplate from "@/components/invoice/InvoicePdfTemplate";
import { downloadEnglishInvoicePdf, getEnglishInvoicePdfLabels } from "@/lib/invoice-pdf/englishInvoicePdf";
import {
  downloadLithuanianInvoicePdf,
  getLithuanianInvoicePdfLabels,
} from "@/lib/invoice-pdf/lithuanianInvoicePdf";
import type { PublicInvoiceData } from "@/types/invoice";

interface PublicInvoicePageClientProps {
  invoice: PublicInvoiceData;
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDisplayAmount(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return "-";
  return `${amount.toFixed(2)} ${(currency || "").toUpperCase()}`.trim();
}

export default function PublicInvoicePageClient({
  invoice,
}: PublicInvoicePageClientProps) {
  const englishTemplateRef = useRef<HTMLDivElement>(null);
  const lithuanianTemplateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"en" | "lt" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (language: "en" | "lt") => {
    try {
      setDownloading(language);
      setError(null);

      if (language === "en") {
        await downloadEnglishInvoicePdf(englishTemplateRef.current, invoice);
      } else {
        await downloadLithuanianInvoicePdf(lithuanianTemplateRef.current, invoice);
      }
    } catch (downloadError) {
      console.error("Failed to generate invoice PDF:", downloadError);
      setError("Unable to generate the PDF right now. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Public Invoice Access
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Invoice {invoice.invoiceNumber || invoice.documentId}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This page keeps the invoice link public but hard to guess. Choose the language you need
            and download the PDF directly.
          </p>

          <div className="mt-8 grid gap-4 rounded-[28px] bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDisplayAmount(invoice.amount, invoice.currency)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <p className="mt-1 font-medium capitalize text-slate-900">
                {invoice.invoiceStatus || "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Billing Period</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDisplayDate(invoice.periodStart)} - {formatDisplayDate(invoice.periodEnd)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Listing</p>
              <p className="mt-1 font-medium text-slate-900">
                {invoice.listingTitle || invoice.SubscriptionTitle || "-"}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              style="primary"
              extraStyles="w-full sm:w-auto px-6"
              onClick={() => handleDownload("en")}
              disabled={downloading !== null}
            >
              {downloading === "en" ? "Generating English PDF..." : "Download PDF (English)"}
            </Button>
            <Button
              style="secondary"
              extraStyles="w-full sm:w-auto px-6"
              onClick={() => handleDownload("lt")}
              disabled={downloading !== null}
            >
              {downloading === "lt"
                ? "Generating Lithuanian PDF..."
                : "Download PDF (Lithuanian)"}
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -left-2500 top-0 opacity-0">
        <div ref={englishTemplateRef}>
          <InvoicePdfTemplate
            invoice={invoice}
            labels={getEnglishInvoicePdfLabels()}
          />
        </div>
        <div ref={lithuanianTemplateRef}>
          <InvoicePdfTemplate
            invoice={invoice}
            labels={getLithuanianInvoicePdfLabels()}
          />
        </div>
      </div>
    </>
  );
}
