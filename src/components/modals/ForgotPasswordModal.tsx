"use client";
import React from "react";
import Input from "../custom/Input";
import Button from "../custom/Button";
import { useForm } from "react-hook-form";
import { customForgotPassword } from "@/services/authCustom";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Logo from "@/components/global/Logo";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const router = useRouter();
  const t = useTranslations("Modals.ForgotPassword");
  const tGlobal = useTranslations();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm();

  async function onSubmit(data: Record<string, unknown>) {
    const email = String(data?.email || "").trim();
    await toast.promise(
      (async () => {
        await customForgotPassword({ email });
        onClose();
        // Navigate user to OTP reset page where they can enter code + new password
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      })(),
      {
        loading: t("toasts.sending"),
        success: t("toasts.sent"),
        error: (err) => {
          const key = (err as { error?: { key?: string } })?.error?.key;
          if (key) return tGlobal(key);
          if (typeof err === "string") return t(err);
          if (err && typeof err === "object" && "message" in (err as Record<string, unknown>))
            return t(String((err as Record<string, unknown>).message));
          return t("toasts.errorDefault");
        },
      }
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden relative">
          <Logo className="w-20 h-20" variant="sm" onClick={() => router.push('/')} />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm">{t("description")}</p>
      </div>

      <form className="space-y-6" id="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
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
          form="forgot-password-form"
          disabled={isSubmitting}
        >
          {t("sendResetLink")}
        </Button>
      </form>
    </div>
  );
}

export default ForgotPasswordModal;
