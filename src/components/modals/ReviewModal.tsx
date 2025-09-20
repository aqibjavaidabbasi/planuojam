"use client";

import React, { useState } from "react";
import Modal from "@/components/custom/Modal";
import TextArea from "@/components/custom/TextArea";
import Button from "@/components/custom/Button";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { createReview } from "@/services/review";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingDocumentId: string;
  userDocumentId: string;
  onCreated?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, listingDocumentId, userDocumentId, onCreated }) => {
  const t = useTranslations("Reviews.Modal");
  const [rating, setRating] = useState<number>(5);
  const [reviewBody, setReviewBody] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error(t("errors.invalidRating", { default: "Please select a rating between 1 and 5." }));
      return;
    }
    if (!reviewBody.trim()) {
      toast.error(t("errors.emptyBody", { default: "Please write your review." }));
      return;
    }

    try {
      setSubmitting(true);
      await toast.promise(
        createReview({
          review: {
            rating,
            reviewBody: reviewBody.trim(),
            reviewStatus: "Pending Approval",
          },
          author: userDocumentId,
          listing: listingDocumentId,
        }),
        {
          loading: t("toasts.creating", { default: "Submitting review..." }),
          success: t("toasts.created", { default: "Review submitted." }),
          error: (err) => (typeof err === "string" ? err : err?.message || t("toasts.failed", { default: "Failed to submit review." })),
        }
      );
      onCreated?.();
      onClose();
      setRating(5);
      setReviewBody("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="pr-8">{t("title", { default: "Write a review" })}</span>}
      footer={
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button style="ghost" onClick={onClose} type="button">
            {t("actions.cancel", { default: "Cancel" })}
          </Button>
          <Button style="primary" type="submit" form="review-form" disabled={submitting}>
            {submitting ? t("actions.submitting", { default: "Submitting..." }) : t("actions.submit", { default: "Submit" })}
          </Button>
        </div>
      }
    >
      <form id="review-form" onSubmit={onSubmit} className="flex flex-col gap-4 py-4">
        <label className="text-sm font-medium text-gray-700">
          {t("fields.rating", { default: "Rating" })}
        </label>
        <select
          className="bg-white border border-border rounded-md h-9 px-2 text-sm w-32"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={submitting}
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <TextArea
          label={t("fields.review", { default: "Your review" })}
          rows={4}
          value={reviewBody}
          onChange={(e) => setReviewBody(e.target.value)}
          disabled={submitting}
        />
      </form>
    </Modal>
  );
};

export default ReviewModal;
