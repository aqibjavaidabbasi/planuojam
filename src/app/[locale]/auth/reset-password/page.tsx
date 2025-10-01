"use client";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { resetPassword } from "@/services/auth";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const t = useTranslations("Auth.ResetPassword");

  // Add state to track if password reset is successful
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    const resetData = {
      code,
      password: data.password,
      passwordConfirmation: data.confirmPassword,
    };
    await toast.promise(
      resetPassword(resetData).then(() => setResetSuccess(true)),
      {
        loading: t("resetting"),
        success: t("resetSuccessToast"),
        error: (err) => {
          if (typeof err === "string") return t(err);
          if (err && typeof err === "object" && "message" in err)
            return t(String(err.message));
          return t("resetFailed");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">{t("title")}</h2>
        {resetSuccess ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-100 border border-green-300 text-green-800 rounded p-4 w-full text-center">
              <p className="font-semibold mb-2">{t("resetSuccess")}</p>
              <p className="mb-2">{t("youCanLogin")}</p>
            </div>
            <Button
              type="button"
              style="primary"
              extraStyles="!w-full !rounded-md"
              onClick={() => router.push(`/auth/login`)}
            >
              {t("goToLogin")}
            </Button>
          </div>
        ) : (
          <>
            <form className="flex flex-col gap-4" id="resetPasswordForm" onSubmit={handleSubmit(onSubmit)}>
              <Input
                type="password"
                placeholder={t("newPasswordPlaceholder")}
                disabled={isSubmitting}
                {...register("password", {
                  required: t("passwordRequired"),
                  minLength: {
                    value: 8,
                    message: t("passwordMinLength"),
                  },
                })}
                required
              />
              {errors.password?.message && (
                <div className="text-red-600 text-sm text-center">
                  {String(errors.password.message)}
                </div>
              )}
              <Input
                type="password"
                placeholder={t("confirmNewPasswordPlaceholder")}
                disabled={isSubmitting}
                {...register("confirmPassword", {
                  required: t("confirmPasswordRequired"),
                  validate: (value) =>
                    value === watch("password") || t("passwordsDoNotMatch"),
                })}
                required
              />
              {errors.confirmPassword?.message && (
                <div className="text-red-600 text-sm text-center">
                  {String(errors.confirmPassword.message)}
                </div>
              )}
              <Button
                type="submit"
                style="primary"
                form="resetPasswordForm"
                extraStyles="!w-full !rounded-md"
                disabled={isSubmitting}
              >
                {t("resetCta")}
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground">
              <Link
                href={isSubmitting ? "#" : `/auth/login`}
                className={`hover:underline ${isSubmitting ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}`}
                tabIndex={isSubmitting ? -1 : 0}
                aria-disabled={isSubmitting}
                onClick={e => {
                  if (isSubmitting) e.preventDefault();
                }}
              >
                {t("backToLogin")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
