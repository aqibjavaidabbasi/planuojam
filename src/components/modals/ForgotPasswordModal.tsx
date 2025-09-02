"use client";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React from "react";
import Input from "../custom/Input";
import Button from "../custom/Button";
import { useForm } from "react-hook-form";
import { forgotPassword } from "@/services/auth";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const { siteSettings } = useSiteSettings();
  const t = useTranslations("Modals.ForgotPassword");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm();

  async function onSubmit(data: Record<string, unknown>) {
    await toast.promise(
      forgotPassword(data).then(() => {
        onClose();
      }),
      {
        loading: t("toasts.sending"),
        success: t("toasts.sent"),
        error: (err) => {
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return t("toasts.errorDefault");
        },
      }
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden relative">
          <Image
            alt="site logo"
            src={getCompleteImageUrl(siteSettings.siteLogo.url)}
            width={80}
            height={80}
            style={{ objectFit: "cover" }}
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm">{t("description")}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          type="email"
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          disabled={isSubmitting}
          {...register("email", {
            required: t("errors.emailRequired"),
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: t("errors.emailInvalid"),
            },
          })}
        />
        {errors?.email?.message && (
          <p className="text-red-500 text-sm">
            {errors.email.message as string}
          </p>
        )}

        <Button
          style="secondary"
          type="submit"
          extraStyles="!w-full"
          disabled={isSubmitting}
        >
          {t("sendResetLink")}
        </Button>
      </form>
    </div>
  );
}

export default ForgotPasswordModal;
