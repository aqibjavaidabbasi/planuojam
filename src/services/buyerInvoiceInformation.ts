import QueryString from "qs";
import { API_URL } from "./api";
import type { User } from "@/types/userTypes";

export interface BuyerInvoiceInformation {
  id?: number;
  documentId?: string;
  companyName?: string | null;
  companyId?: string | null;
  companyVAT?: string | null;
  companyAddress?: string | null;
  contactPerson?: string | null;
  individualName?: string | null;
  individualSurname?: string | null;
  registrationAddress?: string | null;
}

export type InvoiceCustomerType = "individual" | "company";

export interface BuyerInvoiceInformationPayload {
  companyName?: string | null;
  companyId?: string | null;
  companyVAT?: string | null;
  companyAddress?: string | null;
  contactPerson?: string | null;
  individualName?: string | null;
  individualSurname?: string | null;
  registrationAddress?: string | null;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders() {
  const token = getToken();
  if (!token) {
    throw new Error("Errors.Auth.noToken");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function cleanValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeBuyerInvoiceInformation(
  payload: BuyerInvoiceInformationPayload
) {
  return {
    companyName: cleanValue(payload.companyName),
    companyId: cleanValue(payload.companyId),
    companyVAT: cleanValue(payload.companyVAT),
    companyAddress: cleanValue(payload.companyAddress),
    contactPerson: cleanValue(payload.contactPerson),
    individualName: cleanValue(payload.individualName),
    individualSurname: cleanValue(payload.individualSurname),
    registrationAddress: cleanValue(payload.registrationAddress),
  };
}

export function isBuyerInvoiceInformationComplete(
  customerType?: User["invoiceCustomerType"],
  info?: BuyerInvoiceInformation | null
) {
  if (!customerType) return false;

  const has = (value?: string | null) => Boolean(value?.trim());

  if (customerType === "individual") {
    return (
      has(info?.individualName) &&
      has(info?.individualSurname) &&
      has(info?.registrationAddress)
    );
  }

  return (
    has(info?.companyName) &&
    has(info?.companyId) &&
    has(info?.companyAddress) &&
    has(info?.contactPerson)
  );
}

export async function fetchBuyerInvoiceInformation(
  userDocumentId: string
): Promise<BuyerInvoiceInformation | null> {
  const query = QueryString.stringify(
    {
      filters: {
        users_permissions_user: {
          documentId: {
            $eq: userDocumentId,
          },
        },
      },
      populate: {
        users_permissions_user: {
          fields: ["documentId"],
        },
      },
      pagination: {
        page: 1,
        pageSize: 1,
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(
    `${API_URL}/api/buyer-invoice-informations?${query}`,
    {
      cache: "no-store",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load invoice information");
  }

  const payload = await response.json();
  return payload?.data?.[0] ?? null;
}

export async function saveBuyerInvoiceInformation(
  userId: number,
  existingDocumentId: string | undefined,
  payload: BuyerInvoiceInformationPayload
) {
  const data = {
    ...normalizeBuyerInvoiceInformation(payload),
    users_permissions_user: userId,
  };

  const response = await fetch(
    `${API_URL}/api/buyer-invoice-informations${
      existingDocumentId ? `/${existingDocumentId}` : ""
    }`,
    {
      method: existingDocumentId ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ data }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save invoice information");
  }

  const saved = await response.json();
  return saved?.data as BuyerInvoiceInformation;
}
