"use client";
import React, { useState } from "react";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "@/i18n/navigation";
import { emailConfirmation, resendEmailConfirmation } from "@/services/auth";
import { useTranslations } from "next-intl";

function EmailConfirmationPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [emailConfirm, setEmailConfirmed] = useState(false);
  const t = useTranslations("Auth.EmailConfirmation");

  const handleResend = async () => {
    const data = {
      email: user?.email,
    };
    await toast.promise(resendEmailConfirmation(data), {
      loading: t("resendLoading"),
      success: t("resendSuccess"),
      error: (err) => {
        // err is exactly what rejectWithValue() returned in the thunk
        if (typeof err === "string") return err;
        if (err && typeof err === "object" && "message" in err)
          return String(err.message);
        return t("resendFailed");
      },
    });
  };

  async function onSubmit(data: Record<string, string>) {
    const confirmationToken = data?.confirmation;

    await toast.promise(
      emailConfirmation(confirmationToken).then(() => {
          setEmailConfirmed(true); // set state on success
        }),
      {
        loading: t("confirming"),
        success: t("confirmed"),
        error: (err) => {
          // err is exactly what rejectWithValue() returned in the thunk
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
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
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Input
                  type="text"
                  label={t("tokenLabel")}
                  placeholder={t("tokenPlaceholder")}
                  {...register("confirmation", {
                    required: t("tokenRequired"),
                  })}
                />
                {errors.confirmation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmation.message as string}
                  </p>
                )}
                <Button type="submit" style="primary" extraStyles="!w-full mt-4">
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
