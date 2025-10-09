"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/custom/Modal";
import Input from "@/components/custom/Input";
import Select from "@/components/custom/Select";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { createPromotionWithStars } from "@/services/promotion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

type UserListingOption = { id: string; title: string };

interface CreatePromotionFormProps {
  isOpen: boolean;
  onClose: () => void;
  listings: UserListingOption[];
  userId: number | undefined;
  userStars: number;
  userDocumentId?: string;
  onCreated?: () => void;
}

type FormValues = {
  listingDocumentId: string;
  starsUsed: number;
  startDate?: string;
  endDate?: string;
  maxClickPerDay?: number;
  starsPerClick?: number;
  maxStarsLimit?: number;
  successPercentage?: number;
};

const CreatePromotionForm: React.FC<CreatePromotionFormProps> = ({
  isOpen,
  onClose,
  listings,
  userId,
  userStars,
  userDocumentId,
  onCreated,
}) => {
  const t = useTranslations("Profile");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      listingDocumentId: "",
      starsUsed: 0,
      startDate: "",
      endDate: "",
      maxClickPerDay: 0,
      starsPerClick: 0,
      maxStarsLimit: 0,
      successPercentage: 0,
    },
  });

  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const onSubmit = async (values: FormValues) => {
    try {
      const usedStars = Number(values.maxStarsLimit || 0);
      if (usedStars > 0 && userStars < usedStars) {
        toast.error(t("promotions.errors.insufficientStars", { default: "Not enough stars" }));
        return;
      }
      await toast.promise(
        createPromotionWithStars({
          listingDocumentId: values.listingDocumentId,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
          maxClickPerDay: values.maxClickPerDay ? Number(values.maxClickPerDay) : undefined,
          starsPerClick: values.starsPerClick ? Number(values.starsPerClick) : undefined,
          maxStarsLimit: values.maxStarsLimit ?? Number(values.maxStarsLimit),
          userDocumentId: userDocumentId,
          currentUserId: userId ?? 0,
          currentUserStars: userStars,
        }),
        {
          loading: t("promotions.creating", { default: "Creating..." }),
          success: t("promotions.created", { default: "Promotion created successfully" }),
          error: (err) => (typeof err === "string" ? err : t(err?.message) || t("promotions.failed")),
        }
      );
      // Optimistically update local user stars in Redux
      try {
        const newStars = Math.max(0, Number(userStars) - Number(usedStars));
        if (!Number.isNaN(newStars) && currentUser) {
          dispatch(setUser({ ...currentUser, totalStars: newStars }));
        }
      } catch {}
      onCreated?.();
      reset();
      onClose();
    } catch {
      // toast already handled in promise
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      size="md"
      title={<span className="pr-8">{t("promotions.title")}</span>}
      footer={
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button style="ghost" type="button" onClick={onClose}>
            {t("promotions.cancel")}
          </Button>
          <Button
            style="primary"
            type="submit"
            form="create-promotion-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("promotions.creating") : t("promotions.create")}
          </Button>
        </div>
      }
    >
      <form id="create-promotion-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl py-4">
        <div>
          <Select
            options={listings.map((l) => ({ value: l.id, label: l.title }))}
            placeholder={t("promotions.selectListing")}
            disabled={isSubmitting}
            required
            label={t("promotions.selectListing")}
            {...register("listingDocumentId", { required: true })}
          />
          {errors.listingDocumentId && (
            <p className="text-xs text-red-500 mt-1">{t("promotions.errors.required", { default: "Required" })}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              type="date"
              label={t("promotions.startDate")}
              disabled={isSubmitting}
              {...register("startDate", { required: true })}
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
              {...register("endDate", { required: true })}
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
            {...register("maxClickPerDay", { valueAsNumber: true, min: 1 })}
          />
          <Input
            type="number"
            label={t("promotions.starsPerClick")}
            placeholder="1"
            disabled={isSubmitting}
            {...register("starsPerClick", { valueAsNumber: true, min: 1 })}
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
      </form>
    </Modal>
  );
};

export default CreatePromotionForm;
