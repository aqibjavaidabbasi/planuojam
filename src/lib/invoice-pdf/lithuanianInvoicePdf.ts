import { downloadInvoicePdf } from "./downloadInvoicePdf";
import type { InvoicePdfLabels, PublicInvoiceData } from "@/types/invoice";

export function getLithuanianInvoicePdfLabels(): InvoicePdfLabels {
  return {
    invoiceTitle: "Sąskaita faktūra",
    invoiceNumber: "Sąskaitos numeris",
    issueDate: "Išrašymo data",
    billingPeriod: "Apmokestinimo laikotarpis",
    billedTo: "Pirkėjas",
    seller: "Pardavėjas",
    description: "Aprašymas",
    total: "Iš viso",
    amountDue: "Mokėtina suma",
    buyerEmail: "Pirkėjo el. paštas",
    buyerAddress: "Pirkėjo adresas",
    companyId: "Įmonės kodas",
    vatNumber: "PVM kodas",
    subscriptionLabel: "Prenumerata",
    generatedNote: "Ši sąskaita sugeneruota iš išsaugotų atsiskaitymo duomenų.",
  };
}

export async function downloadLithuanianInvoicePdf(
  element: HTMLElement | null,
  invoice: PublicInvoiceData
) {
  const invoiceNumber = invoice.invoiceNumber?.trim() || invoice.documentId;
  await downloadInvoicePdf({
    element,
    fileName: `invoice-${invoiceNumber}-lt.pdf`,
  });
}
