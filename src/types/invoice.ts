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
  buyerCompanyName?: string | null;
  buyerCompanyId?: string | null;
  buyerCompanyVAT?: string | null;
  buyerCompanyAddress?: string | null;
  buyerContactPerson?: string | null;
  buyerCustomerType?: "individual" | "company" | null;
  buyerIndividualName?: string | null;
  buyerIndividualSurname?: string | null;
  buyerRegistrationAddress?: string | null;
  listingTitle?: string | null;
  SubscriptionTitle?: string | null;
  subscriptionInterval?: "month" | "year" | "one_time" | null;
  sellerCompanyName?: string | null;
  sellerAddress?: string | null;
  sellerCompanyId?: string | null;
  sellerVatNumber?: string | null;
  userDocumentId?: string | null;
  listingDocId?: string | null;
  invoiceType?: "subscription" | "promotion" | null;
  promotionStars?: number | null;
  promotionDays?: number | null;
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
  amountPaid?: string;
  amountDue?: string;
  buyerEmail: string;
  buyerAddress: string;
  individualName: string;
  individualSurname: string;
  registrationAddress: string;
  companyName: string;
  companyAddress: string;
  contactPerson: string;
  companyId: string;
  vatNumber: string;
  subscriptionLabel: string;
  promotionLabel: string;
  subscriptionIntervalLabels: {
    month: string;
    year: string;
    one_time: string;
  };
  promotionDescription: string;
  generatedNote: string;
}
