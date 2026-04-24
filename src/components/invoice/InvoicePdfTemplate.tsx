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
  const amountSummaryLabel = labels.amountPaid || labels.amountDue || "-";

  return (
    <div
      className="w-[794px] px-14 py-12"
      style={{
        fontFamily: "Montserrat, Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#0f172a",
      }}
    >
      <div className="mb-10 flex items-start justify-between gap-10">
        <div className="max-w-[380px]">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: "#64748b" }}
          >
            {labels.seller}
          </p>
          <h1 className="mb-2 text-2xl font-semibold">{invoice.sellerCompanyName || "-"}</h1>
          <p
            className="m-0 whitespace-pre-line text-sm leading-6"
            style={{ color: "#475569" }}
          >
            {invoice.sellerAddress || "-"}
          </p>
          <p className="mt-3 text-sm" style={{ color: "#475569" }}>
            {labels.companyId}: {invoice.sellerCompanyId || "-"}
          </p>
          <p className="mt-1 text-sm" style={{ color: "#475569" }}>
            {labels.vatNumber}: {invoice.sellerVatNumber || "-"}
          </p>
        </div>

        <div
          className="min-w-[240px] rounded-3xl border px-6 py-5"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
        >
          <p className="mb-4 text-3xl font-semibold">{labels.invoiceTitle}</p>
          <div className="space-y-3 text-sm" style={{ color: "#334155" }}>
            <div className="flex justify-between gap-4">
              <span style={{ color: "#64748b" }}>{labels.invoiceNumber}</span>
              <span className="font-medium">{invoice.invoiceNumber || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "#64748b" }}>{labels.issueDate}</span>
              <span className="font-medium">{formatDisplayDate(invoice.periodStart)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "#64748b" }}>{amountSummaryLabel}</span>
              <span className="font-medium">
                {formatDisplayAmount(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-8">
        <div className="rounded-3xl border px-6 py-5" style={{ borderColor: "#e2e8f0" }}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: "#64748b" }}
          >
            {labels.billedTo}
          </p>
          <p className="mb-1 text-lg font-semibold">{invoice.buyerName || "-"}</p>
          <p className="mb-1 text-sm" style={{ color: "#475569" }}>
            {labels.buyerEmail}: {invoice.buyerEmail || "-"}
          </p>
          <p className="m-0 text-sm leading-6" style={{ color: "#475569" }}>
            {labels.buyerAddress}: {invoice.buyerAddress || "-"}
          </p>
        </div>

        <div className="rounded-3xl border px-6 py-5" style={{ borderColor: "#e2e8f0" }}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: "#64748b" }}
          >
            {labels.billingPeriod}
          </p>
          <p className="mb-1 text-sm" style={{ color: "#334155" }}>
            {formatDisplayDate(invoice.periodStart)} - {formatDisplayDate(invoice.periodEnd)}
          </p>
          <p className="m-0 text-sm" style={{ color: "#475569" }}>
            {labels.description}: {description}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "#e2e8f0" }}>
        <div
          className="grid grid-cols-[1fr_180px] px-6 py-4 text-sm font-semibold"
          style={{ backgroundColor: "#f1f5f9", color: "#334155" }}
        >
          <span>{labels.description}</span>
          <span className="text-right">{labels.total}</span>
        </div>
        <div className="grid grid-cols-[1fr_180px] px-6 py-5 text-sm" style={{ color: "#334155" }}>
          <div>
            <p className="mb-1 font-medium" style={{ color: "#0f172a" }}>{description}</p>
            <p className="m-0" style={{ color: "#64748b" }}>{invoice.listingTitle || "-"}</p>
          </div>
          <p className="m-0 text-right font-medium" style={{ color: "#0f172a" }}>
            {formatDisplayAmount(invoice.amount, invoice.currency)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <div
          className="w-[280px] rounded-3xl px-6 py-5"
          style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm" style={{ color: "#cbd5e1" }}>{amountSummaryLabel}</span>
            <span className="text-lg font-semibold">
              {formatDisplayAmount(invoice.amount, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-sm leading-6" style={{ color: "#64748b" }}>{labels.generatedNote}</p>
    </div>
  );
}
