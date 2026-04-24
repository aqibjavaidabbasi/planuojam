export interface PublicInvoiceData {
  documentId: string;
  invoiceNumber?: string | null;
  amount?: number | null;
  currency?: string | null;
  invoiceStatus?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerAddress?: string | null;
  listingTitle?: string | null;
  SubscriptionTitle?: string | null;
  sellerCompanyName?: string | null;
  sellerAddress?: string | null;
  sellerCompanyId?: string | null;
  sellerVatNumber?: string | null;
  userDocumentId?: string | null;
  listingDocId?: string | null;
  hostedUrl?: string | null;
  publicToken?: string | null;
}

export interface InvoicePdfLabels {
  invoiceTitle: string;
  invoiceNumber: string;
  issueDate: string;
  billingPeriod: string;
  billedTo: string;
  seller: string;
  description: string;
  total: string;
  amountDue: string;
  buyerEmail: string;
  buyerAddress: string;
  companyId: string;
  vatNumber: string;
  subscriptionLabel: string;
  generatedNote: string;
}
