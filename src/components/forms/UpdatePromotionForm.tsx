"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/custom/Modal";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { updatePromotion } from "@/services/promotion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUserData as updateUserDataService } from "@/services/auth";
import { setUser } from "@/store/slices/authSlice";
import { createStarUsageLog } from "@/services/promotion";

export interface UpdatePromotionFormValues {
  startDate?: string;
  endDate?: string | null;
  maxClickPerDay?: number | null;
  starsPerClick?: number | null;
  maxStarsLimit?: number | null;
  promotionStatus?: string;
  // Provided via initialValues for refund calculation when ending now
  starsUsed?: number | null;
}

interface UpdatePromotionFormProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string;
  initialValues: UpdatePromotionFormValues;
  onUpdated?: () => void;
}

const UpdatePromotionForm: React.FC<UpdatePromotionFormProps> = ({
  isOpen,
  onClose,
  promotionId,
  initialValues,
  onUpdated,
}) => {
  const t = useTranslations("Profile");
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdatePromotionFormValues & { endNow?: boolean }>({
    defaultValues: {
      startDate: initialValues.startDate ?? undefined,
      endDate: (initialValues.endDate ?? undefined) as string | undefined,
      maxClickPerDay: initialValues.maxClickPerDay ?? undefined,
      starsPerClick: initialValues.starsPerClick ?? undefined,
      maxStarsLimit: initialValues.maxStarsLimit ?? undefined,
      promotionStatus: initialValues.promotionStatus ?? undefined,
      starsUsed: initialValues.starsUsed ?? undefined,
      endNow: false,
    },
  });

  const onSubmit = async (values: UpdatePromotionFormValues & { endNow?: boolean }) => {
    try {
      const payload: Record<string, unknown> = {
        startDate: values.startDate || null,
        endDate: values.endDate ?? null,
        maxClickPerDay: values.maxClickPerDay ?? null,
        starsPerClick: values.starsPerClick ?? null,
        maxStarsLimit: values.maxStarsLimit ?? null,
      };

      if (values.endNow) {
        payload["promotionStatus"] = "ended";
        // Optionally also set endDate to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        payload["endDate"] = `${yyyy}-${mm}-${dd}`;
      }

      await toast.promise(
        updatePromotion(promotionId, { data: payload }),
        {
          loading: t("promotions.updating", { default: "Updating..." }),
          success: t("promotions.updated", { default: "Promotion updated" }),
          error: (err) => (typeof err === "string" ? err : t(err?.message) || t("promotions.failed")),
        }
      );

      // If ended now, refund unspent stars back to user (backend + redux)
      if (values.endNow) {
        const maxLimit = Number(initialValues.maxStarsLimit ?? 0);
        const used = Number(initialValues.starsUsed ?? 0);
        const refund = Math.max(0, maxLimit - used);
        if (refund > 0 && currentUser?.id) {
          const newStars = Math.max(0, Number(currentUser.totalStars ?? 0) + refund);
          try {
            await updateUserDataService(currentUser.id, { totalStars: newStars });
            dispatch(setUser({ ...currentUser, totalStars: newStars }));
            // Log refund in star-usage-log (non-blocking)
            try {
              await createStarUsageLog({
                starsUsed: refund,
                type: "refund",
                promotionDocumentId: String(promotionId),
              });
            } catch (e) {
              console.warn("Failed to create star-usage-log (refund)", e);
            }
          } catch (err) {
            console.warn("Failed to refund stars on manual promotion end", err);
          }
        }
      }

      onUpdated?.();
      reset();
      onClose();
    } catch {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      size="md"
      title={<span className="pr-8">{t("promotions.updateTitle", { default: "Update Promotion" })}</span>}
      footer={
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button style="ghost" type="button" onClick={onClose}>
            {t("promotions.cancel")}
          </Button>
          <Button
            style="primary"
            type="submit"
            form="update-promotion-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("promotions.updating", { default: "Updating..." }) : t("promotions.update", { default: "Update" })}
          </Button>
        </div>
      }
    >
      <form id="update-promotion-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              type="date"
              label={t("promotions.startDate")}
              disabled={isSubmitting}
              {...register("startDate")}
            />
            {errors.startDate && (
              <p className="text-xs text-red-500 mt-1">{t("promotions.errors.required")}</p>
            )}
          </div>
          <div>
            <Input
              type="date"
              label={t("promotions.endDate")}
              disabled={isSubmitting}
              {...register("endDate")}
            />
            {errors.endDate && (
              <p className="text-xs text-red-500 mt-1">{t("promotions.errors.required")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label={t("promotions.maxClickPerDay")}
            placeholder="10"
            disabled={isSubmitting}
            {...register("maxClickPerDay", { valueAsNumber: true, min: 0 })}
          />
          <Input
            type="number"
            label={t("promotions.starsPerClick")}
            placeholder="1"
            disabled={isSubmitting}
            {...register("starsPerClick", { valueAsNumber: true, min: 0 })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label={t("promotions.maxStarsLimit", { default: "Max Stars Limit" })}
            min={0}
            placeholder="1000"
            disabled={isSubmitting}
            {...register("maxStarsLimit", { valueAsNumber: true, min: 0 })}
          />
        </div>

        <label className="flex items-center gap-2 mt-2">
          <input type="checkbox" {...register("endNow")} />
          <span>{t("promotions.endNow", { default: "End now" })}</span>
        </label>
      </form>
    </Modal>
  );
};

export default UpdatePromotionForm;
