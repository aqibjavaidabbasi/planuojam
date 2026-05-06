import type { InvoicePdfLabels, PublicInvoiceData } from "@/types/invoice";

interface InvoicePdfTemplateProps {
  invoice: PublicInvoiceData;
  labels: InvoicePdfLabels;
  logoUrl?: string;
  locale?: string;
}

function formatDisplayDate(value?: string | null, locale = "en-GB") {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDisplayAmount(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return "-";
  return `${amount.toFixed(2)} ${(currency || "").toUpperCase()}`.trim();
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!hasText(value)) return null;

  return (
    <p className="mb-1 text-sm" style={{ color: "#475569" }}>
      {label}: {value}
    </p>
  );
}

export default function InvoicePdfTemplate({
  invoice,
  labels,
  logoUrl,
  locale = "en-GB",
}: InvoicePdfTemplateProps) {
  const isPromotionInvoice = invoice.invoiceType === "promotion";
  const description = isPromotionInvoice
    ? interpolate(labels.promotionDescription, {
        stars: invoice.promotionStars ?? "-",
        days: invoice.promotionDays ?? "-",
      })
    : invoice.SubscriptionTitle || invoice.listingTitle || labels.subscriptionLabel;
  const amountSummaryLabel = labels.amountPaid || labels.amountDue || "-";
  const buyerIsCompany =
    invoice.buyerCustomerType === "company" ||
    hasText(invoice.buyerCompanyName) ||
    hasText(invoice.buyerCompanyId);
  const individualName = invoice.buyerIndividualName || invoice.buyerName;
  const individualSurname = invoice.buyerIndividualSurname;
  const individualAddress = invoice.buyerRegistrationAddress || invoice.buyerAddress;
  const buyerDisplayName = buyerIsCompany
    ? invoice.buyerCompanyName
    : [individualName, individualSurname].filter(Boolean).join(" ");
  const buyerAddress = buyerIsCompany
    ? invoice.buyerCompanyAddress || invoice.buyerAddress
    : individualAddress;

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
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="mb-6 h-auto max-h-[72px] w-auto max-w-[190px] object-contain"
              crossOrigin="anonymous"
            />
          ) : null}
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: "#64748b" }}
          >
            {labels.seller}
          </p>
          {hasText(invoice.sellerCompanyName) && (
            <h1 className="mb-2 text-2xl font-semibold">{invoice.sellerCompanyName}</h1>
          )}
          {hasText(invoice.sellerAddress) && (
            <p
              className="m-0 whitespace-pre-line text-sm leading-6"
              style={{ color: "#475569" }}
            >
              {invoice.sellerAddress}
            </p>
          )}
          <div className="mt-3">
            <DetailRow label={labels.companyId} value={invoice.sellerCompanyId} />
            <DetailRow label={labels.vatNumber} value={invoice.sellerVatNumber} />
          </div>
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
              <span className="font-medium">{formatDisplayDate(invoice.periodStart, locale)}</span>
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
          {hasText(buyerDisplayName) && (
            <p className="mb-1 text-lg font-semibold">{buyerDisplayName}</p>
          )}
          {buyerIsCompany ? (
            <>
              <DetailRow label={labels.companyId} value={invoice.buyerCompanyId} />
              <DetailRow label={labels.vatNumber} value={invoice.buyerCompanyVAT} />
              <DetailRow label={labels.companyAddress} value={buyerAddress} />
              <DetailRow label={labels.contactPerson} value={invoice.buyerContactPerson || invoice.buyerName} />
            </>
          ) : (
            <>
              <DetailRow label={labels.individualName} value={individualName} />
              <DetailRow label={labels.individualSurname} value={individualSurname} />
              <DetailRow label={labels.registrationAddress} value={buyerAddress} />
            </>
          )}
          <DetailRow label={labels.buyerEmail} value={invoice.buyerEmail} />
        </div>

        <div className="rounded-3xl border px-6 py-5" style={{ borderColor: "#e2e8f0" }}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: "#64748b" }}
          >
            {labels.billingPeriod}
          </p>
          <p className="mb-1 text-sm" style={{ color: "#334155" }}>
            {formatDisplayDate(invoice.periodStart, locale)} - {formatDisplayDate(invoice.periodEnd, locale)}
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
            {hasText(invoice.listingTitle) && (
              <p className="m-0" style={{ color: "#64748b" }}>
                {isPromotionInvoice ? labels.promotionLabel : invoice.listingTitle}
                {isPromotionInvoice && invoice.listingTitle ? ` - ${invoice.listingTitle}` : ""}
              </p>
            )}
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
