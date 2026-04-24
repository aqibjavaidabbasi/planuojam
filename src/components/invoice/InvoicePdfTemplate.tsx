import type { InvoicePdfLabels, PublicInvoiceData } from "@/types/invoice";

interface InvoicePdfTemplateProps {
  invoice: PublicInvoiceData;
  labels: InvoicePdfLabels;
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

export default function InvoicePdfTemplate({
  invoice,
  labels,
}: InvoicePdfTemplateProps) {
  const description = invoice.SubscriptionTitle || invoice.listingTitle || labels.subscriptionLabel;

  return (
    <div
      className="w-[794px] bg-white px-14 py-12 text-slate-900"
      style={{ fontFamily: "Montserrat, Arial, sans-serif" }}
    >
      <div className="mb-10 flex items-start justify-between gap-10">
        <div className="max-w-[380px]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {labels.seller}
          </p>
          <h1 className="mb-2 text-2xl font-semibold">{invoice.sellerCompanyName || "-"}</h1>
          <p className="m-0 whitespace-pre-line text-sm leading-6 text-slate-600">
            {invoice.sellerAddress || "-"}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {labels.companyId}: {invoice.sellerCompanyId || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {labels.vatNumber}: {invoice.sellerVatNumber || "-"}
          </p>
        </div>

        <div className="min-w-[240px] rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
          <p className="mb-4 text-3xl font-semibold">{labels.invoiceTitle}</p>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">{labels.invoiceNumber}</span>
              <span className="font-medium">{invoice.invoiceNumber || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">{labels.issueDate}</span>
              <span className="font-medium">{formatDisplayDate(invoice.periodStart)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">{labels.amountDue}</span>
              <span className="font-medium">
                {formatDisplayAmount(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-8">
        <div className="rounded-3xl border border-slate-200 px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {labels.billedTo}
          </p>
          <p className="mb-1 text-lg font-semibold">{invoice.buyerName || "-"}</p>
          <p className="mb-1 text-sm text-slate-600">
            {labels.buyerEmail}: {invoice.buyerEmail || "-"}
          </p>
          <p className="m-0 text-sm leading-6 text-slate-600">
            {labels.buyerAddress}: {invoice.buyerAddress || "-"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {labels.billingPeriod}
          </p>
          <p className="mb-1 text-sm text-slate-700">
            {formatDisplayDate(invoice.periodStart)} - {formatDisplayDate(invoice.periodEnd)}
          </p>
          <p className="m-0 text-sm text-slate-600">
            {labels.description}: {description}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="grid grid-cols-[1fr_180px] bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-700">
          <span>{labels.description}</span>
          <span className="text-right">{labels.total}</span>
        </div>
        <div className="grid grid-cols-[1fr_180px] px-6 py-5 text-sm text-slate-700">
          <div>
            <p className="mb-1 font-medium text-slate-900">{description}</p>
            <p className="m-0 text-slate-500">{invoice.listingTitle || "-"}</p>
          </div>
          <p className="m-0 text-right font-medium text-slate-900">
            {formatDisplayAmount(invoice.amount, invoice.currency)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-[280px] rounded-3xl bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">{labels.amountDue}</span>
            <span className="text-lg font-semibold">
              {formatDisplayAmount(invoice.amount, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-sm leading-6 text-slate-500">{labels.generatedNote}</p>
    </div>
  );
}
