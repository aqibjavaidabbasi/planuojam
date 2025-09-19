import { createQuery, deleteAPI, fetchAPIWithToken, postAPIWithToken, putAPI } from "./api";

export type ReviewStatus = "Pending Approval" | "Approved" | "Rejected";

export interface ReviewContentPayload {
  rating: number;
  reviewBody: string;
  reviewStatus?: ReviewStatus;
}

export interface CreateReviewPayload {
  review: ReviewContentPayload;
  author: string; // user documentId
  listing: string; // listing documentId
}

export interface ReviewItem {
  id: number;
  documentId: string;
  review: {
    rating: number;
    reviewBody: string;
    reviewStatus: ReviewStatus;
  };
  author?: { documentId?: string; username?: string };
  listing?: { documentId?: string; title?: string };
}

export async function createReview(data: CreateReviewPayload) {
  try {
    const body: Record<string, unknown> = { data };
    const query = createQuery({ listing: { populate: "*" }, author: { populate: "*" } });
    const res = await postAPIWithToken("reviews", body, {}, query);
    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to create review. Please try again later.");
  }
}

export async function updateReview(id: string, data: Partial<CreateReviewPayload>) {
  try {
    const body: Record<string, unknown> = { data };
    const res = await putAPI(`reviews/${id}`, body);
    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update review. Please try again later.");
  }
}

export async function deleteReview(id: string) {
  try {
    const res = await deleteAPI(`reviews/${id}`);
    return res;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to delete review. Please try again later.");
  }
}

export async function getReviewsByListing(listingDocumentId: string) : Promise<ReviewItem[]> {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("No authentication token found. Please log in.");

    const populate = { listing: { populate: "*" }, author: { populate: "*" } };
    const filters = { filters: { listing: { documentId: { $eq: listingDocumentId } } } };
    const query = createQuery(populate);
    const res = await fetchAPIWithToken("reviews", query, filters, jwt);
    return Array.isArray(res?.data) ? (res.data as ReviewItem[]) : [];
  } catch (err) {
    console.error(err);
    throw new Error("Failed to load reviews. Please try again later.");
  }
}

export async function getUserReviewForListing(listingDocumentId: string, userDocumentId: string): Promise<ReviewItem | null> {
  try {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!jwt) throw new Error("No authentication token found. Please log in.");

    const populate = { listing: { populate: "*" }, author: { populate: "*" } };
    const filters = {
      filters: {
        $and: [
          { listing: { documentId: { $eq: listingDocumentId } } },
          { author: { documentId: { $eq: userDocumentId } } },
        ],
      },
    };
    const query = createQuery(populate);
    const res = await fetchAPIWithToken("reviews", query, filters, jwt);
    const list: ReviewItem[] = Array.isArray(res?.data) ? (res.data as ReviewItem[]) : [];
    return list[0] || null;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to load user review. Please try again later.");
  }
}
