"use client";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { customResetPassword } from "@/services/authCustom";
import { useTranslations } from "next-intl";
import { AiOutlineCheckCircle } from "react-icons/ai";

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = (searchParams.get("email") || "").toLowerCase();
  const t = useTranslations("Auth.ResetPassword");
  const tGlobal = useTranslations();
  const OTP_LENGTH = 6;

  // Add state to track if password reset is successful
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; code: string; password: string; confirmPassword: string }>({
    defaultValues: { email: prefillEmail },
  });

  const passwordValue = watch("password") || "";
  const hasMinLen = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasDigit = /\d/.test(passwordValue);
  const strengthScore = useMemo(() => {
    return [hasMinLen, hasUpper, hasDigit].filter(Boolean).length;
  }, [hasMinLen, hasUpper, hasDigit]);

  type FormValues = { email: string; code: string; password: string; confirmPassword: string };
  const onSubmit = async (data: Record<string, unknown>) => {
    const resetData: { email: string; code: string; password: string } = {
      email: String((data as FormValues).email || "").trim().toLowerCase(),
      code: String((data as FormValues).code || "").trim(),
      password: (data as FormValues).password,
    };
    await toast.promise(
      customResetPassword(resetData).then(() => setResetSuccess(true)),
      {
        loading: t("resetting"),
        success: t("resetSuccessToast"),
        error: (err) => {
          const key = (err as { error?: { key?: string } })?.error?.key;
          if (key) return tGlobal(key);
          if (typeof err === "string") return t(err);
          if (err && typeof err === "object" && "message" in (err as Record<string, unknown>)) return t(String((err as Record<string, unknown>).message));
          return tGlobal("Errors.Auth.resetFailed");
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
                type="email"
                placeholder={tGlobal("Auth.Login.emailPlaceholder")}
                disabled={isSubmitting}
                {...register("email", {
                  required: tGlobal("Auth.Login.emailRequired"),
                })}
                required
              />
              <Input
                type="text"
                placeholder={tGlobal("Auth.EmailConfirmation.tokenPlaceholder")}
                disabled={isSubmitting}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_LENGTH}
                onInput={(e) => {
                  const target = e.currentTarget as HTMLInputElement;
                  const digits = target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
                  if (target.value !== digits) target.value = digits;
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
                  const target = e.currentTarget as HTMLInputElement;
                  target.value = text;
                }}
                {...register("code", {
                  required: tGlobal("Auth.EmailConfirmation.tokenRequired"),
                  minLength: { value: OTP_LENGTH, message: tGlobal("Auth.EmailConfirmation.tokenRequired") },
                  maxLength: { value: OTP_LENGTH, message: tGlobal("Auth.EmailConfirmation.tokenRequired") },
                  validate: (v) => (/^\d+$/.test(String(v)) && String(v).length === OTP_LENGTH) || tGlobal("Auth.EmailConfirmation.tokenRequired"),
                })}
                required
              />
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
              <div className="mt-1">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded transition-all ${
                      strengthScore === 0
                        ? "w-0 bg-transparent"
                        : strengthScore === 1
                        ? "w-1/3 bg-red-500"
                        : strengthScore === 2
                        ? "w-2/3 bg-yellow-500"
                        : "w-full bg-green-500"
                    }`}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                  <div className={`flex items-center gap-1 ${hasMinLen ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasMinLen ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaLength", { default: "8+ chars" })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasUpper ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaUpper", { default: "1 uppercase" })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasDigit ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasDigit ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaNumber", { default: "1 number" })}</span>
                  </div>
                </div>
              </div>
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
