"use client";
import React, { useMemo, useState } from "react";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { customConfirmEmail, customResendConfirmation } from "@/services/authCustom";
import { useTranslations } from "next-intl";

function EmailConfirmationPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const derivedEmail = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("pendingEmail") || "";
      return stored.trim().toLowerCase();
    } catch {
      return "";
    }
  }, []);
  const [emailConfirm, setEmailConfirmed] = useState(false);
  const t = useTranslations("Auth.EmailConfirmation");
  const tGlobal = useTranslations();
  const OTP_LENGTH = 6;

  const handleResend = async () => {
    if (!derivedEmail) {
      toast.error(tGlobal("Errors.Auth.emailNotRegistered"));
      return;
    }
    const data = { email: derivedEmail };
    await toast.promise(customResendConfirmation(data), {
      loading: t("resendLoading"),
      success: t("resendSuccess"),
      error: (err) => {
        const key = err?.error?.key as string | undefined;
        if (key) return tGlobal(key);
        if (typeof err === "string") return t(err);
        if (err && typeof err === "object" && "message" in (err as Record<string, unknown>))
          return t(String((err as Record<string, unknown>).message));
        return t("resendFailed");
      },
    });
  };

  async function onSubmit(data: Record<string, string>) {
    const confirmationToken = data?.confirmation;
    if (!derivedEmail) {
      toast.error(tGlobal("Errors.Auth.emailNotRegistered"));
      return;
    }
    const email = derivedEmail;

    await toast.promise(
      customConfirmEmail({ email: String(email || "").trim().toLowerCase(), code: String(confirmationToken || "").trim() })
        .then(() => {
          setEmailConfirmed(true);
          try { sessionStorage.removeItem("pendingEmail"); } catch {}
        }),
      {
        loading: t("confirming"),
        success: t("confirmed"),
        error: (err) => {
          const key = (err as { error?: { key?: string } })?.error?.key;
          if (key) return tGlobal(key);
          if (typeof err === "string") return t(err);
          if (err && typeof err === "object" && "message" in (err as Record<string, unknown>))
            return t(String((err as Record<string, unknown>).message));
          return t("confirmFailed");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">{t("title")}</h2>
        <div className="text-center text-base">
          <span>
            {t("instruction")}
          </span>
          <br />
          <span className="text-muted-foreground text-sm">
            {t("resendHint")}
          </span>
        </div>
        {emailConfirm ? (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded p-4 text-center flex flex-col items-center justify-center">
            <p className="font-semibold mb-2">{t("success")}</p>
            <p className="mb-2">{t("youCanLogin")}</p>
            <Button onClick={()=>router.push(`/auth/login`)} type="button" style="link">
                {t("login")}
              </Button>
          </div>
        ) : (
          <>
            <div>
              <form
                action=""
                id="emailConfirmationForm"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Input
                  type="text"
                  label={t("tokenLabel")}
                  placeholder={t("tokenPlaceholder")}
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
                  {...register("confirmation", {
                    required: t("tokenRequired"),
                    minLength: { value: OTP_LENGTH, message: t("tokenRequired") },
                    maxLength: { value: OTP_LENGTH, message: t("tokenRequired") },
                    validate: (v) => (/^\d+$/.test(String(v)) && String(v).length === OTP_LENGTH) || t("tokenRequired"),
                  })}
                />
                {errors.confirmation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmation.message as string}
                  </p>
                )}
                <Button type="submit" style="primary" extraStyles="!w-full mt-4" form="emailConfirmationForm">
                  {t("confirmCta")}
                </Button>
              </form>
            </div>
            <div className="w-full flex items-center justify-center">
              <Button onClick={handleResend} type="button" style="link">
                {t("resendCta")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailConfirmationPage;
