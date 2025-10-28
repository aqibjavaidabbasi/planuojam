import { createQuery, postAPIWithToken } from "./api";

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
