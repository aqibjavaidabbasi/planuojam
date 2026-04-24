"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

function formatDisplayDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDisplayAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string
) {
  if (typeof amount !== "number") return "-";

  const normalizedCurrency = currency?.toUpperCase();

  if (normalizedCurrency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: normalizedCurrency,
      }).format(amount);
    } catch {
      // Fall back to a plain amount if the currency code is invalid.
    }
  }

  return amount.toFixed(2);
}

function getStatusLabel(
  status: string | null | undefined,
  t: (key: string) => string
) {
  switch (status) {
    case "paid":
      return t("status.paid");
    case "open":
      return t("status.open");
    case "failed":
      return t("status.failed");
    case "void":
      return t("status.void");
    default:
      return status || "-";
  }
}

export default function PublicInvoicePageClient({
  invoice,
}: PublicInvoicePageClientProps) {
  const t = useTranslations("InvoicePublic");
  const locale = useLocale();
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
      setError(t("errors.downloadFailed"));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t("title", { invoiceNumber: invoice.invoiceNumber || invoice.documentId })}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t("description")}
          </p>

          <div className="mt-8 grid gap-4 rounded-[28px] bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">{t("fields.amount")}</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDisplayAmount(invoice.amount, invoice.currency, locale)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">{t("fields.status")}</p>
              <p className="mt-1 font-medium capitalize text-slate-900">
                {getStatusLabel(invoice.invoiceStatus, t)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">{t("fields.billingPeriod")}</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDisplayDate(invoice.periodStart, locale)} - {formatDisplayDate(invoice.periodEnd, locale)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">{t("fields.listing")}</p>
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
              {downloading === "en" ? t("actions.generatingEnglish") : t("actions.downloadEnglish")}
            </Button>
            <Button
              style="secondary"
              extraStyles="w-full sm:w-auto px-6"
              onClick={() => handleDownload("lt")}
              disabled={downloading !== null}
            >
              {downloading === "lt"
                ? t("actions.generatingLithuanian")
                : t("actions.downloadLithuanian")}
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
