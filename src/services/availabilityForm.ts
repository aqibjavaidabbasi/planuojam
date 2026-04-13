import { createQuery, fetchAPIWithToken, postAPI, putAPI } from "./api";
import { triggerNotificationEmail } from "@/utils/emailTrigger";
import { getUsersByDocumentIds } from "./auth";

export interface AvailabilityInquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  serviceProvider: string; // user documentId
  listingDocumentId?: string;
  submissionStatus?: "new" | "underDiscussion" | "completed" | "rejected";
}

export interface AvailabilityInquiry extends AvailabilityInquiryPayload {
  id: number;
  documentId: string;
  createdAt: string;
}

/**
 * Submit a new availability inquiry (usually by guest)
 */
export async function createAvailabilityInquiry(data: AvailabilityInquiryPayload) {
  try {
    const body = { 
      data: {
        ...data,
        submissionStatus: data.submissionStatus || "new"
      } 
    };
    // Guest submission might not need a token if permissions are set to public in Strapi
    // But usually, we use postAPI or postAPIWithToken. 
    // If it's a public form, postAPI is better.
    const res = await postAPI("availability-forms", body);

    // TRIGGER EMAIL NOTIFICATION
    try {
      const providerDocId = data.serviceProvider;
      const listingDocId = data.listingDocumentId;

      // Parallel fetch for speed
      const [providerUsers, listingRes] = await Promise.all([
        getUsersByDocumentIds([providerDocId]),
        listingDocId ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingDocId}`).then(r => r.json()) : Promise.resolve(null)
      ]);

      const provider = providerUsers[0];
      const listingTitle = listingRes?.data?.title || "Your Listing";

      if (provider && provider.email) {
        triggerNotificationEmail('inquiry', provider.email, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          listingTitle,
        }, `New Availability Inquiry: ${listingTitle}`, provider.preferredLanguage || 'en');
      }
    } catch (triggerErr) {
      console.error("Failed to trigger inquiry email:", triggerErr);
    }

    return res;
  } catch (err) {
    console.error("Error creating availability inquiry:", err);
    throw err;
  }
}

/**
 * Get inquiries for a specific service provider
 */
export async function getProviderInquiries(providerDocumentId: string, locale?: string) {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("Errors.Auth.noToken");

    const query = createQuery({}, locale ? { locale } : {});
    const filters = {
      filters: {
        serviceProvider: { documentId: { $eq: providerDocumentId } }
      },
      sort: ["createdAt:desc"]
    };

    const res = await fetchAPIWithToken("availability-forms", query, filters, jwt);
    return Array.isArray(res?.data) ? (res.data as AvailabilityInquiry[]) : [];
  } catch (err) {
    console.error("Error fetching provider inquiries:", err);
    throw err;
  }
}

/**
 * Update the status of an inquiry
 */
export async function updateInquiryStatus(documentId: string, status: "new" | "underDiscussion" | "completed" | "rejected") {
  try {
    const body = { data: { submissionStatus: status } };
    const res = await putAPI(`availability-forms/${documentId}`, body);
    return res;
  } catch (err) {
    console.error("Error updating inquiry status:", err);
    throw err;
  }
}
