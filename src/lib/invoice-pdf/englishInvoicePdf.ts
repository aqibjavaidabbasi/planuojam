import { downloadInvoicePdf } from "./downloadInvoicePdf";
import type { InvoicePdfLabels, PublicInvoiceData } from "@/types/invoice";

export function getEnglishInvoicePdfLabels(): InvoicePdfLabels {
  return {
    invoiceTitle: "Invoice",
    invoiceNumber: "Invoice Number",
    issueDate: "Issue Date",
    billingPeriod: "Billing Period",
    billedTo: "Billed To",
    seller: "Seller",
    description: "Description",
    total: "Total",
    amountPaid: "Amount Paid",
    buyerEmail: "Buyer Email",
    buyerAddress: "Buyer Address",
    companyId: "Company ID",
    vatNumber: "VAT Number",
    subscriptionLabel: "Subscription",
    generatedNote: "This invoice was generated from your saved billing details.",
  };
}

export async function downloadEnglishInvoicePdf(
  element: HTMLElement | null,
  invoice: PublicInvoiceData
) {
  const invoiceNumber = invoice.invoiceNumber?.trim() || invoice.documentId;
  await downloadInvoicePdf({
    element,
    fileName: `invoice-${invoiceNumber}-en.pdf`,
  });
}
